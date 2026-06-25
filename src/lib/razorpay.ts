import Razorpay from 'razorpay'

/**
 * Returns a Razorpay instance if configured, otherwise null (demo mode).
 * In demo mode, payments auto-succeed without calling Razorpay.
 */
export function getRazorpay(): Razorpay | null {
  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keyId || !keySecret || keyId.trim() === '' || keySecret.trim() === '') {
    return null
  }
  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  })
}

export function isRazorpayConfigured(): boolean {
  return getRazorpay() !== null
}

/**
 * Compute the platform fee based on the new revenue model:
 * - ₹1000 flat if order subtotal > ₹10,000
 * - ₹0 if order subtotal ≤ ₹10,000
 */
export function computePlatformFee(subtotal: number): number {
  return subtotal > 10000 ? 1000 : 0
}

/**
 * Subscription plans (per month, in INR).
 * Each plan unlocks premium features for the role.
 */
export const SUBSCRIPTION_PLANS = {
  producer_pro: {
    id: 'producer_pro',
    label: 'Producer Pro',
    price: 999,
    durationDays: 30,
    features: [
      'Unlimited product listings',
      'Priority placement in marketplace',
      'Verified badge on profile',
      'Advanced analytics dashboard',
      'Direct chat with all buyers',
      'Sponsored listing (1 free per month)',
    ],
    role: 'producer',
  },
  transporter_pro: {
    id: 'transporter_pro',
    label: 'Transporter Pro',
    price: 799,
    durationDays: 30,
    features: [
      'Priority access to new shipments',
      'Lower platform commission (3% vs 5%)',
      'Verified transporter badge',
      'Performance analytics dashboard',
      'Direct chat with producers',
      'Unlimited bids per day',
    ],
    role: 'transporter',
  },
  buyer_pro: {
    id: 'buyer_pro',
    label: 'Buyer Pro',
    price: 499,
    durationDays: 30,
    features: [
      'Unlimited orders per month',
      'Zero platform fee on orders below ₹10,000',
      'Priority customer support',
      'Advanced sourcing filters',
      'Saved supplier lists',
      'Bulk order tools',
    ],
    role: 'buyer',
  },
  sponsored: {
    id: 'sponsored',
    label: 'Sponsored Listing',
    price: 1499,
    durationDays: 30,
    features: [
      'Top placement in marketplace for 30 days',
      'Sponsored badge on your listings',
      'Featured in category searches',
      'Premium visibility to all buyers',
    ],
    role: 'producer',
  },
} as const

export type SubscriptionPlanId = keyof typeof SUBSCRIPTION_PLANS

export function getPlan(planId: string) {
  return (SUBSCRIPTION_PLANS as Record<string, any>)[planId] || null
}
