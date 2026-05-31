'use client'

import { useAppStore } from '@/lib/store'
import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  ClipboardList, ShoppingCart, IndianRupee, Users, Store, Plus,
  MessageSquare, TrendingUp, TrendingDown, Search, Truck, MapPin,
  ShoppingBag, Sprout, BadgeCheck, Star, CheckCircle, Clock, Shield, ChevronRight,
  Eye, Gavel, Phone, Crosshair
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ShipmentTracker } from '@/components/agrilink/shipment-tracker'

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

const bidStatusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  accepted: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
}

const categories = ['grains', 'vegetables', 'fruits', 'spices', 'dairy', 'poultry', 'pulses', 'oilseeds']

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

export function BuyerDashboard({ tab }: BuyerDashboardProps) {
  const { user, setChatOpen, setActiveChatUser, setView, setMarketplaceCategory, setSelectedProducerId } = useAppStore()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [reqOpen, setReqOpen] = useState(false)
  const [reqForm, setReqForm] = useState({
    productType: '', category: '', quantityNeeded: '', unit: 'kg',
    deliveryLocation: '', deliveryState: '', maxBudget: '', description: ''
  })
  const [requirements, setRequirements] = useState<any[]>([])
  const [shipmentForm, setShipmentForm] = useState<{ open: boolean; orderId: string; origin: string; destination: string; distance: string }>({
    open: false, orderId: '', origin: '', destination: '', distance: ''
  })
  // Producers tab state
  const [producers, setProducers] = useState<any[]>([])
  const [producersLoading, setProducersLoading] = useState(false)
  const [producerSearch, setProducerSearch] = useState('')
  const [producerStateFilter, setProducerStateFilter] = useState('')
  const [producerCertFilter, setProducerCertFilter] = useState('')
  const [organicOnly, setOrganicOnly] = useState(false)

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

  const handleCreateRequirement = () => {
    const newReq = {
      id: `req_${Date.now()}`,
      ...reqForm,
      status: 'open',
      createdAt: new Date().toISOString()
    }
    setRequirements(prev => [newReq, ...prev])
    toast.success('Requirement created!')
    setReqOpen(false)
    setReqForm({ productType: '', category: '', quantityNeeded: '', unit: 'kg', deliveryLocation: '', deliveryState: '', maxBudget: '', description: '' })
  }

  const handleCreateShipment = async () => {
    try {
      const res = await fetch('/api/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: shipmentForm.orderId,
          origin: shipmentForm.origin,
          destination: shipmentForm.destination,
          distance: shipmentForm.distance
        })
      })
      if (res.ok) {
        toast.success('Shipment created! Transporters will be notified.')
        setShipmentForm({ open: false, orderId: '', origin: '', destination: '', distance: '' })
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

  const activeProcurements = requirements.filter(r => r.status === 'open').length
  const totalOrders = orders.length
  const savings = Math.round(orders.filter(o => o.status === 'delivered').reduce((s, o) => s + (o.totalPrice || 0), 0) * 0.12)
  const suppliers = [...new Set(orders.map(o => o.seller?.id).filter(Boolean))].length

  if (tab === 'overview') {
    return (
      <div className="space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<ClipboardList className="h-5 w-5" />} value={String(activeProcurements)} label="Active Sourcing" trend="+5%" trendUp />
          <StatCard icon={<ShoppingCart className="h-5 w-5" />} value={String(totalOrders)} label="Orders Placed" trend="+15%" trendUp />
          <StatCard icon={<IndianRupee className="h-5 w-5" />} value={`₹${(savings / 1000).toFixed(0)}K`} label="Savings" trend="+18%" trendUp />
          <StatCard icon={<Users className="h-5 w-5" />} value={String(suppliers)} label="Suppliers" trend="+2" trendUp />
        </div>

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
          <Button variant="outline" className="border-glass-border gap-2" onClick={() => setReqOpen(true)}>
            <Plus className="h-4 w-4" /> Create Requirement
          </Button>
          <Button variant="outline" className="border-glass-border gap-2" onClick={() => { setMarketplaceCategory('all'); setView('marketplace') }}>
            <Store className="h-4 w-4" /> View Marketplace
          </Button>
        </div>

        {/* Requirement Dialog */}
        <Dialog open={reqOpen} onOpenChange={setReqOpen}>
          <DialogContent className="bg-[oklch(0.15_0.012_260/0.95)] border-white/20 backdrop-blur-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-foreground">Create Requirement</DialogTitle>
              <DialogDescription className="text-muted-foreground">Post your procurement requirement for suppliers to see</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label className="text-foreground">Product Type</Label>
                <Input className="glass-input text-foreground" placeholder="e.g. Organic Basmati Rice" value={reqForm.productType} onChange={e => setReqForm(p => ({ ...p, productType: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-foreground">Category</Label>
                  <Select value={reqForm.category} onValueChange={v => setReqForm(p => ({ ...p, category: v }))}>
                    <SelectTrigger className="glass-input text-foreground"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {categories.map(c => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label className="text-foreground">Quantity Needed</Label>
                  <Input type="number" className="glass-input text-foreground" placeholder="100" value={reqForm.quantityNeeded} onChange={e => setReqForm(p => ({ ...p, quantityNeeded: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-foreground">Delivery Location</Label>
                  <Input className="glass-input text-foreground" placeholder="e.g. Mumbai" value={reqForm.deliveryLocation} onChange={e => setReqForm(p => ({ ...p, deliveryLocation: e.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label className="text-foreground">State</Label>
                  <Input className="glass-input text-foreground" placeholder="e.g. Maharashtra" value={reqForm.deliveryState} onChange={e => setReqForm(p => ({ ...p, deliveryState: e.target.value }))} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label className="text-foreground">Max Budget (₹)</Label>
                <Input type="number" className="glass-input text-foreground" placeholder="50000" value={reqForm.maxBudget} onChange={e => setReqForm(p => ({ ...p, maxBudget: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label className="text-foreground">Description</Label>
                <Textarea className="glass-input text-foreground min-h-[80px]" placeholder="Describe your requirement..." value={reqForm.description} onChange={e => setReqForm(p => ({ ...p, description: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" className="border-glass-border" onClick={() => setReqOpen(false)}>Cancel</Button>
              <Button className="bg-amber-600 hover:bg-amber-500" onClick={handleCreateRequirement}>Create Requirement</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  if (tab === 'procurement') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-foreground">Sourcing & Requirements</h3>
          <Dialog open={reqOpen} onOpenChange={setReqOpen}>
            <DialogTrigger asChild>
              <Button className="bg-amber-600 hover:bg-amber-500 gap-2">
                <Plus className="h-4 w-4" /> New Requirement
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[oklch(0.15_0.012_260/0.95)] border-white/20 backdrop-blur-xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-foreground">Create Requirement</DialogTitle>
                <DialogDescription className="text-muted-foreground">Post your procurement requirement</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label className="text-foreground">Product Type</Label>
                  <Input className="glass-input text-foreground" placeholder="e.g. Organic Basmati Rice" value={reqForm.productType} onChange={e => setReqForm(p => ({ ...p, productType: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-foreground">Category</Label>
                    <Select value={reqForm.category} onValueChange={v => setReqForm(p => ({ ...p, category: v }))}>
                      <SelectTrigger className="glass-input text-foreground"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {categories.map(c => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-foreground">Quantity</Label>
                    <Input type="number" className="glass-input text-foreground" placeholder="100" value={reqForm.quantityNeeded} onChange={e => setReqForm(p => ({ ...p, quantityNeeded: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-foreground">Delivery Location</Label>
                    <Input className="glass-input text-foreground" placeholder="e.g. Mumbai" value={reqForm.deliveryLocation} onChange={e => setReqForm(p => ({ ...p, deliveryLocation: e.target.value }))} />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-foreground">Max Budget (₹)</Label>
                    <Input type="number" className="glass-input text-foreground" placeholder="50000" value={reqForm.maxBudget} onChange={e => setReqForm(p => ({ ...p, maxBudget: e.target.value }))} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label className="text-foreground">Description</Label>
                  <Textarea className="glass-input text-foreground min-h-[80px]" placeholder="Describe your requirement..." value={reqForm.description} onChange={e => setReqForm(p => ({ ...p, description: e.target.value }))} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" className="border-glass-border" onClick={() => setReqOpen(false)}>Cancel</Button>
                <Button className="bg-amber-600 hover:bg-amber-500" onClick={handleCreateRequirement}>Create Requirement</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {requirements.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No procurement requirements yet. Create one to get started!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requirements.map((req, i) => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-5 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-foreground">{req.productType || 'Unnamed Requirement'}</h4>
                    <p className="text-xs text-muted-foreground capitalize">{req.category}</p>
                  </div>
                  <Badge className={`${req.status === 'open' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'} border text-xs`}>
                    {req.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Quantity</p>
                    <p className="text-foreground">{req.quantityNeeded} {req.unit}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Location</p>
                    <p className="text-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{req.deliveryLocation || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Budget</p>
                    <p className="text-amber-400 font-medium">₹{parseInt(req.maxBudget || '0').toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Created</p>
                    <p className="text-foreground text-xs">{new Date(req.createdAt).toLocaleDateString()}</p>
                  </div>
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
        <h3 className="text-xl font-semibold text-foreground">Orders</h3>
        {loading ? (
          <div className="space-y-3">{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
        ) : orders.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No orders yet</p>
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-glass-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Product</TableHead>
                  <TableHead className="text-muted-foreground">Supplier</TableHead>
                  <TableHead className="text-muted-foreground">Quantity</TableHead>
                  <TableHead className="text-muted-foreground">Total</TableHead>
                  <TableHead className="text-muted-foreground">Date</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => {
                  const shipment = getShipmentForOrder(order.id)
                  const hasShipment = !!shipment
                  const isShippedOrInTransit = shipment && ['picked_up', 'in_transit'].includes(shipment.status)

                  return (
                    <TableRow key={order.id} className="border-glass-border">
                      <TableCell className="font-medium text-foreground">{order.product?.name || 'N/A'}</TableCell>
                      <TableCell className="text-muted-foreground">{order.seller?.name || order.seller?.companyName || 'N/A'}</TableCell>
                      <TableCell className="text-muted-foreground">{order.quantity} {order.product?.unit || ''}</TableCell>
                      <TableCell className="text-amber-400 font-medium">₹{order.totalPrice?.toLocaleString()}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge className={`${statusColors[order.status] || ''} border text-xs`}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Create Shipment button - for confirmed orders without shipments */}
                          {order.status === 'confirmed' && !hasShipment && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-teal-500/30 text-teal-400 hover:text-teal-300 hover:bg-teal-500/10 gap-1 text-xs"
                              onClick={() => setShipmentForm({
                                open: true,
                                orderId: order.id,
                                origin: order.seller?.city || '',
                                destination: user?.city || '',
                                distance: ''
                              })}
                            >
                              <Truck className="h-3 w-3" /> Create Shipment
                            </Button>
                          )}

                          {/* View Bids button - for orders with shipments that are pending/bidding */}
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

                          {/* Shipped badge for assigned shipments */}
                          {hasShipment && shipment.status === 'assigned' && (
                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 border text-xs">
                              <Truck className="h-3 w-3 mr-1" /> Assigned
                            </Badge>
                          )}

                          {/* Track Shipment button for in-transit */}
                          {isShippedOrInTransit && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-cyan-500/30 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 gap-1 text-xs"
                              onClick={() => handleTrackShipment(shipment)}
                            >
                              <Crosshair className="h-3 w-3" /> Track
                            </Button>
                          )}

                          {/* Delivered badge */}
                          {hasShipment && shipment.status === 'delivered' && (
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 border text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" /> Delivered
                            </Badge>
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

        {/* Create Shipment Dialog */}
        <Dialog open={shipmentForm.open} onOpenChange={(open) => setShipmentForm(prev => ({ ...prev, open }))}>
          <DialogContent className="bg-[oklch(0.15_0.012_260/0.95)] border-white/20 backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle className="text-foreground">Create Shipment</DialogTitle>
              <DialogDescription className="text-muted-foreground">Set up shipment for this order</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label className="text-foreground">Origin</Label>
                <Input className="glass-input text-foreground" value={shipmentForm.origin} onChange={e => setShipmentForm(p => ({ ...p, origin: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label className="text-foreground">Destination</Label>
                <Input className="glass-input text-foreground" value={shipmentForm.destination} onChange={e => setShipmentForm(p => ({ ...p, destination: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label className="text-foreground">Distance (km)</Label>
                <Input type="number" className="glass-input text-foreground" placeholder="e.g. 500" value={shipmentForm.distance} onChange={e => setShipmentForm(p => ({ ...p, distance: e.target.value }))} />
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
      const matchesState = !producerStateFilter || p.state === producerStateFilter
      const matchesCert = !producerCertFilter ||
        (p.certifications && p.certifications.toLowerCase().includes(producerCertFilter.toLowerCase()))
      const matchesOrganic = !organicOnly ||
        (p.certifications && p.certifications.toLowerCase().includes('organic'))
      return matchesSearch && matchesState && matchesCert && matchesOrganic
    })
    const producerStates = [...new Set(producers.map((p: any) => p.state).filter(Boolean))].sort()
    const allCerts = [...new Set(producers.flatMap((p: any) => p.certifications ? p.certifications.split(',').map((c: string) => c.trim()) : []))].sort()

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-foreground">Producers Directory</h3>
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 border text-xs">
            {filteredProducers.length} Producers
          </Badge>
        </div>

        {/* Search and Filters */}
        <div className="glass-card p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="glass-input text-foreground pl-9"
                placeholder="Search producers by name, company, or farm..."
                value={producerSearch}
                onChange={(e) => setProducerSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={producerStateFilter} onValueChange={setProducerStateFilter}>
                <SelectTrigger className="glass-input text-foreground w-36">
                  <SelectValue placeholder="State" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  {producerStates.map((s: string) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={producerCertFilter} onValueChange={setProducerCertFilter}>
                <SelectTrigger className="glass-input text-foreground w-36">
                  <SelectValue placeholder="Certification" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Certs</SelectItem>
                  {allCerts.map((c: string) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={organicOnly ? 'default' : 'outline'}
              className={organicOnly ? 'bg-emerald-600 hover:bg-emerald-500 gap-1.5' : 'border-glass-border gap-1.5'}
              onClick={() => setOrganicOnly(!organicOnly)}
            >
              <Sprout className="h-3.5 w-3.5" /> Organic Only
            </Button>
            {(producerSearch || producerStateFilter || producerCertFilter || organicOnly) && (
              <Button
                size="sm"
                variant="ghost"
                className="text-muted-foreground hover:text-foreground gap-1.5"
                onClick={() => { setProducerSearch(''); setProducerStateFilter(''); setProducerCertFilter(''); setOrganicOnly(false) }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Producers Grid */}
        {producersLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-52 rounded-xl" />)}
          </div>
        ) : filteredProducers.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Sprout className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No producers found matching your criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducers.map((p: any, i: number) => {
              const initials = (p.name || 'P').slice(0, 2).toUpperCase()
              const isVerified = p.verificationStatus === 'verified'
              const isPending = p.verificationStatus === 'pending'
              const pCerts = p.certifications ? p.certifications.split(',').map((c: string) => c.trim()).filter(Boolean) : []
              const productCount = p._count?.products || 0
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -4 }}
                  className="glass-card p-4 cursor-pointer hover:border-emerald-500/30 transition-all"
                  onClick={() => { setSelectedProducerId(p.id); setView('producer-profile') }}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <Avatar className="h-12 w-12 border border-glass-border shrink-0">
                      <AvatarFallback className="bg-emerald-500/20 text-emerald-400 text-sm font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-semibold text-foreground text-sm truncate">{p.name}</h4>
                        {isVerified && <BadgeCheck className="h-4 w-4 text-emerald-400 shrink-0" />}
                      </div>
                      {p.companyName && (
                        <p className="text-xs text-amber-400 truncate">{p.companyName}</p>
                      )}
                      {p.farmName && (
                        <p className="text-xs text-muted-foreground truncate">{p.farmName}</p>
                      )}
                    </div>
                  </div>

                  {/* Location */}
                  {(p.city || p.state) && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                      <MapPin className="h-3 w-3 text-emerald-400" />
                      {[p.city, p.state].filter(Boolean).join(', ')}
                    </div>
                  )}

                  {/* Verification & Rating */}
                  <div className="flex items-center gap-3 mb-2">
                    <Badge className={`border text-[10px] ${
                      isVerified ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                      isPending ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                      'bg-red-500/20 text-red-400 border-red-500/30'
                    }`}>
                      {isVerified ? <><CheckCircle className="h-2.5 w-2.5 mr-0.5" /> Verified</> :
                       isPending ? <><Clock className="h-2.5 w-2.5 mr-0.5" /> Pending</> :
                       <><Shield className="h-2.5 w-2.5 mr-0.5" /> Rejected</>}
                    </Badge>
                    {p.avgRating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                        <span className="text-xs text-amber-400 font-medium">{p.avgRating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="text-center p-1.5 rounded-lg bg-white/[0.02] border border-glass-border">
                      <p className="text-xs font-bold text-foreground">{p.yearsExperience || 0}</p>
                      <p className="text-[9px] text-muted-foreground">Yrs Exp</p>
                    </div>
                    <div className="text-center p-1.5 rounded-lg bg-white/[0.02] border border-glass-border">
                      <p className="text-xs font-bold text-foreground">{productCount}</p>
                      <p className="text-[9px] text-muted-foreground">Products</p>
                    </div>
                    <div className="text-center p-1.5 rounded-lg bg-white/[0.02] border border-glass-border">
                      <p className="text-xs font-bold text-foreground">{p.totalTransactions || 0}</p>
                      <p className="text-[9px] text-muted-foreground">Trans.</p>
                    </div>
                  </div>

                  {/* Certifications */}
                  {pCerts.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {pCerts.slice(0, 3).map((cert: string, ci: number) => (
                        <Badge key={ci} className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 border text-[9px] px-1.5 py-0">
                          {cert}
                        </Badge>
                      ))}
                      {pCerts.length > 3 && (
                        <Badge className="bg-white/5 text-muted-foreground border-glass-border border text-[9px] px-1.5 py-0">
                          +{pCerts.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-end mt-2">
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
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
            <p className="text-muted-foreground">No conversations yet. Start ordering to connect with suppliers!</p>
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
      <ShoppingBag className="h-12 w-12 text-amber-400 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-foreground mb-2">Profile Settings</h3>
      <p className="text-muted-foreground mb-4">Manage your account details and verification status</p>
      <Button className="bg-amber-600 hover:bg-amber-500 gap-2" onClick={() => useAppStore.getState().setView('profile')}>
        <ShoppingBag className="h-4 w-4" /> Go to Profile
      </Button>
    </div>
  )
}
