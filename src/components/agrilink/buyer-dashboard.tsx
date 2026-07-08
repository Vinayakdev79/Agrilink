'use client'

import { useAppStore } from '@/lib/store'
import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  ShoppingCart, IndianRupee, Users, Store,
  MessageSquare, TrendingUp, TrendingDown, Search, Truck, MapPin,
  ShoppingBag, Sprout, BadgeCheck, Star, CheckCircle, Clock, Shield,
  Eye, Gavel, Phone, Crosshair, CalendarDays, User, Leaf,
  Wallet, CreditCard, ExternalLink, ShieldCheck
} from 'lucide-react'
import { openRazorpayCheckout } from '@/lib/razorpay-client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ShipmentTracker } from '@/components/agrilink/shipment-tracker'
import { SubscriptionCard } from '@/components/agrilink/subscription-card'

interface BuyerDashboardProps {
  tab: string
}

const categorySpendData = [
  { name: 'Grains', value: 450000, color: '#10b981' },
  { name: 'Spices', value: 280000, color: '#f59e0b' },
  { name: 'Vegetables', value: 190000, color: '#14b8a6' },
  { name: 'Fruits', value: 150000, color: '#8b5cf6' },
  { name: 'Dairy', value: 120000, color: '#ef4444' },
  { name: 'Pulses', value: 95000, color: '#06b6d4' },
]

const statusColors: Record<string, string> = {
  negotiating: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  confirmed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  shipped: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  delivered: 'bg-green-500/20 text-green-400 border-green-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
  disputed: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
}

const paymentStatusColors: Record<string, string> = {
  pending: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  advance_paid: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  full_paid: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  unpaid: 'bg-red-500/20 text-red-400 border-red-500/30',
}

const bidStatusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  accepted: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
}

const shipmentStatusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  bidding: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  assigned: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  picked_up: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  in_transit: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  delivered: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
}

