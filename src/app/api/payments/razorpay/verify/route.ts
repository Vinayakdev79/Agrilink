import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-server'
import { isRazorpayConfigured } from '@/lib/razorpay'
import crypto from 'crypto'

/**
 * Verify a Razorpay payment signature and persist the result.
 *
 * Body:
 *  - type: 'advance' | 'remaining' | 'subscription'
 *  - razorpayOrderId, razorpayPaymentId, razorpaySignature
 *  - orderId (for advance/remaining), planId + userId (for subscription)
 *  - amount (in rupees, for demo-mode bookkeeping)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      type,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      orderId,
      planId,
      userId,
      amount,
    } = body

    if (!type || !['advance', 'remaining', 'subscription'].includes(type)) {
      return NextResponse.json({ error: 'Invalid payment type' }, { status: 400 })
    }

    // ─── Demo mode: auto-verify ────────────────────────────────────────────
    const demoMode = !isRazorpayConfigured() || (razorpayOrderId && razorpayOrderId.startsWith('demo_'))

    if (!demoMode) {
      // Real signature verification
      if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        return NextResponse.json({ error: 'Missing payment fields' }, { status: 400 })
      }
      const expected = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex')
      if (expected !== razorpaySignature) {
        return NextResponse.json({ error: 'Payment signature verification failed' }, { status: 400 })
      }
    }

    // ─── Persist the verified payment ──────────────────────────────────────
    if (type === 'advance' || type === 'remaining') {
      if (!orderId) {
        return NextResponse.json({ error: 'Missing orderId' }, { status: 400 })
      }

      const updateData: Record<string, unknown> = {
        paymentStatus: type === 'advance' ? 'advance_paid' : 'full_paid',
        updatedAt: new Date().toISOString(),
      }
      if (type === 'advance') {
        updateData.razorpayAdvanceOrderId = razorpayOrderId
        updateData.razorpayAdvancePaymentId = razorpayPaymentId
        updateData.advancePaidAt = new Date().toISOString()
      } else {
        updateData.razorpayRemainingOrderId = razorpayOrderId
        updateData.razorpayRemainingPaymentId = razorpayPaymentId
        updateData.remainingPaidAt = new Date().toISOString()
      }

      // Try full update first, fall back to paymentStatus-only
      let { data: order, error } = await supabase
        .from('Order')
        .update(updateData)
        .eq('id', orderId)
        .select()
        .single()

      if (error) {
        // Retry with just paymentStatus + remainingPaidAt
        const fallbackData: Record<string, unknown> = {
          paymentStatus: updateData.paymentStatus,
          updatedAt: new Date().toISOString(),
        }
        if (type === 'remaining') {
          fallbackData.remainingPaidAt = new Date().toISOString()
        }
        const fallbackResult = await supabase
          .from('Order')
          .update(fallbackData)
          .eq('id', orderId)
          .select()
          .single()
        if (fallbackResult.error) {
          console.error('Payment persist error:', fallbackResult.error)
          return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
        }
        order = fallbackResult.data
      }

      // Create PlatformRevenue entry for the platform fee (only on remaining payment, to avoid double-counting)
      if (type === 'remaining') {
        try {
          const { data: fullOrder } = await supabase
            .from('Order')
            .select('totalPrice, platformFee, sellerId')
            .eq('id', orderId)
            .single()
          if (fullOrder?.platformFee && fullOrder.platformFee > 0) {
            await supabase.from('PlatformRevenue').insert({
              orderId,
              type: 'platform_fee',
              amount: fullOrder.platformFee,
              userId: fullOrder.sellerId,
              description: `Platform fee ₹${fullOrder.platformFee} on order ${orderId.slice(-8)}`,
            })
          }
        } catch (revErr) {
          console.warn('Could not create platform_fee revenue entry:', revErr)
        }
      }

      return NextResponse.json({
        verified: true,
        demoMode,
        order,
        paymentStatus: updateData.paymentStatus,
      })
    }

    // ─── Subscription payment ──────────────────────────────────────────────
    if (type === 'subscription') {
      if (!planId || !userId) {
        return NextResponse.json({ error: 'Missing planId or userId' }, { status: 400 })
      }

      const PLANS: Record<string, { price: number; durationDays: number; tier: string; label: string }> = {
        producer_pro: { price: 999, durationDays: 30, tier: 'producer_pro', label: 'Producer Pro' },
        transporter_pro: { price: 799, durationDays: 30, tier: 'transporter_pro', label: 'Transporter Pro' },
        buyer_pro: { price: 499, durationDays: 30, tier: 'buyer_pro', label: 'Buyer Pro' },
        sponsored: { price: 1499, durationDays: 30, tier: 'sponsored', label: 'Sponsored Listing' },
      }
      const plan = PLANS[planId]
      if (!plan) {
        return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
      }

      const now = new Date()
      const expiresAt = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000)

      // Record subscription payment
      try {
        await supabase.from('Subscription').insert({
          userId,
          plan: planId,
          amount: plan.price,
          durationDays: plan.durationDays,
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature,
          status: 'paid',
          startsAt: now.toISOString(),
          expiresAt: expiresAt.toISOString(),
        })
      } catch (subErr) {
        console.warn('Could not insert Subscription row:', subErr)
      }

      // Activate subscription on User
      const userUpdate: Record<string, unknown> = {
        subscriptionTier: plan.tier,
        subscriptionStatus: 'active',
        subscriptionAmount: plan.price,
        subscriptionPaymentId: razorpayPaymentId,
        subscriptionStartedAt: now.toISOString(),
        subscriptionExpiry: expiresAt.toISOString(),
        updatedAt: now.toISOString(),
      }
      if (planId === 'sponsored') {
        userUpdate.isSponsored = true
        userUpdate.sponsoredExpiry = expiresAt.toISOString()
      }

      let { data: updatedUser, error: userErr } = await supabase
        .from('User')
        .update(userUpdate)
        .eq('id', userId)
        .select()
        .single()

      if (userErr) {
        // Fallback without new columns
        const fallbackUserUpdate: Record<string, unknown> = {
          updatedAt: now.toISOString(),
        }
        if (planId === 'sponsored') {
          fallbackUserUpdate.isSponsored = true
          fallbackUserUpdate.sponsoredExpiry = expiresAt.toISOString()
        } else {
          fallbackUserUpdate.subscriptionTier = plan.tier
          fallbackUserUpdate.subscriptionExpiry = expiresAt.toISOString()
        }
        const fb = await supabase
          .from('User')
          .update(fallbackUserUpdate)
          .eq('id', userId)
          .select()
          .single()
        if (fb.error) {
          console.error('User subscription update error:', fb.error)
          return NextResponse.json({ error: 'Failed to activate subscription' }, { status: 500 })
        }
        updatedUser = fb.data
      }

      // Create PlatformRevenue entry
      try {
        await supabase.from('PlatformRevenue').insert({
          userId,
          type: 'subscription',
          amount: plan.price,
          description: `${plan.label} subscription activated (${plan.durationDays} days)`,
        })
      } catch (revErr) {
        console.warn('Could not insert subscription revenue:', revErr)
      }

      return NextResponse.json({
        verified: true,
        demoMode,
        user: updatedUser,
        subscription: {
          plan: planId,
          tier: plan.tier,
          amount: plan.price,
          expiresAt: expiresAt.toISOString(),
        },
      })
    }

    return NextResponse.json({ error: 'Unhandled payment type' }, { status: 400 })
  } catch (error: any) {
    console.error('Razorpay verify error:', error)
    return NextResponse.json(
      { error: error?.message || 'Payment verification failed' },
      { status: 500 }
    )
  }
}
