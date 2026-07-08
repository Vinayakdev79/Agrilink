'use client'

/**
 * Client-side Razorpay checkout helper.
 *
 * Loads the Razorpay checkout.js script on demand and opens the payment modal.
 * In demo mode (no real Razorpay keys), it auto-succeeds without opening a modal.
 *
 * Usage:
 *   const result = await openRazorpayCheckout({
 *     orderId,        // from /api/payments/razorpay/create-order
 *     amount,         // in paise
 *     keyId,          // nullable (null = demo mode)
 *     demoMode,       // boolean
 *     name, description, prefill,
 *     onSuccess,      // (paymentId, signature, orderId) => void
 *     onDismiss,      // () => void
 *   })
 */

declare global {
  interface Window {
    Razorpay?: any
  }
}

let scriptPromise: Promise<boolean> | null = null

function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false)
  if (window.Razorpay) return Promise.resolve(true)
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise((resolve) => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => {
      scriptPromise = null
      resolve(false)
    }
    document.body.appendChild(script)
  })

  return scriptPromise
}

export interface RazorpayCheckoutOptions {
  orderId: string
  amount: number // in paise
  currency?: string
  keyId: string | null
  demoMode: boolean
  name?: string
  description?: string
  prefill?: { name?: string; email?: string; contact?: string }
  onSuccess: (paymentId: string, signature: string, orderId: string) => void
  onDismiss?: () => void
}

export async function openRazorpayCheckout(
  opts: RazorpayCheckoutOptions
): Promise<void> {
  const {
    orderId,
    amount,
    currency = 'INR',
    keyId,
    demoMode,
    name = 'AgriLink',
    description = 'Payment',
    prefill,
    onSuccess,
    onDismiss,
  } = opts

  // ─── Demo mode: skip the modal and auto-succeed ──────────────────────────
  if (demoMode || !keyId) {
    // Simulate a small delay so the UI shows a processing state
    await new Promise((r) => setTimeout(r, 800))
    const fakePaymentId = `demo_pay_${Math.random().toString(36).slice(2, 14)}`
    const fakeSignature = `demo_sig_${Math.random().toString(36).slice(2, 14)}`
    onSuccess(fakePaymentId, fakeSignature, orderId)
    return
  }

  // ─── Real Razorpay checkout ───────────────────────────────────────────────
  const scriptLoaded = await loadRazorpayScript()
  if (!scriptLoaded || !window.Razorpay) {
    throw new Error('Failed to load Razorpay checkout script. Check your internet connection.')
  }

  const options = {
    key: keyId,
    amount,
    currency,
    name,
    description,
    order_id: orderId,
    prefill: prefill || {},
    theme: { color: '#10b981' },
    handler: (response: any) => {
      onSuccess(
        response.razorpay_payment_id,
        response.razorpay_signature || '',
        response.razorpay_order_id || orderId
      )
    },
    modal: {
      ondismiss: () => {
        if (onDismiss) onDismiss()
      },
    },
  }

  const rzp = new window.Razorpay(options)
  rzp.on('payment.failed', (resp: any) => {
    if (onDismiss) onDismiss()
    // The error is surfaced via the missing handler call
    console.error('Razorpay payment failed:', resp?.error)
  })
  rzp.open()
}
