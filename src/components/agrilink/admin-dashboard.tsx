'use client'

import { useAppStore } from '@/lib/store'
import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Users, Package, ShoppingCart, IndianRupee, ShieldCheck, Truck,
  TrendingUp, TrendingDown, Check, X, Eye, MessageSquare, Filter, Shield
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
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

  useEffect(() => {
    fetchData()
  }, [fetchData])

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

  // Default: profile tab
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
