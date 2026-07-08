'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Crown, CheckCircle, Zap, Shield, ArrowRight, Sparkles, CalendarDays, Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import { SUBSCRIPTION_PLANS } from '@/lib/razorpay'
import { openRazorpayCheckout } from '@/lib/razorpay-client'
import { toast } from 'sonner'

interface SubscriptionCardProps {
  userId: string
  userName?: string
  userEmail?: string
  rolePlanId: string // e.g. 'producer_pro', 'buyer_pro', 'transporter_pro'
  accentColor?: string // e.g. 'emerald' or 'amber' or 'teal'
  onSubscriptionChanged?: () => void
}

export function SubscriptionCard({
  userId,
  userName,
  userEmail,
  rolePlanId,
  accentColor = 'emerald',
  onSubscriptionChanged,
}: SubscriptionCardProps) {
  const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null)
  const [subLoading, setSubLoading] = useState(true)
  const [subPlansOpen, setSubPlansOpen] = useState(false)
  const [isSubscribing, setIsSubscribing] = useState<string | null>(null) // planId being subscribed

  const plan = SUBSCRIPTION_PLANS[rolePlanId as keyof typeof SUBSCRIPTION_PLANS]

  // Accent color classes
  const accentMap: Record<string, { bg: string; text: string; border: string; hoverBg: string; icon: string; badge: string; glow: string }> = {
    emerald: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/20',
      hoverBg: 'hover:bg-emerald-600',
      icon: 'text-emerald-400',
      badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
      glow: 'shadow-emerald-500/10',
    },
    amber: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/20',
      hoverBg: 'hover:bg-amber-600',
      icon: 'text-amber-400',
      badge: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
      glow: 'shadow-amber-500/10',
    },
    teal: {
      bg: 'bg-teal-500/10',
      text: 'text-teal-400',
      border: 'border-teal-500/20',
      hoverBg: 'hover:bg-teal-600',
      icon: 'text-teal-400',
      badge: 'bg-teal-500/15 text-teal-400 border-teal-500/25',
      glow: 'shadow-teal-500/10',
    },
  }
  const c = accentMap[accentColor] || accentMap.emerald

  useEffect(() => {
    if (!userId) return
    setSubLoading(true)
    fetch(`/api/subscriptions?userId=${userId}`)
      .then(r => r.json())
      .then(data => setSubscriptionInfo(data))
      .catch(() => {})
      .finally(() => setSubLoading(false))
  }, [userId])

  const handleSubscribe = async (selectedPlanId: string) => {
    const selectedPlan = (SUBSCRIPTION_PLANS as Record<string, any>)[selectedPlanId]
    if (!selectedPlan || !userId) return

    setIsSubscribing(selectedPlanId)
    try {
      // 1. Create order
      const orderRes = await fetch('/api/payments/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'subscription', planId: selectedPlanId, amount: selectedPlan.price, userId }),
      })
      const orderData = await orderRes.json()

      if (!orderRes.ok) {
        toast.error(orderData.error || 'Failed to create order')
        return
      }

      // 2. Open Razorpay checkout
      await openRazorpayCheckout({
        orderId: orderData.orderId,
        amount: orderData.amount,
        keyId: orderData.keyId,
        demoMode: orderData.demoMode,
        name: 'AgriLink',
        description: `${selectedPlan.label} Subscription`,
        prefill: { name: userName, email: userEmail },
        onSuccess: async (paymentId, signature, orderId) => {
          // 3. Verify payment
          try {
            const verifyRes = await fetch('/api/payments/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'subscription',
                planId: selectedPlanId,
                userId,
                razorpayOrderId: orderId,
                razorpayPaymentId: paymentId,
                razorpaySignature: signature,
                amount: selectedPlan.price,
              }),
            })
            const verifyData = await verifyRes.json()
            if (verifyData.verified) {
              toast.success(`${selectedPlan.label} activated! 🎉`)
              setSubPlansOpen(false)
              // Refresh subscription info
              const freshData = await fetch(`/api/subscriptions?userId=${userId}`).then(r => r.json())
              setSubscriptionInfo(freshData)
              onSubscriptionChanged?.()
            } else {
              toast.error('Payment verification failed')
            }
          } catch {
            toast.error('Payment verification failed')
          }
        },
      })
    } catch {
      toast.error('Subscription failed. Please try again.')
    } finally {
      setIsSubscribing(null)
    }
  }

  const isActive = subscriptionInfo?.isActive || false
  const tier = subscriptionInfo?.tier || 'free'
  const expiry = subscriptionInfo?.expiry || null
  const isPro = isActive && tier !== 'free'

  // Determine which plans to show in the dialog (role-specific + sponsored for producer)
  const role = plan?.role || 'producer'
  const availablePlans = Object.values(SUBSCRIPTION_PLANS).filter(p => {
    if (p.id === rolePlanId) return true
    if (role === 'producer' && p.id === 'sponsored') return true
    return false
  })

  if (subLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-20 w-full rounded-lg" />
      </motion.div>
    )
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`glass-card p-6 border ${isPro ? c.border : 'border-amber-500/15'} relative overflow-hidden`}
      >
        {/* Subtle glow effect for Pro users */}
        {isPro && (
          <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full ${c.bg} blur-3xl opacity-50`} />
        )}

        <div className="relative">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`h-9 w-9 rounded-lg ${c.bg} flex items-center justify-center ${c.icon}`}>
                {isPro ? <Crown className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Subscription</h3>
                <p className="text-xs text-muted-foreground">
                  {isPro ? 'Premium plan active' : 'Free plan'}
                </p>
              </div>
            </div>
            {isPro ? (
              <Badge className={`${c.badge} border text-xs`}>
                <CheckCircle className="h-3 w-3 mr-1" /> Active
              </Badge>
            ) : (
              <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/25 border text-xs">
                Free
              </Badge>
            )}
          </div>

          {/* Content */}
          {isPro ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-white/10">
                <div className="flex items-center gap-2">
                  <Sparkles className={`h-4 w-4 ${c.text}`} />
                  <span className="text-sm font-medium text-foreground">{plan?.label || 'Pro Plan'}</span>
                </div>
                <span className="text-sm text-muted-foreground">₹{plan?.price || 0}/mo</span>
              </div>
              {expiry && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  <span>Expires {new Date(expiry).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              )}
              {/* Feature highlights */}
              <div className="grid grid-cols-1 gap-1.5 mt-2">
                {(plan?.features || []).slice(0, 3).map((f: string) => (
                  <div key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Shield className={`h-3 w-3 ${c.text} shrink-0`} />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Upgrade CTA */}
              <div className="p-3 rounded-lg bg-gradient-to-r from-amber-500/[0.08] to-transparent border border-amber-500/15">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="h-4 w-4 text-amber-400" />
                  <span className="text-sm font-medium text-amber-400">Upgrade to Pro</span>
                </div>
                <div className="space-y-1.5">
                  {(plan?.features || []).slice(0, 4).map((f: string) => (
                    <div key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle className="h-3 w-3 text-amber-400 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Button
                className={`w-full bg-amber-600 ${c.hoverBg} gap-2`}
                onClick={() => setSubPlansOpen(true)}
              >
                <Crown className="h-4 w-4" />
                Upgrade to {plan?.label || 'Pro'} — ₹{plan?.price || 0}/mo
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </motion.div>

      {/* ─── Subscription Plans Dialog ────────────────────────────────────────── */}
      <Dialog open={subPlansOpen} onOpenChange={setSubPlansOpen}>
        <DialogContent className="bg-[oklch(0.15_0.012_260/0.95)] border-white/20 backdrop-blur-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Crown className={`h-5 w-5 ${c.text}`} />
              Upgrade Your Plan
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Choose a plan that fits your needs. Cancel anytime.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {availablePlans.map((p) => {
              const isCurrentPlan = isPro && p.id === rolePlanId
              const isSponsored = p.id === 'sponsored'
              const isSubscribingThis = isSubscribing === p.id

              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-xl border p-5 relative overflow-hidden ${
                    isSponsored
                      ? 'border-amber-500/30 bg-gradient-to-br from-amber-500/[0.08] to-transparent'
                      : isCurrentPlan
                      ? `${c.border} ${c.bg}`
                      : 'border-white/10 bg-white/[0.02]'
                  }`}
                >
                  {isSponsored && (
                    <div className="absolute top-0 right-0 bg-amber-500 text-black text-[10px] font-bold px-3 py-1 rounded-bl-lg">
                      POPULAR
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-base font-semibold text-foreground">{p.label}</h4>
                        {isCurrentPlan && (
                          <Badge className={`${c.badge} border text-[10px]`}>Current</Badge>
                        )}
                      </div>
                      <div className="flex items-baseline gap-1 mb-3">
                        <span className="text-2xl font-bold text-foreground">₹{p.price}</span>
                        <span className="text-sm text-muted-foreground">/month</span>
                      </div>
                      <div className="space-y-1.5">
                        {p.features.map((f: string) => (
                          <div key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <CheckCircle className={`h-3 w-3 shrink-0 ${isSponsored ? 'text-amber-400' : c.text}`} />
                            <span>{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Button
                      className={`${isCurrentPlan ? 'bg-white/10 text-muted-foreground cursor-default' : isSponsored ? 'bg-amber-600 hover:bg-amber-500' : `bg-emerald-600 hover:bg-emerald-500`} gap-2 shrink-0`}
                      disabled={isCurrentPlan || !!isSubscribing}
                      onClick={() => handleSubscribe(p.id)}
                    >
                      {isSubscribingThis ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : isCurrentPlan ? (
                        'Current Plan'
                      ) : (
                        <>
                          Subscribe
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
