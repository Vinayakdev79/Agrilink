import { supabase } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { SUBSCRIPTION_PLANS } from '@/lib/razorpay'

/**
 * GET /api/subscriptions
 *   ?userId=...          -> returns user's active subscription + history
 *   (no params)          -> returns all available plans
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      // Return plan catalogue
      return NextResponse.json({
        plans: Object.values(SUBSCRIPTION_PLANS),
      })
    }

    // Fetch user's current subscription
    const { data: user, error } = await supabase
      .from('User')
      .select('id, name, email, role, subscriptionTier, subscriptionStatus, subscriptionExpiry, subscriptionAmount, subscriptionStartedAt, isSponsored, sponsoredExpiry')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      console.error('Subscription fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 })
    }

    // Determine if subscription is currently active
    const now = new Date()
    let isActive = false
    let tier = user?.subscriptionTier || 'free'
    let expiry = user?.subscriptionExpiry || null

    if (user?.subscriptionExpiry && new Date(user.subscriptionExpiry) > now) {
      isActive = true
    } else if (user?.subscriptionTier && user.subscriptionTier !== 'free') {
      // Expired - reset
      tier = 'free'
      isActive = false
    }

    // Fetch subscription history
    let history: any[] = []
    try {
      const { data: histData } = await supabase
        .from('Subscription')
        .select('*')
        .eq('userId', userId)
        .order('createdAt', { ascending: false })
        .limit(20)
      history = histData || []
    } catch {
      // Table may not exist
    }

    return NextResponse.json({
      user: user ? { ...user, subscriptionTier: tier, subscriptionStatus: isActive ? 'active' : 'inactive' } : null,
      isActive,
      tier,
      expiry,
      history,
      plans: Object.values(SUBSCRIPTION_PLANS),
    })
  } catch (error) {
    console.error('Subscriptions error:', error)
    return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 })
  }
}

/**
 * PATCH /api/subscriptions
 * Cancel a user's active subscription (admin or self-service)
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { userId, action } = body

    if (!userId || !action) {
      return NextResponse.json({ error: 'Missing userId or action' }, { status: 400 })
    }

    if (action === 'cancel') {
      const updateData: Record<string, unknown> = {
        subscriptionStatus: 'cancelled',
        subscriptionTier: 'free',
        subscriptionExpiry: null,
        updatedAt: new Date().toISOString(),
      }
      const { error } = await supabase
        .from('User')
        .update(updateData)
        .eq('id', userId)

      if (error) {
        // Fallback without new columns
        const fb = await supabase
          .from('User')
          .update({ subscriptionTier: 'free', subscriptionExpiry: null, updatedAt: new Date().toISOString() })
          .eq('id', userId)
        if (fb.error) {
          return NextResponse.json({ error: 'Failed to cancel' }, { status: 500 })
        }
      }
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('Subscription PATCH error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
