import { NextResponse } from 'next/server'
import { getRazorpay, isRazorpayConfigured } from '@/lib/razorpay'
import crypto from 'crypto'

/**
 * Create a Razorpay order for:
 * - Order advance payment (type=advance, orderId=...)
 * - Order remaining payment (type=remaining, orderId=...)
 * - Subscription purchase (type=subscription, planId=...)
 *
 * If Razorpay is NOT configured, runs in DEMO mode:
 * returns a fake orderId starting with "demo_" so the frontend can proceed.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, orderId, planId, amount, userId, description } = body

    if (!type || !['advance', 'remaining', 'subscription'].includes(type)) {
      return NextResponse.json({ error: 'Invalid payment type' }, { status: 400 })
    }

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    // Razorpay expects amount in paise
    const amountPaise = Math.round(Number(amount) * 100)
    const receipt = `${type}_${orderId || planId || 'order'}_${Date.now()}`.slice(0, 40)

    // ─── Demo mode (no real Razorpay keys configured) ──────────────────────
    if (!isRazorpayConfigured()) {
      const demoOrderId = `demo_${type}_${crypto.randomBytes(8).toString('hex')}`
      return NextResponse.json({
        orderId: demoOrderId,
        amount: amountPaise,
        currency: 'INR',
        demoMode: true,
        keyId: null,
        message: 'Running in demo mode. Configure RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET for live payments.',
      })
    }

    // ─── Real Razorpay mode ────────────────────────────────────────────────
    const razorpay = getRazorpay()!
    const notes: Record<string, string> = { type }
    if (orderId) notes.orderId = orderId
    if (planId) notes.planId = planId
    if (userId) notes.userId = userId

    const options = {
      amount: amountPaise,
      currency: 'INR',
      receipt,
      notes,
    }

    const rzpOrder = await razorpay.orders.create(options)

    return NextResponse.json({
      orderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      demoMode: false,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
    })
  } catch (error: any) {
    console.error('Razorpay create-order error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to create payment order' },
      { status: 500 }
    )
  }
}