function StatCard({ icon, value, label, trend, trendUp }: {
  icon: React.ReactNode; value: string; label: string; trend?: string; trendUp?: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <div className="h-10 w-10 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400">
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trendUp ? 'text-emerald-400' : 'text-red-400'}`}>
            {trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {trend}
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </motion.div>
  )
}

// Payment Breakdown Component
function PaymentBreakdown({ order }: { order: any }) {
  const quantity = order.quantity || 0
  const unitPrice = order.unitPrice || order.product?.pricePerUnit || 0
  const productCost = quantity * unitPrice
  const platformFee = order.platformFee || Math.round(productCost * 0.02 * 100) / 100
  const transportBookingFee = order.transportBookingFee || 30
  const isFreeDelivery = order.freeDelivery || order.product?.freeDelivery
  const deliveryFee = order.deliveryFee || 0
  const total = order.totalPayable || (productCost + platformFee + transportBookingFee + (isFreeDelivery ? 0 : deliveryFee))
  const advancePaid = order.advanceAmount || Math.round(total * 0.5 * 100) / 100
  const remaining = order.remainingAmount || Math.round(total * 0.5 * 100) / 100

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="glass-card p-4 border border-amber-500/15 bg-amber-500/[0.03]"
    >
      <div className="flex items-center gap-2 mb-3">
        <CreditCard className="h-4 w-4 text-amber-400" />
        <h5 className="text-sm font-semibold text-foreground">Payment Breakdown</h5>
        {order.paymentStatus && (
          <Badge className={`${paymentStatusColors[order.paymentStatus] || ''} border text-[10px] ml-auto`}>
            {order.paymentStatus === 'advance_paid' ? 'Advance Paid' : order.paymentStatus === 'full_paid' ? 'Fully Paid' : order.paymentStatus === 'pending' ? 'Pending' : order.paymentStatus.replace('_', ' ')}
          </Badge>
        )}
      </div>
      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Product Cost ({quantity} × ₹{unitPrice.toLocaleString()})</span>
          <span className="text-foreground font-medium">₹{productCost.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Platform Fee (2%)</span>
          <span className="text-foreground font-medium">₹{platformFee.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Transport Booking Fee</span>
          <span className="text-foreground font-medium">₹{transportBookingFee.toLocaleString()}</span>
        </div>
        {/* Delivery Fee row — FREE badge or charged amount */}
        {isFreeDelivery ? (
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Delivery Fee</span>
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 border text-[10px]">FREE</Badge>
          </div>
        ) : deliveryFee > 0 ? (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Delivery Fee</span>
            <span className="text-foreground font-medium">₹{deliveryFee.toLocaleString()}</span>
          </div>
        ) : null}
        <div className="flex justify-between pt-1.5 border-t border-glass-border">
          <span className="text-foreground font-semibold">Total</span>
          <span className="text-amber-400 font-bold">₹{total.toLocaleString()}</span>
        </div>
        <div className="flex justify-between pt-1 border-t border-dashed border-glass-border">
          <span className="text-emerald-400">Advance Paid (50%)</span>
          <span className="text-emerald-400 font-medium">₹{advancePaid.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className={order.paymentStatus === 'full_paid' ? 'text-emerald-400' : 'text-orange-400'}>
            {order.paymentStatus === 'full_paid' ? 'Remaining (Paid)' : 'Remaining (50%)'}
          </span>
          <span className={order.paymentStatus === 'full_paid' ? 'text-emerald-400 font-medium' : 'text-orange-400 font-bold'}>
            ₹{remaining.toLocaleString()}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

export function BuyerDashboard({ tab }: BuyerDashboardProps) {
  const { user, setChatOpen, setActiveChatUser, setView, setMarketplaceCategory, setSelectedProducerId } = useAppStore()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [shipmentForm, setShipmentForm] = useState<{
    open: boolean; orderId: string; origin: string; destination: string; budgetMin: string; budgetMax: string
  }>({
    open: false, orderId: '', origin: '', destination: '', budgetMin: '', budgetMax: ''
  })
  // Producers tab state
  const [producers, setProducers] = useState<any[]>([])
  const [producersLoading, setProducersLoading] = useState(false)
  const [producerSearch, setProducerSearch] = useState('')
  const [producerStateFilter, setProducerStateFilter] = useState('')
  const [producerCertFilter, setProducerCertFilter] = useState('')
  const [organicOnly, setOrganicOnly] = useState(false)
  const [producerSort, setProducerSort] = useState('rating')

  // Bid visibility state
  const [bidsDialogOpen, setBidsDialogOpen] = useState(false)
  const [bidsForShipment, setBidsForShipment] = useState<any[]>([])
  const [bidsLoading, setBidsLoading] = useState(false)
  const [acceptingBidId, setAcceptingBidId] = useState<string | null>(null)

  // Shipment tracking state
  const [trackingShipment, setTrackingShipment] = useState<any>(null)
  const [trackerOpen, setTrackerOpen] = useState(false)

  // Shipments for this buyer
  const [myShipments, setMyShipments] = useState<any[]>([])

  // Pay remaining state
  const [payingRemaining, setPayingRemaining] = useState<string | null>(null)

  // Expanded orders for payment breakdown
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set())

  const fetchData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const ordersRes = await fetch(`/api/orders?userId=${user.id}&role=buyer`)
      const ordersData = await ordersRes.json()
      if (ordersData.orders) setOrders(ordersData.orders)

      // Fetch shipments for this buyer
      const shipRes = await fetch('/api/shipments')
      const shipData = await shipRes.json()
      const allShipments = shipData.shipments || []
      // Filter shipments that belong to this buyer's orders
      const buyerOrderIds = new Set((ordersData.orders || []).map((o: any) => o.id))
      const buyerShips = allShipments.filter((s: any) => buyerOrderIds.has(s.orderId))
      setMyShipments(buyerShips)
    } catch {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const fetchProducers = useCallback(async () => {
    setProducersLoading(true)
    try {
      const res = await fetch('/api/users?role=producer')
      const data = await res.json()
      if (data.users) setProducers(data.users)
    } catch {
      toast.error('Failed to load producers')
    } finally {
      setProducersLoading(false)
    }
  }, [])

  useEffect(() => {
    if (tab === 'producers') fetchProducers()
  }, [tab, fetchProducers])

  const handleCreateShipment = async () => {
    try {
      const body: Record<string, unknown> = {
        orderId: shipmentForm.orderId,
        origin: shipmentForm.origin,
        destination: shipmentForm.destination,
      }
      if (shipmentForm.budgetMin) body.budgetMin = shipmentForm.budgetMin
      if (shipmentForm.budgetMax) body.budgetMax = shipmentForm.budgetMax

      const res = await fetch('/api/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (res.ok) {
        toast.success('Shipment created! Transporters will be notified.')
        setShipmentForm({ open: false, orderId: '', origin: '', destination: '', budgetMin: '', budgetMax: '' })
        fetchData()
      } else {
        toast.error('Failed to create shipment')
      }
    } catch {
      toast.error('Failed to create shipment')
    }
  }

  // View bids for a shipment
  const handleViewBids = async (shipmentId: string) => {
    setBidsLoading(true)
    setBidsDialogOpen(true)
    try {
      const res = await fetch(`/api/transport-bids?shipmentId=${shipmentId}`)
      const data = await res.json()
      if (data.bids) {
        setBidsForShipment(data.bids)
      }
    } catch {
      toast.error('Failed to load bids')
    } finally {
      setBidsLoading(false)
    }
  }

  // Accept a bid
  const handleAcceptBid = async (bidId: string) => {
    setAcceptingBidId(bidId)
    try {
      const res = await fetch('/api/transport-bids', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bidId, status: 'accepted' })
      })
      if (res.ok) {
        toast.success('Bid accepted! Transporter has been assigned.')
        setBidsDialogOpen(false)
        fetchData()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to accept bid')
      }
    } catch {
      toast.error('Failed to accept bid')
    } finally {
      setAcceptingBidId(null)
    }
  }

  // Track shipment
  const handleTrackShipment = (shipment: any) => {
    setTrackingShipment(shipment)
    setTrackerOpen(true)
  }

  // Find shipment for a given order
  const getShipmentForOrder = (orderId: string) => {
    return myShipments.find((s: any) => s.orderId === orderId)
  }

  // Pay remaining amount — 3-step Razorpay flow (create-order → checkout → verify)
  const handlePayRemaining = async (orderId: string, amount: number) => {
    setPayingRemaining(orderId)
    try {
      // 1. Create Razorpay order (server returns demoMode if keys are absent)
      const createRes = await fetch('/api/payments/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'remaining',
          orderId,
          amount,
          userId: user?.id,
          description: 'Remaining payment for order',
        }),
      })
      if (!createRes.ok) {
        const e = await createRes.json().catch(() => ({}))
        toast.error(e.error || 'Failed to initiate payment')
        return
      }
      const {
        orderId: razorpayOrderId,
        amount: amountPaise,
        demoMode,
        keyId,
      } = await createRes.json()

      // 2. Open Razorpay checkout (auto-succeeds in demo mode)
      await new Promise<void>((resolve, reject) => {
        openRazorpayCheckout({
          orderId: razorpayOrderId,
          amount: amountPaise,
          keyId,
          demoMode,
          name: 'AgriLink',
          description: 'Remaining payment',
          prefill: { name: user?.name, email: user?.email, contact: user?.phone },
          onSuccess: async (paymentId, signature, rzpOrderId) => {
            try {
              // 3. Verify signature & persist payment status
              const verifyRes = await fetch('/api/payments/razorpay/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  type: 'remaining',
                  razorpayOrderId: rzpOrderId,
                  razorpayPaymentId: paymentId,
                  razorpaySignature: signature,
                  orderId,
                  userId: user?.id,
                  amount,
                }),
              })
              if (!verifyRes.ok) {
                const e = await verifyRes.json().catch(() => ({}))
                toast.error(e.error || 'Payment verification failed')
                reject(new Error('verify failed'))
                return
              }
              toast.success('Remaining payment completed successfully!')
              fetchData()
              resolve()
            } catch (err) {
              toast.error('Payment verification failed')
              reject(err)
            }
          },
          onDismiss: () => {
            toast.info('Payment cancelled')
            resolve()
          },
        })
      })
    } catch {
      toast.error('Failed to process payment')
    } finally {
      setPayingRemaining(null)
    }
  }

  // Toggle payment breakdown
  const togglePaymentBreakdown = (orderId: string) => {
    setExpandedOrders(prev => {
      const next = new Set(prev)
      if (next.has(orderId)) {
        next.delete(orderId)
      } else {
        next.add(orderId)
      }
      return next
    })
  }

  const totalOrders = orders.length
  const savings = Math.round(orders.filter(o => o.status === 'delivered').reduce((s, o) => s + (o.totalPrice || 0), 0) * 0.12)
  const suppliers = [...new Set(orders.map(o => o.seller?.id).filter(Boolean))].length

  if (tab === 'overview') {
    return (
      <div className="space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<ShoppingCart className="h-5 w-5" />} value={String(totalOrders)} label="Orders Placed" trend="+15%" trendUp />
          <StatCard icon={<IndianRupee className="h-5 w-5" />} value={`₹${(savings / 1000).toFixed(0)}K`} label="Savings" trend="+18%" trendUp />
          <StatCard icon={<Users className="h-5 w-5" />} value={String(suppliers)} label="Suppliers" trend="+2" trendUp />
          <StatCard icon={<CheckCircle className="h-5 w-5" />} value={String(orders.filter(o => o.status === 'delivered').length)} label="Delivered" trend="+8%" trendUp />
        </div>

        {/* Subscription card */}
        <SubscriptionCard
          userId={user?.id || ''}
          userName={user?.name}
          userEmail={user?.email}
          rolePlanId="buyer_pro"
          accentColor="amber"
          onSubscriptionChanged={() => {
            if (user?.id) {
              fetch(`/api/users?id=${user.id}`).then(r => r.json()).then(() => {}).catch(() => {})
            }
          }}
        />

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category spend pie chart */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Category Spend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categorySpendData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categorySpendData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(15,15,30,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Spend']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-3 mt-2 justify-center">
              {categorySpendData.map((item) => (
                <div key={item.name} className="flex items-center gap-2 text-xs">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent orders */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Recent Orders</h3>
              <Button variant="ghost" size="sm" className="text-amber-400 hover:text-amber-300" onClick={() => useAppStore.getState().setDashboardTab('orders')}>
                View All
              </Button>
            </div>
            {loading ? (
              <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-10 rounded-lg" />)}</div>
            ) : orders.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">No orders yet</p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {orders.slice(0, 5).map((order) => {
                  const shipment = getShipmentForOrder(order.id)
                  return (
                    <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-glass-border">
                      <div>
                        <p className="text-sm font-medium text-foreground">{order.product?.name || 'N/A'}</p>
                        <p className="text-xs text-muted-foreground">{order.seller?.name || order.seller?.companyName || 'Unknown'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-amber-400 font-medium">₹{order.totalPrice?.toLocaleString()}</p>
                        <div className="flex items-center gap-1.5 justify-end">
                          <Badge className={`${statusColors[order.status] || ''} border text-[10px]`}>{order.status}</Badge>
                          {shipment && ['picked_up', 'in_transit'].includes(shipment.status) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-5 w-5 p-0 text-cyan-400 hover:text-cyan-300"
                              onClick={() => handleTrackShipment(shipment)}
                            >
                              <Crosshair className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-3">
          <Button className="bg-amber-600 hover:bg-amber-500 gap-2" onClick={() => { setMarketplaceCategory('all'); setView('marketplace') }}>
            <Search className="h-4 w-4" /> Search Products
          </Button>
          <Button variant="outline" className="border-glass-border gap-2" onClick={() => { setMarketplaceCategory('all'); setView('marketplace') }}>
            <Store className="h-4 w-4" /> View Marketplace
          </Button>
        </div>
      </div>
    )
  }

  if (tab === 'orders') {
    return (
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-foreground">Orders</h3>
        {loading ? (
          <div className="space-y-3">{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}</div>
        ) : orders.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No orders yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const shipment = getShipmentForOrder(order.id)
              const hasShipment = !!shipment
              const isShippedOrInTransit = shipment && ['picked_up', 'in_transit'].includes(shipment.status)
              const hasTransport = shipment && shipment.transporterId && ['assigned', 'picked_up', 'in_transit', 'delivered'].includes(shipment.status)
              const isExternalTransport = shipment?.isExternal || shipment?.isExternalTransporter
              const remainingAmount = order.remainingAmount || Math.round((order.totalPayable || order.totalPrice || 0) * 0.5 * 100) / 100
              const canPayRemaining = order.paymentStatus === 'advance_paid' && remainingAmount > 0 && order.status !== 'cancelled'
              const isExpanded = expandedOrders.has(order.id)

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-5 space-y-4"
                >
                  {/* Header with product image + basic info */}
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <div className="w-24 h-24 rounded-xl overflow-hidden border border-glass-border shrink-0">
                      {order.product?.imageUrl ? (
                        <img src={order.product.imageUrl} alt={order.product?.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-emerald-500/10 flex items-center justify-center">
                          <ShoppingBag className="h-8 w-8 text-emerald-400/50" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-semibold text-foreground">{order.product?.name || 'N/A'}</h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground capitalize">{order.product?.category}</span>
                            {order.product?.qualityGrade && (
                              <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/25 border text-[9px] px-1.5">
                                Grade {order.product.qualityGrade}
                              </Badge>
                            )}
                            {order.product?.isOrganic && (
                              <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/25 border text-[9px] px-1.5">
                                Organic
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Badge className={`${statusColors[order.status] || ''} border text-xs`}>
                            {order.status}
                          </Badge>
                          {order.paymentStatus && (
                            <Badge className={`${paymentStatusColors[order.paymentStatus] || ''} border text-[10px]`}>
                              {order.paymentStatus === 'advance_paid' ? 'Advance Paid' : order.paymentStatus === 'full_paid' ? 'Fully Paid' : order.paymentStatus === 'pending' ? 'Pending' : order.paymentStatus.replace('_', ' ')}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Price details */}
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <div>
                          <p className="text-muted-foreground text-[10px]">Qty</p>
                          <p className="text-foreground font-medium">{order.quantity} {order.product?.unit || ''}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-[10px]">Unit Price</p>
                          <p className="text-foreground font-medium">₹{order.product?.pricePerUnit?.toLocaleString() || order.unitPrice?.toLocaleString()}/{order.product?.unit || ''}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-[10px]">Total</p>
                          <p className="text-amber-400 font-bold">₹{order.totalPrice?.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Product Location & Variety */}
                  <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                    {order.product?.location && (
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-emerald-400" />{order.product.location}{order.product.state ? `, ${order.product.state}` : ''}</span>
                    )}
                    {order.product?.cropVariety && (
                      <span className="flex items-center gap-1"><Sprout className="w-3 h-3 text-emerald-400" />{order.product.cropVariety}</span>
                    )}
                  </div>

                  {/* Delivery Address */}
                  {order.deliveryAddress && (
                    <div className="glass-card p-3 border border-emerald-500/10">
                      <p className="text-[10px] text-muted-foreground mb-1">Delivery Address</p>
                      <p className="text-xs text-foreground">{order.deliveryAddress}{order.deliveryCity ? `, ${order.deliveryCity}` : ''}{order.deliveryState ? `, ${order.deliveryState}` : ''} {order.deliveryPincode || ''}</p>
                    </div>
                  )}

                  {/* Seller info with Chat button */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-glass-border">
                    <Avatar className="h-8 w-8 border border-glass-border shrink-0">
                      {order.seller?.avatarUrl ? (
                        <AvatarImage src={order.seller.avatarUrl} alt={order.seller?.name || ''} />
                      ) : null}
                      <AvatarFallback className="bg-emerald-500/20 text-emerald-400 text-xs font-semibold">
                        {(order.seller?.name || 'S').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{order.seller?.name || order.seller?.companyName || 'Unknown Seller'}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {order.seller?.companyName && <span>{order.seller.companyName}</span>}
                        {(order.seller?.city || order.seller?.state) && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {[order.seller?.city, order.seller?.state].filter(Boolean).join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 gap-1 text-xs"
                        onClick={() => {
                          if (order.seller?.id) {
                            setActiveChatUser(order.seller.id)
                            setChatOpen(true)
                          }
                        }}
                      >
                        <MessageSquare className="h-3 w-3" /> Chat
                      </Button>
                      <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                  </div>

                  {/* Expected Pickup Date - prominent display */}
                  {hasTransport && shipment.expectedPickupDate && (
                    <div className="glass-card p-3 border border-amber-500/20 bg-amber-500/5">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-5 w-5 text-amber-400" />
                        <div>
                          <p className="text-xs text-muted-foreground">Expected Pickup Date</p>
                          <p className="text-sm font-bold text-amber-400">
                            {new Date(shipment.expectedPickupDate).toLocaleDateString('en-IN', {
                              weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Shipment Transport Details - Enhanced with transporter info */}
                  {hasTransport && (
                    <div className="glass-card p-4 border border-teal-500/20">
                      <div className="flex items-center gap-2 mb-3">
                        <Truck className="h-4 w-4 text-teal-400" />
                        <h5 className="text-sm font-semibold text-foreground">Transport Details</h5>
                        <Badge className={`${shipmentStatusColors[shipment.status] || ''} border text-[10px]`}>
                          {shipment.status.replace('_', ' ')}
                        </Badge>
                        {isExternalTransport && (
                          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 border text-[10px] gap-1">
                            <ExternalLink className="h-2.5 w-2.5" /> External
                          </Badge>
                        )}
                      </div>

                      {isExternalTransport ? (
                        /* External Transporter Info */
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                          {(shipment.externalTransporterName || shipment.externalCompanyName) && (
                            <div>
                              <p className="text-muted-foreground text-[10px]">Transporter</p>
                              <p className="text-foreground font-medium text-xs">
                                {shipment.externalTransporterName || shipment.externalCompanyName || 'N/A'}
                              </p>
                            </div>
                          )}
                          {shipment.driverName && (
                            <div>
                              <p className="text-muted-foreground text-[10px]">Driver</p>
                              <p className="text-foreground font-medium text-xs flex items-center gap-1">
                                <User className="h-3 w-3 text-teal-400" />
                                {shipment.driverName}
                              </p>
                            </div>
                          )}
                          {(shipment.driverPhone || shipment.externalMobileNumber) && (
                            <div>
                              <p className="text-muted-foreground text-[10px]">Driver Phone</p>
                              <p className="text-foreground font-medium text-xs flex items-center gap-1">
                                <Phone className="h-2.5 w-2.5 text-teal-400" />
                                {shipment.driverPhone || shipment.externalMobileNumber}
                              </p>
                            </div>
                          )}
                          {shipment.vehicleNumber && (
                            <div>
                              <p className="text-muted-foreground text-[10px]">Vehicle Number</p>
                              <p className="text-foreground font-medium text-xs flex items-center gap-1">
                                <Truck className="h-3 w-3 text-teal-400" />
                                {shipment.vehicleNumber}
                              </p>
                            </div>
                          )}
                          <div>
                            <p className="text-muted-foreground text-[10px]">Pickup</p>
                            <p className="text-foreground font-medium text-xs flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-emerald-400" />
                              {shipment.exactPickupAddress || shipment.origin}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-[10px]">Drop-off</p>
                            <p className="text-foreground font-medium text-xs flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-red-400" />
                              {shipment.exactDropAddress || shipment.destination}
                            </p>
                          </div>
                        </div>
                      ) : (
                        /* Internal (AgroBridge) Transporter Info */
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                          <div>
                            <p className="text-muted-foreground text-[10px]">Transporter Company</p>
                            <p className="text-foreground font-medium text-xs">
                              {shipment.transporter?.companyName || shipment.transporter?.name || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-[10px]">Transporter Contact</p>
                            <p className="text-foreground font-medium text-xs flex items-center gap-1">
                              <Phone className="h-2.5 w-2.5 text-teal-400" />
                              {shipment.transporter?.phone || 'N/A'}
                            </p>
                          </div>
                          {shipment.driverName && (
                            <div>
                              <p className="text-muted-foreground text-[10px]">Driver Name</p>
                              <p className="text-foreground font-medium text-xs flex items-center gap-1">
                                <User className="h-3 w-3 text-teal-400" />
                                {shipment.driverName}
                              </p>
                            </div>
                          )}
                          {shipment.driverPhone && (
                            <div>
                              <p className="text-muted-foreground text-[10px]">Driver Phone</p>
                              <p className="text-foreground font-medium text-xs flex items-center gap-1">
                                <Phone className="h-2.5 w-2.5 text-teal-400" />
                                {shipment.driverPhone}
                              </p>
                            </div>
                          )}
                          {shipment.vehicleNumber && (
                            <div>
                              <p className="text-muted-foreground text-[10px]">Vehicle Number</p>
                              <p className="text-foreground font-medium text-xs flex items-center gap-1">
                                <Truck className="h-3 w-3 text-teal-400" />
                                {shipment.vehicleNumber}
                              </p>
                            </div>
                          )}
                          {(shipment.vehicleType && !shipment.vehicleNumber) && (
                            <div>
                              <p className="text-muted-foreground text-[10px]">Vehicle Type</p>
                              <p className="text-foreground font-medium text-xs flex items-center gap-1">
                                <Truck className="h-3 w-3 text-teal-400" />
                                {shipment.vehicleType}
                              </p>
                            </div>
                          )}
                          <div>
                            <p className="text-muted-foreground text-[10px]">Pickup</p>
                            <p className="text-foreground font-medium text-xs flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-emerald-400" />
                              {shipment.exactPickupAddress || shipment.origin}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-[10px]">Drop-off</p>
                            <p className="text-foreground font-medium text-xs flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-red-400" />
                              {shipment.exactDropAddress || shipment.destination}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Transporter Action Buttons */}
                      <div className="mt-3 pt-3 border-t border-glass-border flex items-center gap-2 flex-wrap">
                        {/* Track Shipment Button */}
                        {isShippedOrInTransit && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-cyan-500/30 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 gap-1.5 text-xs"
                            onClick={() => handleTrackShipment(shipment)}
                          >
                            <Crosshair className="h-3.5 w-3.5" /> Track Shipment
                          </Button>
                        )}

                        {/* Chat with Transporter - only for internal transporters */}
                        {!isExternalTransport && shipment.transporterId && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-teal-500/30 text-teal-400 hover:text-teal-300 hover:bg-teal-500/10 gap-1.5 text-xs"
                            onClick={() => {
                              setActiveChatUser(shipment.transporterId)
                              setChatOpen(true)
                            }}
                          >
                            <MessageSquare className="h-3.5 w-3.5" /> Chat with Transporter
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Pay Remaining Banner */}
                  {canPayRemaining && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="glass-card p-4 border border-orange-500/30 bg-orange-500/[0.05]"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-orange-500/15 flex items-center justify-center">
                            <Wallet className="h-5 w-5 text-orange-400" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">Payment Due</p>
                            <p className="text-xs text-muted-foreground">Remaining payment of ₹{remainingAmount.toLocaleString()} is pending for this order</p>
                          </div>
                        </div>
                        <Button
                          className="bg-orange-600 hover:bg-orange-500 gap-2 text-sm shadow-lg shadow-orange-600/20"
                          disabled={payingRemaining === order.id}
                          onClick={() => handlePayRemaining(order.id, remainingAmount)}
                        >
                          {payingRemaining === order.id ? (
                            <>
                              <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <IndianRupee className="h-4 w-4" /> Pay Remaining ₹{remainingAmount.toLocaleString()}
                            </>
                          )}
                        </Button>
                      </div>
                      <div className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <ShieldCheck className="h-3 w-3 text-emerald-400" />
                        <span>Secured by Razorpay</span>
                      </div>
                    </motion.div>
                  )}

                  {/* Payment Breakdown Toggle */}
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 gap-1.5 text-xs h-7 px-2"
                      onClick={() => togglePaymentBreakdown(order.id)}
                    >
                      <CreditCard className="h-3.5 w-3.5" />
                      {isExpanded ? 'Hide' : 'Show'} Payment Breakdown
                    </Button>
                  </div>

                  {/* Payment Breakdown */}
                  {isExpanded && (
                    <PaymentBreakdown order={order} />
                  )}

                  {/* Producer-handled delivery info banner (replaces Create Shipment) */}
                  {order.status === 'confirmed' && !hasShipment && (order.product?.deliveryHandledByProducer || order.deliveryType === 'producer' || order.deliveryType === 'local') && (
                    <div className="glass-card p-4 border border-emerald-500/25 bg-emerald-500/[0.05]">
                      <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0">
                          <Truck className="h-4 w-4 text-emerald-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground">
                            {order.deliveryType === 'local' ? "🚚 Producer's Local Transporter is handling delivery" : '🚚 This order is being delivered by the producer'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">Shipment creation is not required.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Local Transporter details (when deliveryType is 'local') */}
                  {order.deliveryType === 'local' && (order.localTransporterName || order.localTransporterPhone || order.localTransporterVehicle) && (
                    <div className="glass-card p-4 border border-teal-500/20">
                      <div className="flex items-center gap-2 mb-3">
                        <Truck className="h-4 w-4 text-teal-400" />
                        <h5 className="text-sm font-semibold text-foreground">Local Transporter Details</h5>
                        <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 border text-[10px] gap-1">
                          <ExternalLink className="h-2.5 w-2.5" /> Producer-managed
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                        {order.localTransporterName && (
                          <div>
                            <p className="text-muted-foreground text-[10px]">Transporter Name</p>
                            <p className="text-foreground font-medium text-xs flex items-center gap-1">
                              <User className="h-3 w-3 text-teal-400" />
                              {order.localTransporterName}
                            </p>
                          </div>
                        )}
                        {order.localTransporterPhone && (
                          <div>
                            <p className="text-muted-foreground text-[10px]">Phone</p>
                            <a
                              href={`tel:${order.localTransporterPhone}`}
                              className="text-foreground font-medium text-xs flex items-center gap-1 hover:text-teal-400 transition-colors"
                            >
                              <Phone className="h-2.5 w-2.5 text-teal-400" />
                              {order.localTransporterPhone}
                            </a>
                          </div>
                        )}
                        {order.localTransporterVehicle && (
                          <div>
                            <p className="text-muted-foreground text-[10px]">Vehicle</p>
                            <p className="text-foreground font-medium text-xs flex items-center gap-1">
                              <Truck className="h-3 w-3 text-teal-400" />
                              {order.localTransporterVehicle}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {order.status === 'confirmed' && !hasShipment && !order.product?.deliveryHandledByProducer && (!order.deliveryType || order.deliveryType === 'platform') && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-teal-500/30 text-teal-400 hover:text-teal-300 hover:bg-teal-500/10 gap-1 text-xs"
                        onClick={() => {
                          // Auto-fill origin from seller's address
                          const sellerAddress = order.seller?.address
                            ? order.seller.address
                            : [order.seller?.city, order.seller?.state].filter(Boolean).join(', ')

                          // Auto-fill destination from order delivery address or buyer profile
                          const buyerAddress = order.deliveryAddress
                            ? [order.deliveryAddress, order.deliveryCity, order.deliveryState, order.deliveryPincode].filter(Boolean).join(', ')
                            : [user?.city, user?.state].filter(Boolean).join(', ')

                          setShipmentForm({
                            open: true,
                            orderId: order.id,
                            origin: sellerAddress,
                            destination: buyerAddress,
                            budgetMin: '',
                            budgetMax: ''
                          })
                        }}
                      >
                        <Truck className="h-3 w-3" /> Create Shipment
                      </Button>
                    )}

                    {hasShipment && ['pending', 'bidding'].includes(shipment.status) && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-amber-500/30 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 gap-1 text-xs"
                        onClick={() => handleViewBids(shipment.id)}
                      >
                        <Gavel className="h-3 w-3" /> View Bids
                        {shipment.transportBids?.length > 0 && (
                          <span className="ml-0.5 px-1 py-0 rounded-full bg-amber-500/20 text-[9px]">
                            {shipment.transportBids.length}
                          </span>
                        )}
                      </Button>
                    )}

                    {hasShipment && shipment.status === 'assigned' && (
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 border text-xs">
                        <Truck className="h-3 w-3 mr-1" /> Transporter Assigned
                      </Badge>
                    )}

                    {hasShipment && shipment.status === 'delivered' && (
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 border text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" /> Delivered
                      </Badge>
                    )}

                    {/* Chat with Producer - always available for orders with a seller */}
                    {order.seller?.id && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-emerald-500/30 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 gap-1 text-xs ml-auto"
                        onClick={() => {
                          setActiveChatUser(order.seller.id)
                          setChatOpen(true)
                        }}
                      >
                        <MessageSquare className="h-3 w-3" /> Chat with Producer
                      </Button>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Create Shipment Dialog */}
        <Dialog open={shipmentForm.open} onOpenChange={(open) => setShipmentForm(prev => ({ ...prev, open }))}>
          <DialogContent className="bg-[oklch(0.15_0.012_260/0.95)] border-white/20 backdrop-blur-xl sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-foreground flex items-center gap-2">
                <Truck className="h-5 w-5 text-teal-400" />
                Create Shipment
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">Set up transport for this order</DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 py-3">
              {/* Pickup - read-only display */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <MapPin className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-emerald-400 font-medium uppercase tracking-wider">Pickup from Producer</p>
                  <p className="text-sm text-foreground mt-0.5">{shipmentForm.origin || 'Address not available'}</p>
                </div>
              </div>

              {/* Destination - read-only display */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <MapPin className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-amber-400 font-medium uppercase tracking-wider">Deliver to Your Address</p>
                  <p className="text-sm text-foreground mt-0.5">{shipmentForm.destination || 'Address not available'}</p>
                </div>
              </div>

              {/* Budget Range - only editable fields */}
              <div className="p-3 rounded-lg bg-teal-500/10 border border-teal-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <IndianRupee className="h-4 w-4 text-teal-400" />
                  <span className="text-sm font-medium text-foreground">Transport Budget Range</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1">
                    <Label className="text-foreground text-xs">Min (₹)</Label>
                    <Input type="number" className="glass-input text-foreground text-sm h-9" placeholder="e.g. 5000" value={shipmentForm.budgetMin} onChange={e => setShipmentForm(p => ({ ...p, budgetMin: e.target.value }))} />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-foreground text-xs">Max (₹)</Label>
                    <Input type="number" className="glass-input text-foreground text-sm h-9" placeholder="e.g. 15000" value={shipmentForm.budgetMax} onChange={e => setShipmentForm(p => ({ ...p, budgetMax: e.target.value }))} />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" className="border-glass-border" onClick={() => setShipmentForm(prev => ({ ...prev, open: false }))}>Cancel</Button>
              <Button className="bg-teal-600 hover:bg-teal-500" onClick={handleCreateShipment}>Create Shipment</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Bids Dialog */}
        <Dialog open={bidsDialogOpen} onOpenChange={setBidsDialogOpen}>
          <DialogContent className="bg-[oklch(0.15_0.012_260/0.95)] border-white/20 backdrop-blur-xl max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-foreground flex items-center gap-2">
                <Gavel className="h-5 w-5 text-amber-400" />
                Transport Bids
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Review and accept bids from transporters
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {bidsLoading ? (
                <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
              ) : bidsForShipment.length === 0 ? (
                <div className="glass-card p-8 text-center">
                  <Gavel className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">No bids yet. Transporters will bid on your shipment soon.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {bidsForShipment.map((bid: any) => (
                    <motion.div
                      key={bid.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="glass-card p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {bid.transporter?.companyName || bid.transporter?.name || 'Unknown Transporter'}
                          </p>
                          {bid.transporter?.verificationStatus === 'verified' && (
                            <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/25 border text-[9px] mt-1">
                              <BadgeCheck className="h-2.5 w-2.5 mr-0.5" /> Verified
                            </Badge>
                          )}
                        </div>
                        <Badge className={`${bidStatusColors[bid.status] || ''} border text-xs`}>
                          {bid.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground text-[10px]">Bid Amount</p>
                          <p className="text-amber-400 font-bold">₹{bid.bidAmount?.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-[10px]">Est. Days</p>
                          <p className="text-foreground">{bid.estimatedDays || '—'} days</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-[10px]">Vehicle</p>
                          <p className="text-foreground capitalize">{bid.vehicleType || '—'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-[10px]">Bid Date</p>
                          <p className="text-foreground text-xs">{new Date(bid.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      {bid.comments && (
                        <p className="text-xs text-muted-foreground italic bg-white/[0.02] p-2 rounded-lg">
                          &ldquo;{bid.comments}&rdquo;
                        </p>
                      )}
                      {bid.status === 'pending' && (
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-500 gap-1.5 text-xs w-full"
                          disabled={acceptingBidId !== null}
                          onClick={() => handleAcceptBid(bid.id)}
                        >
                          {acceptingBidId === bid.id ? (
                            <>
                              <span className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Accepting...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-3.5 w-3.5" /> Accept Bid
                            </>
                          )}
                        </Button>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Shipment Tracker Dialog */}
        <ShipmentTracker
          shipment={trackingShipment}
          open={trackerOpen}
          onClose={() => setTrackerOpen(false)}
        />
      </div>
    )
  }

  if (tab === 'producers') {
    // Filter producers
    const filteredProducers = producers.filter((p: any) => {
      const matchesSearch = !producerSearch ||
        (p.name && p.name.toLowerCase().includes(producerSearch.toLowerCase())) ||
        (p.companyName && p.companyName.toLowerCase().includes(producerSearch.toLowerCase())) ||
        (p.farmName && p.farmName.toLowerCase().includes(producerSearch.toLowerCase()))
      const matchesState = !producerStateFilter || producerStateFilter === 'all' || p.state === producerStateFilter
      const matchesCert = !producerCertFilter || producerCertFilter === 'all' ||
        (p.certifications && p.certifications.toLowerCase().includes(producerCertFilter.toLowerCase()))
      const matchesOrganic = !organicOnly ||
        (p.certifications && p.certifications.toLowerCase().includes('organic'))
      return matchesSearch && matchesState && matchesCert && matchesOrganic
    })

    // Sort producers
    const sortedProducers = [...filteredProducers].sort((a: any, b: any) => {
      if (producerSort === 'rating') return (b.avgRating || 0) - (a.avgRating || 0)
      if (producerSort === 'experience') return (b.yearsExperience || 0) - (a.yearsExperience || 0)
      if (producerSort === 'transactions') return (b.totalTransactions || 0) - (a.totalTransactions || 0)
      if (producerSort === 'name') return (a.name || '').localeCompare(b.name || '')
      return 0
    })

    const producerStates = [...new Set(producers.map((p: any) => p.state).filter(Boolean))].sort()
    const allCerts = [...new Set(producers.flatMap((p: any) => p.certifications ? p.certifications.split(',').map((c: string) => c.trim()) : []))].sort()

    // Star rating component
    const StarRating = ({ rating, count }: { rating: number; count?: number }) => (
      <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-3.5 w-3.5 transition-colors ${
                star <= Math.round(rating)
                  ? 'text-amber-400 fill-amber-400'
                  : star - 0.5 <= rating
                  ? 'text-amber-400/50 fill-amber-400/50'
                  : 'text-white/10'
              }`}
            />
          ))}
        </div>
        <span className="text-xs font-semibold text-amber-400">{rating.toFixed(1)}</span>
        {count !== undefined && count > 0 && (
          <span className="text-[10px] text-muted-foreground">({count})</span>
        )}
      </div>
    )

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-foreground">Producers Directory</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Discover and connect with verified agricultural producers across India
            </p>
          </div>
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="hidden sm:flex items-center gap-2 glass-card px-3 py-1.5"
          >
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm font-medium text-emerald-400">{filteredProducers.length}</span>
            <span className="text-xs text-muted-foreground">producers</span>
          </motion.div>
        </div>

        {/* Search & Filters Bar */}
        <div className="glass-card p-4 space-y-4">
          {/* Search Row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="glass-input text-foreground pl-9 h-10"
                placeholder="Search by name, company, or farm..."
                value={producerSearch}
                onChange={(e) => setProducerSearch(e.target.value)}
              />
            </div>
            <Select value={producerSort} onValueChange={setProducerSort}>
              <SelectTrigger className="glass-input text-foreground w-full sm:w-44 h-10">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">⭐ Top Rated</SelectItem>
                <SelectItem value="experience">🌾 Most Experienced</SelectItem>
                <SelectItem value="transactions">📊 Most Transactions</SelectItem>
                <SelectItem value="name">🔤 By Name</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filter Row */}
          <div className="flex flex-wrap items-center gap-2">
            <Select value={producerStateFilter || 'all'} onValueChange={setProducerStateFilter}>
              <SelectTrigger className="glass-input text-foreground w-36 h-9 text-xs">
                <MapPin className="h-3.5 w-3.5 mr-1 text-emerald-400 shrink-0" />
                <SelectValue placeholder="State" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {producerStates.map((s: string) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={producerCertFilter || 'all'} onValueChange={setProducerCertFilter}>
              <SelectTrigger className="glass-input text-foreground w-36 h-9 text-xs">
                <Shield className="h-3.5 w-3.5 mr-1 text-amber-400 shrink-0" />
                <SelectValue placeholder="Certification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Certs</SelectItem>
                {allCerts.map((c: string) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant={organicOnly ? 'default' : 'outline'}
              className={`h-9 gap-1.5 text-xs transition-all ${
                organicOnly
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                  : 'border-glass-border text-muted-foreground hover:text-emerald-400 hover:border-emerald-500/30'
              }`}
              onClick={() => setOrganicOnly(!organicOnly)}
            >
              <Leaf className="h-3.5 w-3.5" /> Organic Only
            </Button>
            {(producerSearch || (producerStateFilter && producerStateFilter !== 'all') || (producerCertFilter && producerCertFilter !== 'all') || organicOnly) && (
              <Button
                size="sm"
                variant="ghost"
                className="h-9 text-xs text-muted-foreground hover:text-foreground gap-1.5"
                onClick={() => { setProducerSearch(''); setProducerStateFilter(''); setProducerCertFilter(''); setOrganicOnly(false); setProducerSort('rating') }}
              >
                ✕ Clear All
              </Button>
            )}
            <div className="ml-auto hidden md:flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              Showing {filteredProducers.length} of {producers.length}
            </div>
          </div>
        </div>

        {/* Producers Card Grid */}
        {producersLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="glass-card overflow-hidden">
                <Skeleton className="h-20 w-full rounded-none" />
                <div className="p-5 pt-0 -mt-6">
                  <div className="flex items-end gap-3 mb-4">
                    <Skeleton className="h-14 w-14 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2 pb-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Skeleton className="h-3 w-2/3" />
                    <Skeleton className="h-8 w-full" />
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-8 flex-1" />
                      <Skeleton className="h-8 flex-1" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : sortedProducers.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-16 text-center"
          >
            <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
              <Sprout className="h-8 w-8 text-emerald-400/60" />
            </div>
            <h4 className="text-lg font-semibold text-foreground mb-1">No Producers Found</h4>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Try adjusting your search or filter criteria to discover more producers
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 border-glass-border gap-1.5"
              onClick={() => { setProducerSearch(''); setProducerStateFilter(''); setProducerCertFilter(''); setOrganicOnly(false) }}
            >
              Clear Filters
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {sortedProducers.map((producer: any, i: number) => {
              const isVerified = producer.verificationStatus === 'verified'
              const isPending = producer.verificationStatus === 'pending'
              const pCerts = producer.certifications
                ? producer.certifications.split(',').map((c: string) => c.trim()).filter(Boolean)
                : []
              const productCount = producer._count?.products || 0
              const displayName = producer.companyName || producer.farmName || producer.name || 'Unknown'
              const displayInitial = (producer.name || 'P').charAt(0).toUpperCase()
              const locationText = [producer.city, producer.state].filter(Boolean).join(', ') || 'India'

              return (
                <motion.div
                  key={producer.id}
                  initial={{ opacity: 0, y: 20, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  whileHover={{ y: -6, transition: { duration: 0.2 } }}
                  className="glass-card overflow-hidden hover:border-emerald-500/30 transition-all duration-300 cursor-pointer group"
                  onClick={() => { setSelectedProducerId(producer.id); setView('producer-profile') }}
                >
                  {/* Banner with gradient */}
                  <div className="h-20 relative overflow-hidden">
                    {producer.bannerUrl ? (
                      <img src={producer.bannerUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-emerald-900/60 via-emerald-800/30 to-amber-900/20" />
                    )}
                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    {/* Verification badge on banner */}
                    <div className="absolute top-3 right-3">
                      {isVerified ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="flex items-center gap-1 bg-emerald-500/20 backdrop-blur-sm border border-emerald-500/30 rounded-full px-2 py-0.5"
                        >
                          <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-[10px] font-medium text-emerald-400">Verified</span>
                        </motion.div>
                      ) : isPending ? (
                        <div className="flex items-center gap-1 bg-yellow-500/20 backdrop-blur-sm border border-yellow-500/30 rounded-full px-2 py-0.5">
                          <Clock className="w-3 h-3 text-yellow-400" />
                          <span className="text-[10px] font-medium text-yellow-400">Pending</span>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Content area */}
                  <div className="p-5 pt-0 -mt-6 relative">
                    {/* Avatar */}
                    <div className="flex items-end gap-3 mb-4">
                      <Avatar className="h-14 w-14 border-[3px] border-background shadow-xl ring-2 ring-emerald-500/20 shrink-0">
                        {producer.avatarUrl ? (
                          <AvatarImage src={producer.avatarUrl} alt={producer.name || ''} />
                        ) : null}
                        <AvatarFallback className="bg-gradient-to-br from-emerald-500/25 to-emerald-600/15 text-emerald-400 font-bold text-lg">
                          {displayInitial}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 pb-1">
                        <h4 className="font-semibold text-foreground text-sm truncate leading-tight">
                          {producer.name}
                        </h4>
                        <p className="text-xs text-emerald-400/80 truncate font-medium mt-0.5">
                          {displayName !== producer.name ? displayName : ''}
                        </p>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400/70 shrink-0" />
                      <span>{locationText}</span>
                    </div>

                    {/* Star Rating */}
                    {(producer.avgRating > 0 || producer.totalReviews > 0) ? (
                      <div className="mb-3">
                        <StarRating rating={producer.avgRating || 0} count={producer.totalReviews} />
                      </div>
                    ) : (
                      <div className="mb-3">
                        <span className="text-[10px] text-muted-foreground/60 italic">No reviews yet</span>
                      </div>
                    )}

                    {/* Key Stats */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="bg-white/[0.03] rounded-lg p-2 text-center border border-white/[0.04]">
                        <p className="text-sm font-bold text-foreground">{producer.yearsExperience || 0}</p>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Yrs Exp</p>
                      </div>
                      <div className="bg-white/[0.03] rounded-lg p-2 text-center border border-white/[0.04]">
                        <p className="text-sm font-bold text-foreground">{producer.totalTransactions || 0}</p>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Deals</p>
                      </div>
                      <div className="bg-white/[0.03] rounded-lg p-2 text-center border border-white/[0.04]">
                        <p className="text-sm font-bold text-foreground">{productCount}</p>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Products</p>
                      </div>
                    </div>

                    {/* Certifications */}
                    {pCerts.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {pCerts.slice(0, 3).map((cert: string, ci: number) => (
                          <Badge
                            key={ci}
                            className={`border text-[9px] px-2 py-0 font-medium ${
                              cert.toLowerCase().includes('organic')
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
                                : 'bg-amber-500/10 text-amber-400/80 border-amber-500/20'
                            }`}
                          >
                            {cert.toLowerCase().includes('organic') && <Leaf className="w-2.5 h-2.5 mr-0.5" />}
                            {cert}
                          </Badge>
                        ))}
                        {pCerts.length > 3 && (
                          <Badge className="bg-white/5 text-muted-foreground border-white/10 border text-[9px] px-2 py-0">
                            +{pCerts.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2 border-t border-white/[0.06]">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-9 text-xs border-white/10 hover:bg-white/[0.04] hover:border-emerald-500/20 hover:text-emerald-400 transition-colors gap-1.5"
                        onClick={(e) => {
                          e.stopPropagation()
                          setActiveChatUser(producer.id)
                          setChatOpen(true)
                        }}
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Message
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 h-9 text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition-all gap-1.5"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedProducerId(producer.id)
                          setView('producer-profile')
                        }}
                      >
                        <Eye className="w-3.5 h-3.5" /> View Profile
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  if (tab === 'messages') {
    const conversations = orders.reduce((acc: any[], order) => {
      const sellerId = order.seller?.id
      if (sellerId && !acc.find(c => c.id === sellerId)) {
        acc.push({ id: sellerId, name: order.seller?.name || order.seller?.companyName || 'Unknown', lastOrder: order.product?.name })
      }
      return acc
    }, [])

    return (
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-foreground">Messages</h3>
        {conversations.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No conversations yet. Start trading to connect with suppliers!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv: any, i: number) => (
              <motion.button
                key={conv.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="w-full glass-card p-4 flex items-center gap-4 hover:border-amber-500/30 transition-colors text-left"
                onClick={() => { setActiveChatUser(conv.id); setChatOpen(true) }}
              >
                <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-semibold text-sm">
                  {conv.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{conv.name}</p>
                  <p className="text-xs text-muted-foreground">Last order: {conv.lastOrder}</p>
                </div>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </motion.button>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Default: profile tab
  return (
    <div className="glass-card p-6 text-center">
      <User className="h-12 w-12 text-amber-400 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-foreground mb-2">Profile Settings</h3>
      <p className="text-muted-foreground mb-4">Manage your account details and verification status</p>
      <Button className="bg-amber-600 hover:bg-amber-500 gap-2" onClick={() => useAppStore.getState().setView('profile')}>
        <User className="h-4 w-4" /> Go to Profile
      </Button>
    </div>
  )
}
