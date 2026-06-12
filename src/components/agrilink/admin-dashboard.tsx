'use client'

import { useAppStore } from '@/lib/store'
import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Package, ShoppingCart, IndianRupee, ShieldCheck, Truck,
  TrendingUp, TrendingDown, Check, X, Eye, MessageSquare, Filter, Shield,
  BarChart3, CreditCard, Star, Clock, Wallet, ArrowUpRight, ArrowDownRight,
  Crown, Gem, Sparkles, CalendarDays, Tag, Receipt
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts'
import { toast } from 'sonner'

interface AdminDashboardProps {
  tab: string
}

const orderStatusColors: Record<string, string> = {
  negotiating: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  confirmed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  shipped: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  delivered: 'bg-green-500/20 text-green-400 border-green-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
  disputed: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
}

const shipmentStatusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  bidding: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  assigned: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  picked_up: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  in_transit: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  delivered: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
}

const verificationColors: Record<string, string> = {
  verified: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
}

const roleColors: Record<string, string> = {
  producer: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  buyer: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  transporter: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  admin: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
}

const DONUT_COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#06b6d4']
const BAR_COLORS = ['#10b981', '#f59e0b', '#14b8a6', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316', '#a855f7']

const REVENUE_TYPE_LABELS: Record<string, string> = {
  transaction_commission: 'Transaction Commission',
  transport_booking_fee: 'Transport Booking Fee',
  subscription: 'Subscription',
  logistics_commission: 'Logistics Commission',
  escrow_fee: 'Escrow Fee',
  sponsored_listing: 'Sponsored Listing',
}

const REVENUE_TYPE_COLORS: Record<string, string> = {
  transaction_commission: '#10b981',
  transport_booking_fee: '#f59e0b',
  subscription: '#8b5cf6',
  logistics_commission: '#14b8a6',
  escrow_fee: '#3b82f6',
  sponsored_listing: '#f97316',
}

const SUBSCRIPTION_TIERS = [
  { id: 'free', label: 'Free', price: '₹0', description: 'Default tier', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
  { id: 'producer_premium_monthly', label: 'Producer Premium (Monthly)', price: '₹299/mo', description: 'Enhanced listing & analytics', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { id: 'producer_premium_plus', label: 'Producer Premium+', price: '₹999/mo', description: 'Priority visibility & bulk tools', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { id: 'producer_premium_annual', label: 'Producer Premium (Annual)', price: '₹4,999/yr', description: 'Best value for producers', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { id: 'transporter_premium_monthly', label: 'Transporter Premium (Monthly)', price: '₹199/mo', description: 'Priority load matching', color: 'bg-teal-500/20 text-teal-400 border-teal-500/30' },
  { id: 'transporter_premium_plus', label: 'Transporter Premium+', price: '₹499/mo', description: 'Advanced logistics tools', color: 'bg-teal-500/20 text-teal-400 border-teal-500/30' },
]

function StatCard({ icon, value, label, trend, trendUp, accentColor }: {
  icon: React.ReactNode; value: string; label: string; trend?: string; trendUp?: boolean; accentColor?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${accentColor || 'bg-purple-500/15 text-purple-400'}`}>
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

export function AdminDashboard({ tab }: AdminDashboardProps) {
  const { user, setChatOpen, setActiveChatUser } = useAppStore()
  const [stats, setStats] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [allOrders, setAllOrders] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [shipments, setShipments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [verifFilter, setVerifFilter] = useState<string>('all')

  // Revenue state
  const [revenueData, setRevenueData] = useState<any>(null)
  const [revenueLoading, setRevenueLoading] = useState(true)
  const [revenueTypeFilter, setRevenueTypeFilter] = useState<string>('all')

  // Subscription state
  const [subscriptionFilter, setSubscriptionFilter] = useState<string>('all')
  const [tierDialogOpen, setTierDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [newTier, setNewTier] = useState<string>('free')
  const [tierUpdating, setTierUpdating] = useState(false)

  // Sponsored state
  const [sponsorDialogOpen, setSponsorDialogOpen] = useState(false)
  const [sponsorUser, setSponsorUser] = useState<any>(null)
  const [sponsorExpiry, setSponsorExpiry] = useState<string>('')
  const [sponsorAmount, setSponsorAmount] = useState<string>('')
  const [sponsorUpdating, setSponsorUpdating] = useState(false)

  const fetchData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const [statsRes, ordersRes, usersRes, shipmentsRes] = await Promise.all([
        fetch('/api/stats'),
        fetch(`/api/orders?userId=${user.id}&role=admin`),
        fetch('/api/users'),
        fetch('/api/shipments')
      ])

      const statsData = await statsRes.json()
      const ordersData = await ordersRes.json()
      const usersData = await usersRes.json()
      const shipmentsData = await shipmentsRes.json()

      if (statsData.realtime) setStats(statsData)
      if (ordersData.orders) {
        setAllOrders(ordersData.orders)
        setOrders(ordersData.orders)
      }
      if (usersData.users) setUsers(usersData.users)
      if (shipmentsData.shipments) setShipments(shipmentsData.shipments)
    } catch {
      toast.error('Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }, [user])

  const fetchRevenueData = useCallback(async () => {
    setRevenueLoading(true)
    try {
      const params = new URLSearchParams()
      if (revenueTypeFilter !== 'all') params.set('type', revenueTypeFilter)
      params.set('limit', '200')
      const res = await fetch(`/api/revenue?${params.toString()}`)
      const data = await res.json()
      setRevenueData(data)
    } catch {
      toast.error('Failed to load revenue data')
    } finally {
      setRevenueLoading(false)
    }
  }, [revenueTypeFilter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    fetchRevenueData()
  }, [fetchRevenueData])

  const handleVerifyUser = async (userId: string, status: string) => {
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, verificationStatus: status })
      })
      if (res.ok) {
        toast.success(`User ${status === 'verified' ? 'verified' : 'rejected'}`)
        fetchData()
      } else {
        toast.error('Failed to update user')
      }
    } catch {
      toast.error('Failed to update user')
    }
  }

  const handleUpdateTier = async () => {
    if (!selectedUser) return
    setTierUpdating(true)
    try {
      const tierInfo = SUBSCRIPTION_TIERS.find(t => t.id === newTier)
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          subscriptionTier: newTier,
          subscriptionAmount: tierInfo?.price || null,
          subscriptionExpiry: newTier !== 'free' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null,
        })
      })
      if (res.ok) {
        toast.success(`Subscription updated to ${tierInfo?.label || newTier}`)
        setTierDialogOpen(false)
        setSelectedUser(null)
        fetchData()
      } else {
        toast.error('Failed to update subscription')
      }
    } catch {
      toast.error('Failed to update subscription')
    } finally {
      setTierUpdating(false)
    }
  }

  const handleUpdateSponsor = async () => {
    if (!sponsorUser) return
    setSponsorUpdating(true)
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: sponsorUser.id,
          isSponsored: true,
          sponsoredExpiry: sponsorExpiry || null,
          sponsoredAmount: sponsorAmount ? parseFloat(sponsorAmount) : null,
        })
      })
      if (res.ok) {
        toast.success(`${sponsorUser.name || 'User'} set as sponsored producer`)
        setSponsorDialogOpen(false)
        setSponsorUser(null)
        setSponsorExpiry('')
        setSponsorAmount('')
        fetchData()
      } else {
        toast.error('Failed to update sponsor status')
      }
    } catch {
      toast.error('Failed to update sponsor status')
    } finally {
      setSponsorUpdating(false)
    }
  }

  const handleRemoveSponsor = async (userId: string) => {
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          isSponsored: false,
          sponsoredExpiry: null,
          sponsoredAmount: null,
        })
      })
      if (res.ok) {
        toast.success('Sponsored status removed')
        fetchData()
      } else {
        toast.error('Failed to remove sponsor status')
      }
    } catch {
      toast.error('Failed to remove sponsor status')
    }
  }

  const pendingUsers = users.filter(u => u.verificationStatus === 'pending')

  // Prepare chart data
  const orderStatusData = stats?.orderStatusStats?.map((s: any, i: number) => ({
    name: s.status, value: s._count.id, color: DONUT_COLORS[i % DONUT_COLORS.length]
  })) || []

  const categoryData = stats?.categoryStats?.map((s: any, i: number) => ({
    category: s.category.charAt(0).toUpperCase() + s.category.slice(1),
    count: s._count.id,
    avgPrice: Math.round(s._avg.pricePerUnit || 0),
    color: BAR_COLORS[i % BAR_COLORS.length]
  })) || []

  const filteredUsers = users.filter(u => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false
    if (verifFilter !== 'all' && u.verificationStatus !== verifFilter) return false
    return true
  })

  // Revenue data helpers
  const revenueSummary = revenueData?.summary || {}
  const revenueRecords = revenueData?.records || []
  const totalByType = revenueSummary.totalByType || {}

  const revenueChartData = Object.entries(totalByType).map(([type, amount]) => ({
    name: REVENUE_TYPE_LABELS[type] || type,
    value: amount as number,
    color: REVENUE_TYPE_COLORS[type] || '#6b7280',
  }))

  const monthlyBreakdown = revenueSummary.monthlyBreakdown || {}
  const monthlyChartData = Object.entries(monthlyBreakdown)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, data]: [string, any]) => ({
      month,
      total: data.total,
      count: data.count,
    }))

  // Subscription helpers
  const subscriptionFilteredUsers = users.filter(u => {
    if (subscriptionFilter !== 'all') {
      if (subscriptionFilter === 'sponsored') return u.isSponsored
      if (subscriptionFilter === 'premium') return u.subscriptionTier && u.subscriptionTier !== 'free'
      return u.subscriptionTier === subscriptionFilter
    }
    return true
  })

  const sponsoredUsers = users.filter(u => u.isSponsored)

  const getTierBadge = (tier: string | undefined) => {
    if (!tier || tier === 'free') {
      return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 border text-xs">Free</Badge>
    }
    const tierInfo = SUBSCRIPTION_TIERS.find(t => t.id === tier)
    if (tier?.startsWith('producer')) {
      return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 border text-xs">{tierInfo?.label || tier}</Badge>
    }
    if (tier?.startsWith('transporter')) {
      return <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/30 border text-xs">{tierInfo?.label || tier}</Badge>
    }
    return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 border text-xs">{tier}</Badge>
  }

  // =================== OVERVIEW TAB ===================
  if (tab === 'overview') {
    return (
      <div className="space-y-6">
        {/* Stat cards - 6 cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            icon={<Users className="h-5 w-5" />}
            value={String(stats?.realtime?.totalUsers || 0)}
            label="Total Users"
            trend="+12%"
            trendUp
            accentColor="bg-purple-500/15 text-purple-400"
          />
          <StatCard
            icon={<Package className="h-5 w-5" />}
            value={String(stats?.realtime?.totalProducts || 0)}
            label="Products"
            trend="+8%"
            trendUp
            accentColor="bg-emerald-500/15 text-emerald-400"
          />
          <StatCard
            icon={<ShoppingCart className="h-5 w-5" />}
            value={String(stats?.realtime?.totalOrders || 0)}
            label="Orders"
            trend="+15%"
            trendUp
            accentColor="bg-amber-500/15 text-amber-400"
          />
          <StatCard
            icon={<IndianRupee className="h-5 w-5" />}
            value={`₹${((stats?.realtime?.totalRevenue || 0) / 1000).toFixed(0)}K`}
            label="Revenue"
            trend="+24%"
            trendUp
            accentColor="bg-teal-500/15 text-teal-400"
          />
          <StatCard
            icon={<ShieldCheck className="h-5 w-5" />}
            value={String(stats?.realtime?.verifiedUsers || 0)}
            label="Verified Users"
            trend="+5"
            trendUp
            accentColor="bg-green-500/15 text-green-400"
          />
          <StatCard
            icon={<Truck className="h-5 w-5" />}
            value={String(stats?.realtime?.totalShipments || 0)}
            label="Active Shipments"
            trend="+3"
            trendUp
            accentColor="bg-cyan-500/15 text-cyan-400"
          />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Order status donut */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Order Status Distribution</h3>
            {orderStatusData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">No order data available</div>
            ) : (
              <>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={orderStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {orderStatusData.map((entry: any, index: number) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: 'rgba(15,15,30,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-3 mt-2 justify-center">
                  {orderStatusData.map((item: any) => (
                    <div key={item.name} className="flex items-center gap-2 text-xs">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-muted-foreground capitalize">{item.name}</span>
                      <span className="text-foreground font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Category distribution bar */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Category Distribution</h3>
            {categoryData.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">No product data available</div>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis type="number" stroke="rgba(255,255,255,0.4)" fontSize={12} />
                    <YAxis type="category" dataKey="category" stroke="rgba(255,255,255,0.4)" fontSize={11} width={80} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'rgba(15,15,30,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                    />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                      {categoryData.map((entry: any, index: number) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Recent orders */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Recent Orders</h3>
            <Button variant="ghost" size="sm" className="text-purple-400 hover:text-purple-300" onClick={() => useAppStore.getState().setDashboardTab('orders')}>
              View All
            </Button>
          </div>
          {loading ? (
            <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>
          ) : allOrders.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">No orders yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-glass-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Product</TableHead>
                  <TableHead className="text-muted-foreground">Buyer</TableHead>
                  <TableHead className="text-muted-foreground">Seller</TableHead>
                  <TableHead className="text-muted-foreground">Total</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allOrders.slice(0, 6).map((order) => (
                  <TableRow key={order.id} className="border-glass-border">
                    <TableCell className="font-medium text-foreground">{order.product?.name || 'N/A'}</TableCell>
                    <TableCell className="text-muted-foreground">{order.buyer?.name || order.buyer?.companyName || 'N/A'}</TableCell>
                    <TableCell className="text-muted-foreground">{order.seller?.name || order.seller?.companyName || 'N/A'}</TableCell>
                    <TableCell className="text-amber-400 font-medium">₹{order.totalPrice?.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={`${orderStatusColors[order.status] || ''} border text-xs`}>
                        {order.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    )
  }

  // =================== REVENUE TAB ===================
  if (tab === 'revenue') {
    const totalRevenue = revenueSummary.totalRevenue || 0
    const monthlyRevenue = revenueSummary.monthlyRevenue || 0
    const transactionComm = totalByType.transaction_commission || 0
    const transportBooking = totalByType.transport_booking_fee || 0
    const subscriptionRev = totalByType.subscription || 0
    const sponsoredRev = totalByType.sponsored_listing || 0
    const escrowRev = totalByType.escrow_fee || 0
    const logisticsComm = totalByType.logistics_commission || 0

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-emerald-400" />
            Revenue Dashboard
          </h3>
          <Select value={revenueTypeFilter} onValueChange={setRevenueTypeFilter}>
            <SelectTrigger className="glass-input text-foreground w-48 h-9 text-sm">
              <Filter className="h-3 w-3 mr-1" />
              <SelectValue placeholder="Filter type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="transaction_commission">Transaction Commission</SelectItem>
              <SelectItem value="transport_booking_fee">Transport Booking Fee</SelectItem>
              <SelectItem value="subscription">Subscription</SelectItem>
              <SelectItem value="logistics_commission">Logistics Commission</SelectItem>
              <SelectItem value="escrow_fee">Escrow Fee</SelectItem>
              <SelectItem value="sponsored_listing">Sponsored Listing</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Revenue Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<IndianRupee className="h-5 w-5" />}
            value={`₹${totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
            label="Total Revenue (All Time)"
            accentColor="bg-emerald-500/15 text-emerald-400"
          />
          <StatCard
            icon={<TrendingUp className="h-5 w-5" />}
            value={`₹${monthlyRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
            label="Monthly Revenue"
            trend="Current Month"
            trendUp
            accentColor="bg-amber-500/15 text-amber-400"
          />
          <StatCard
            icon={<Receipt className="h-5 w-5" />}
            value={`₹${transactionComm.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
            label="Transaction Commission"
            accentColor="bg-teal-500/15 text-teal-400"
          />
          <StatCard
            icon={<Truck className="h-5 w-5" />}
            value={`₹${transportBooking.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
            label="Transport Booking Fee"
            accentColor="bg-cyan-500/15 text-cyan-400"
          />
          <StatCard
            icon={<Crown className="h-5 w-5" />}
            value={`₹${subscriptionRev.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
            label="Subscription Revenue"
            accentColor="bg-purple-500/15 text-purple-400"
          />
          <StatCard
            icon={<Sparkles className="h-5 w-5" />}
            value={`₹${sponsoredRev.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
            label="Sponsored Listing Revenue"
            accentColor="bg-orange-500/15 text-orange-400"
          />
          <StatCard
            icon={<Wallet className="h-5 w-5" />}
            value={`₹${escrowRev.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
            label="Escrow Fee Revenue"
            accentColor="bg-blue-500/15 text-blue-400"
          />
          <StatCard
            icon={<ArrowUpRight className="h-5 w-5" />}
            value={`₹${logisticsComm.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
            label="Logistics Commission"
            accentColor="bg-green-500/15 text-green-400"
          />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Breakdown Pie Chart */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Revenue Breakdown by Type</h3>
            {revenueChartData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p>No revenue data yet</p>
                  <p className="text-xs mt-1">Revenue entries will appear as orders are placed</p>
                </div>
              </div>
            ) : (
              <>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={revenueChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {revenueChartData.map((entry: any, index: number) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: 'rgba(15,15,30,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                        formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, '']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-3 mt-2 justify-center">
                  {revenueChartData.map((item: any) => (
                    <div key={item.name} className="flex items-center gap-2 text-xs">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-muted-foreground">{item.name}</span>
                      <span className="text-foreground font-medium">₹{item.value.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Monthly Revenue Bar Chart */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Monthly Revenue Trend</h3>
            {monthlyChartData.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p>No monthly data yet</p>
                </div>
              </div>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="month" stroke="rgba(255,255,255,0.4)" fontSize={12} />
                    <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'rgba(15,15,30,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                      formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']}
                    />
                    <Bar dataKey="total" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Recent Revenue Entries */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Recent Revenue Entries</h3>
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 border text-xs">
              {revenueRecords.length} records
            </Badge>
          </div>
          {revenueLoading ? (
            <div className="space-y-3">{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>
          ) : revenueRecords.length === 0 ? (
            <div className="text-center py-12">
              <IndianRupee className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-30" />
              <p className="text-muted-foreground">No revenue entries yet</p>
              <p className="text-xs text-muted-foreground mt-1">Revenue will be recorded as orders are placed and subscriptions activated</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-glass-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Type</TableHead>
                    <TableHead className="text-muted-foreground">Amount</TableHead>
                    <TableHead className="text-muted-foreground">User/Order</TableHead>
                    <TableHead className="text-muted-foreground">Description</TableHead>
                    <TableHead className="text-muted-foreground">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {revenueRecords.map((record: any) => (
                    <TableRow key={record.id} className="border-glass-border">
                      <TableCell>
                        <Badge
                          className="border text-xs"
                          style={{
                            backgroundColor: `${REVENUE_TYPE_COLORS[record.type] || '#6b7280'}20`,
                            color: REVENUE_TYPE_COLORS[record.type] || '#6b7280',
                            borderColor: `${REVENUE_TYPE_COLORS[record.type] || '#6b7280'}30`,
                          }}
                        >
                          {REVENUE_TYPE_LABELS[record.type] || record.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-emerald-400 font-medium">₹{(record.amount || 0).toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {record.user?.name || record.user?.companyName || '—'}
                        {record.order && (
                          <span className="block text-[10px] opacity-60">
                            Order: {record.orderId?.slice(-8) || '—'}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs max-w-[200px] truncate">
                        {record.description || '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {record.createdAt ? new Date(record.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric'
                        }) : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    )
  }

  // =================== SUBSCRIPTIONS TAB ===================
  if (tab === 'subscriptions') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-purple-400" />
            Subscription & Sponsor Management
          </h3>
          <Select value={subscriptionFilter} onValueChange={setSubscriptionFilter}>
            <SelectTrigger className="glass-input text-foreground w-48 h-9 text-sm">
              <Filter className="h-3 w-3 mr-1" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="free">Free Tier</SelectItem>
              <SelectItem value="premium">All Premium</SelectItem>
              <SelectItem value="producer_premium_monthly">Producer Premium</SelectItem>
              <SelectItem value="producer_premium_plus">Producer Premium+</SelectItem>
              <SelectItem value="producer_premium_annual">Producer Annual</SelectItem>
              <SelectItem value="transporter_premium_monthly">Transporter Premium</SelectItem>
              <SelectItem value="transporter_premium_plus">Transporter Premium+</SelectItem>
              <SelectItem value="sponsored">Sponsored</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Subscription Tier Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Users className="h-5 w-5" />}
            value={String(users.filter(u => !u.subscriptionTier || u.subscriptionTier === 'free').length)}
            label="Free Tier Users"
            accentColor="bg-gray-500/15 text-gray-400"
          />
          <StatCard
            icon={<Crown className="h-5 w-5" />}
            value={String(users.filter(u => u.subscriptionTier?.startsWith('producer')).length)}
            label="Producer Premium"
            accentColor="bg-emerald-500/15 text-emerald-400"
          />
          <StatCard
            icon={<Gem className="h-5 w-5" />}
            value={String(users.filter(u => u.subscriptionTier?.startsWith('transporter')).length)}
            label="Transporter Premium"
            accentColor="bg-teal-500/15 text-teal-400"
          />
          <StatCard
            icon={<Sparkles className="h-5 w-5" />}
            value={String(sponsoredUsers.length)}
            label="Sponsored Producers"
            accentColor="bg-orange-500/15 text-orange-400"
          />
        </div>

        {/* Sponsored Producers Section */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-orange-400" />
              Sponsored Producers
            </h3>
            <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 border text-xs">
              {sponsoredUsers.length} active
            </Badge>
          </div>
          {sponsoredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Sparkles className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-30" />
              <p className="text-muted-foreground text-sm">No sponsored producers yet</p>
              <p className="text-xs text-muted-foreground mt-1">Set any producer as sponsored from the users list below</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sponsoredUsers.map((u: any, i: number) => {
                const isExpired = u.sponsoredExpiry && new Date(u.sponsoredExpiry) < new Date()
                return (
                  <motion.div
                    key={u.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`glass-card p-4 border ${isExpired ? 'border-red-500/30' : 'border-orange-500/20'}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-foreground text-sm">{u.name || u.companyName || 'Unknown'}</h4>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                      {isExpired ? (
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/30 border text-[10px]">Expired</Badge>
                      ) : (
                        <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 border text-[10px]">Active</Badge>
                      )}
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      {u.sponsoredAmount && (
                        <div className="flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          <span>₹{u.sponsoredAmount} paid</span>
                        </div>
                      )}
                      {u.sponsoredExpiry && (
                        <div className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          <span>Expires: {new Date(u.sponsoredExpiry).toLocaleDateString('en-IN')}</span>
                        </div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3 w-full border-red-500/30 text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs h-7"
                      onClick={() => handleRemoveSponsor(u.id)}
                    >
                      <X className="h-3 w-3 mr-1" /> Remove Sponsor
                    </Button>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>

        {/* All Users with Subscription Info */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">All Users - Subscription Status</h3>
            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 border text-xs">
              {subscriptionFilteredUsers.length} users
            </Badge>
          </div>
          {loading ? (
            <div className="space-y-3">{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>
          ) : subscriptionFilteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-30" />
              <p className="text-muted-foreground text-sm">No users match the current filter</p>
            </div>
          ) : (
            <div className="max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-glass-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Name</TableHead>
                    <TableHead className="text-muted-foreground">Role</TableHead>
                    <TableHead className="text-muted-foreground">Tier</TableHead>
                    <TableHead className="text-muted-foreground">Expiry</TableHead>
                    <TableHead className="text-muted-foreground">Sponsored</TableHead>
                    <TableHead className="text-muted-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptionFilteredUsers.map((u: any) => {
                    const isExpired = u.sponsoredExpiry && new Date(u.sponsoredExpiry) < new Date()
                    const subExpired = u.subscriptionExpiry && new Date(u.subscriptionExpiry) < new Date()
                    return (
                      <TableRow key={u.id} className="border-glass-border">
                        <TableCell className="font-medium text-foreground">
                          <div>
                            <p>{u.name || 'N/A'}</p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${roleColors[u.role] || ''} border text-xs capitalize`}>
                            {u.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {getTierBadge(u.subscriptionTier)}
                            {subExpired && (
                              <span className="text-[10px] text-red-400">Expired</span>
                            )}
                            {u.subscriptionAmount && (
                              <span className="text-[10px] text-muted-foreground">{u.subscriptionAmount}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {u.subscriptionExpiry
                            ? new Date(u.subscriptionExpiry).toLocaleDateString('en-IN')
                            : '—'}
                        </TableCell>
                        <TableCell>
                          {u.isSponsored ? (
                            <Badge className={`${isExpired ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-orange-500/20 text-orange-400 border-orange-500/30'} border text-xs`}>
                              {isExpired ? 'Expired' : 'Active'}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">No</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                              title="Change subscription tier"
                              onClick={() => {
                                setSelectedUser(u)
                                setNewTier(u.subscriptionTier || 'free')
                                setTierDialogOpen(true)
                              }}
                            >
                              <Crown className="h-3.5 w-3.5" />
                            </Button>
                            {u.role === 'producer' && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-orange-400 hover:text-orange-300 hover:bg-orange-500/10"
                                title="Set as sponsored"
                                onClick={() => {
                                  setSponsorUser(u)
                                  setSponsorExpiry('')
                                  setSponsorAmount('')
                                  setSponsorDialogOpen(true)
                                }}
                              >
                                <Sparkles className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Change Tier Dialog */}
        <Dialog open={tierDialogOpen} onOpenChange={setTierDialogOpen}>
          <DialogContent className="glass-card-strong border-glass-border max-w-md">
            <DialogHeader>
              <DialogTitle className="text-foreground flex items-center gap-2">
                <Crown className="h-5 w-5 text-purple-400" />
                Change Subscription Tier
              </DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4 py-2">
                <div className="glass-card p-3">
                  <p className="text-foreground font-medium">{selectedUser.name || selectedUser.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Current tier: <span className="text-foreground">{selectedUser.subscriptionTier || 'free'}</span>
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">Role: {selectedUser.role}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Select New Tier</label>
                  <Select value={newTier} onValueChange={setNewTier}>
                    <SelectTrigger className="glass-input text-foreground w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBSCRIPTION_TIERS.map(tier => (
                        <SelectItem key={tier.id} value={tier.id}>
                          <div className="flex items-center gap-2">
                            <span>{tier.label}</span>
                            <span className="text-muted-foreground text-xs">({tier.price})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {newTier !== 'free' && (
                  <div className="glass-card p-3 border-purple-500/20">
                    <p className="text-xs text-purple-400 font-medium">{SUBSCRIPTION_TIERS.find(t => t.id === newTier)?.label}</p>
                    <p className="text-xs text-muted-foreground">{SUBSCRIPTION_TIERS.find(t => t.id === newTier)?.description}</p>
                    <p className="text-sm text-foreground font-semibold mt-1">{SUBSCRIPTION_TIERS.find(t => t.id === newTier)?.price}</p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                className="border-glass-border text-muted-foreground"
                onClick={() => setTierDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-purple-600 hover:bg-purple-500 gap-1"
                onClick={handleUpdateTier}
                disabled={tierUpdating}
              >
                {tierUpdating ? (
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Crown className="h-4 w-4" />
                )}
                {tierUpdating ? 'Updating...' : 'Update Tier'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Set Sponsor Dialog */}
        <Dialog open={sponsorDialogOpen} onOpenChange={setSponsorDialogOpen}>
          <DialogContent className="glass-card-strong border-glass-border max-w-md">
            <DialogHeader>
              <DialogTitle className="text-foreground flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-orange-400" />
                Set as Sponsored Producer
              </DialogTitle>
            </DialogHeader>
            {sponsorUser && (
              <div className="space-y-4 py-2">
                <div className="glass-card p-3">
                  <p className="text-foreground font-medium">{sponsorUser.name || sponsorUser.email}</p>
                  <p className="text-xs text-muted-foreground">{sponsorUser.companyName || 'No company'}</p>
                  <p className="text-xs text-muted-foreground">
                    Sponsored producers get higher marketplace visibility
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Sponsor Amount (₹)</label>
                  <Select value={sponsorAmount} onValueChange={setSponsorAmount}>
                    <SelectTrigger className="glass-input text-foreground w-full">
                      <SelectValue placeholder="Select amount" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="50">₹50 - Basic Boost</SelectItem>
                      <SelectItem value="200">₹200 - Standard</SelectItem>
                      <SelectItem value="500">₹500 - Premium</SelectItem>
                      <SelectItem value="1000">₹1000 - Featured</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Expiry Date</label>
                  <input
                    type="date"
                    className="glass-input text-foreground w-full px-3 py-2 rounded-lg text-sm"
                    value={sponsorExpiry}
                    onChange={(e) => setSponsorExpiry(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            )}
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                className="border-glass-border text-muted-foreground"
                onClick={() => setSponsorDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-orange-600 hover:bg-orange-500 gap-1"
                onClick={handleUpdateSponsor}
                disabled={sponsorUpdating}
              >
                {sponsorUpdating ? (
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {sponsorUpdating ? 'Setting...' : 'Set Sponsored'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // =================== USERS TAB ===================
  if (tab === 'users') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-xl font-semibold text-foreground">Users</h3>
          <div className="flex items-center gap-3">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="glass-input text-foreground w-36 h-9 text-sm">
                <Filter className="h-3 w-3 mr-1" />
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="producer">Producer</SelectItem>
                <SelectItem value="buyer">Buyer</SelectItem>
                <SelectItem value="transporter">Transporter</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Select value={verifFilter} onValueChange={setVerifFilter}>
              <SelectTrigger className="glass-input text-foreground w-36 h-9 text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
        ) : filteredUsers.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No users found</p>
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-glass-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Name</TableHead>
                  <TableHead className="text-muted-foreground">Email</TableHead>
                  <TableHead className="text-muted-foreground">Role</TableHead>
                  <TableHead className="text-muted-foreground">Company</TableHead>
                  <TableHead className="text-muted-foreground">State</TableHead>
                  <TableHead className="text-muted-foreground">Verification</TableHead>
                  <TableHead className="text-muted-foreground">Joined</TableHead>
                  <TableHead className="text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((u) => (
                  <TableRow key={u.id} className="border-glass-border">
                    <TableCell className="font-medium text-foreground">{u.name || 'N/A'}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{u.email}</TableCell>
                    <TableCell>
                      <Badge className={`${roleColors[u.role] || ''} border text-xs capitalize`}>
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{u.companyName || '—'}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{u.state || '—'}</TableCell>
                    <TableCell>
                      <Badge className={`${verificationColors[u.verificationStatus] || ''} border text-xs capitalize`}>
                        {u.verificationStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {u.verificationStatus === 'pending' && (
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10" onClick={() => handleVerifyUser(u.id, 'verified')}>
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={() => handleVerifyUser(u.id, 'rejected')}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    )
  }

  // =================== VERIFICATION TAB ===================
  if (tab === 'verification') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-foreground">Verification Requests</h3>
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 border text-xs">
            {pendingUsers.length} pending
          </Badge>
        </div>

        {pendingUsers.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <ShieldCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No pending verification requests</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingUsers.map((u, i) => (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-5 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-foreground">{u.name || 'Unnamed User'}</h4>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  <Badge className={`${roleColors[u.role] || ''} border text-xs capitalize`}>{u.role}</Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Company</p>
                    <p className="text-foreground">{u.companyName || '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">GST</p>
                    <p className="text-foreground">{u.gstNumber || '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">State</p>
                    <p className="text-foreground">{u.state || '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Joined</p>
                    <p className="text-foreground text-xs">{new Date(u.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="pt-2 border-t border-glass-border flex gap-2">
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 gap-1 text-xs" onClick={() => handleVerifyUser(u.id, 'verified')}>
                    <Check className="h-3 w-3" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" className="border-red-500/30 text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-1 text-xs" onClick={() => handleVerifyUser(u.id, 'rejected')}>
                    <X className="h-3 w-3" /> Reject
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // =================== ORDERS TAB ===================
  if (tab === 'orders') {
    return (
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-foreground">All Orders</h3>
        {loading ? (
          <div className="space-y-3">{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
        ) : allOrders.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No orders yet</p>
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-glass-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">ID</TableHead>
                  <TableHead className="text-muted-foreground">Product</TableHead>
                  <TableHead className="text-muted-foreground">Buyer</TableHead>
                  <TableHead className="text-muted-foreground">Seller</TableHead>
                  <TableHead className="text-muted-foreground">Qty</TableHead>
                  <TableHead className="text-muted-foreground">Total</TableHead>
                  <TableHead className="text-muted-foreground">Date</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allOrders.map((order) => (
                  <TableRow key={order.id} className="border-glass-border">
                    <TableCell className="text-muted-foreground text-xs font-mono">{order.id.slice(-8)}</TableCell>
                    <TableCell className="font-medium text-foreground">{order.product?.name || 'N/A'}</TableCell>
                    <TableCell className="text-muted-foreground">{order.buyer?.name || order.buyer?.companyName || 'N/A'}</TableCell>
                    <TableCell className="text-muted-foreground">{order.seller?.name || order.seller?.companyName || 'N/A'}</TableCell>
                    <TableCell className="text-muted-foreground">{order.quantity} {order.product?.unit || ''}</TableCell>
                    <TableCell className="text-amber-400 font-medium">₹{order.totalPrice?.toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge className={`${orderStatusColors[order.status] || ''} border text-xs`}>
                        {order.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    )
  }

  // =================== SHIPMENTS TAB ===================
  if (tab === 'shipments') {
    return (
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-foreground">All Shipments</h3>
        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
        ) : shipments.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No shipments yet</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[700px] overflow-y-auto">
            {shipments.map((shipment, i) => (
              <motion.div
                key={shipment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="glass-card p-4 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">
                      {shipment.order?.product?.name || 'Shipment'} — {shipment.id.slice(-8)}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {shipment.transporter?.name || shipment.transporter?.companyName || 'Unassigned'}
                    </p>
                  </div>
                  <Badge className={`${shipmentStatusColors[shipment.status] || ''} border text-xs`}>
                    {shipment.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                  <div>
                    <p className="text-muted-foreground">Origin</p>
                    <p className="text-foreground">{shipment.origin}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Destination</p>
                    <p className="text-foreground">{shipment.destination}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Distance</p>
                    <p className="text-foreground">{shipment.distance || '—'} km</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Bids</p>
                    <p className="text-amber-400 font-medium">{shipment.transportBids?.length || 0}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p className="text-foreground">{new Date(shipment.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // =================== MESSAGES TAB ===================
  if (tab === 'messages') {
    const allParticipants: any[] = []
    const seen = new Set<string>()
    users.forEach(u => {
      if (u.id !== user?.id && !seen.has(u.id)) {
        seen.add(u.id)
        allParticipants.push({ id: u.id, name: u.name || u.email, role: u.role })
      }
    })

    return (
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-foreground">Messages</h3>
        {allParticipants.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No users to message yet</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {allParticipants.slice(0, 20).map((participant: any, i: number) => (
              <motion.button
                key={participant.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="w-full glass-card p-4 flex items-center gap-4 hover:border-purple-500/30 transition-colors text-left"
                onClick={() => { setActiveChatUser(participant.id); setChatOpen(true) }}
              >
                <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-semibold text-sm">
                  {participant.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{participant.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{participant.role}</p>
                </div>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </motion.button>
            ))}
          </div>
        )}
      </div>
    )
  }

  // =================== PROFILE TAB (Default) ===================
  return (
    <div className="glass-card p-6 text-center">
      <Shield className="h-12 w-12 text-purple-400 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-foreground mb-2">Profile Settings</h3>
      <p className="text-muted-foreground mb-4">Manage your account details and verification status</p>
      <Button className="bg-purple-600 hover:bg-purple-500 gap-2" onClick={() => useAppStore.getState().setView('profile')}>
        <Shield className="h-4 w-4" /> Go to Profile
      </Button>
    </div>
  )
}
