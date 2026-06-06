'use client'

import { useAppStore } from '@/lib/store'
import { useEffect, useState, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  ClipboardList, ShoppingCart, IndianRupee, Users, Store, Plus,
  MessageSquare, TrendingUp, TrendingDown, Search, Truck, MapPin,
  ShoppingBag, Sprout, BadgeCheck, Star, CheckCircle, Clock, Shield, ChevronRight,
  Eye, Gavel, Phone, Crosshair, CalendarDays, Image as ImageIcon, Upload, User, Leaf
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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

const shipmentStatusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  bidding: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  assigned: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  picked_up: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  in_transit: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  delivered: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
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
  const [shipmentForm, setShipmentForm] = useState<{
    open: boolean; orderId: string; origin: string; originState: string; destination: string; destinationState: string; distance: string; budgetMin: string; budgetMax: string
  }>({
    open: false, orderId: '', origin: '', originState: '', destination: '', destinationState: '', distance: '', budgetMin: '', budgetMax: ''
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
      const body: Record<string, unknown> = {
        orderId: shipmentForm.orderId,
        origin: shipmentForm.origin,
        destination: shipmentForm.destination,
        distance: shipmentForm.distance,
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
        setShipmentForm({ open: false, orderId: '', origin: '', originState: '', destination: '', destinationState: '', distance: '', budgetMin: '', budgetMax: '' })
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
                        <Badge className={`${statusColors[order.status] || ''} border text-xs shrink-0`}>
                          {order.status}
                        </Badge>
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

                  {/* Seller info */}
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
                    <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>

                  {/* Shipment Transport Details */}
                  {hasTransport && (
                    <div className="glass-card p-4 border border-teal-500/20">
                      <div className="flex items-center gap-2 mb-3">
                        <Truck className="h-4 w-4 text-teal-400" />
                        <h5 className="text-sm font-semibold text-foreground">Transport Details</h5>
                        <Badge className={`${shipmentStatusColors[shipment.status] || ''} border text-[10px] ml-auto`}>
                          {shipment.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground text-[10px]">Company</p>
                          <p className="text-foreground font-medium text-xs">
                            {shipment.transporter?.companyName || shipment.transporter?.name || 'N/A'}
                          </p>
                        </div>
                        {shipment.driverName && (
                          <div>
                            <p className="text-muted-foreground text-[10px]">Driver</p>
                            <p className="text-foreground font-medium text-xs flex items-center gap-1">
                              <User className="h-3 w-3 text-emerald-400" />
                              {shipment.driverName}
                            </p>
                            {shipment.driverPhone && (
                              <p className="text-muted-foreground text-[10px] flex items-center gap-1 mt-0.5">
                                <Phone className="h-2.5 w-2.5" />
                                {shipment.driverPhone}
                              </p>
                            )}
                          </div>
                        )}
                        {(shipment.vehicleType || shipment.vehicleNumber) && (
                          <div>
                            <p className="text-muted-foreground text-[10px]">Vehicle</p>
                            <p className="text-foreground font-medium text-xs flex items-center gap-1">
                              <Truck className="h-3 w-3 text-emerald-400" />
                              {shipment.vehicleType || 'N/A'}
                              {shipment.vehicleNumber && ` (${shipment.vehicleNumber})`}
                            </p>
                          </div>
                        )}
                        {shipment.expectedPickupDate && (
                          <div>
                            <p className="text-muted-foreground text-[10px]">Expected Pickup</p>
                            <p className="text-foreground font-medium text-xs flex items-center gap-1">
                              <CalendarDays className="h-3 w-3 text-amber-400" />
                              {new Date(shipment.expectedPickupDate).toLocaleDateString('en-IN')}
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

                      {/* Track Shipment Button */}
                      {isShippedOrInTransit && (
                        <div className="mt-3 pt-3 border-t border-glass-border">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-cyan-500/30 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 gap-1.5 text-xs"
                            onClick={() => handleTrackShipment(shipment)}
                          >
                            <Crosshair className="h-3.5 w-3.5" /> Track Shipment
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {order.status === 'confirmed' && !hasShipment && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-teal-500/30 text-teal-400 hover:text-teal-300 hover:bg-teal-500/10 gap-1 text-xs"
                        onClick={() => {
                          setShipmentForm({
                            open: true,
                            orderId: order.id,
                            origin: `${order.seller?.city || ''}${order.seller?.state ? ', ' + order.seller.state : ''}`,
                            originState: order.seller?.state || '',
                            destination: order.deliveryAddress
                              ? `${order.deliveryAddress}, ${order.deliveryCity || ''}, ${order.deliveryState || ''} ${order.deliveryPincode || ''}`
                              : `${user?.city || ''}${user?.state ? ', ' + user.state : ''}`,
                            destinationState: order.deliveryState || user?.state || '',
                            distance: '',
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
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Create Shipment Dialog */}
        <Dialog open={shipmentForm.open} onOpenChange={(open) => setShipmentForm(prev => ({ ...prev, open }))}>
          <DialogContent className="bg-[oklch(0.15_0.012_260/0.95)] border-white/20 backdrop-blur-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-foreground">Create Shipment</DialogTitle>
              <DialogDescription className="text-muted-foreground">Set up shipment for this order</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Auto-fill notice */}
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <MapPin className="h-4 w-4 text-emerald-400 shrink-0" />
                <p className="text-xs text-muted-foreground">Pickup and delivery addresses are auto-filled from order details</p>
              </div>

              {/* Pickup info */}
              <div className="glass-card p-3 border border-emerald-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm font-medium text-foreground">Pickup from (Seller)</span>
                </div>
                <div className="grid gap-1">
                  <Label className="text-foreground text-xs">Address</Label>
                  <Input className="glass-input text-foreground text-sm h-9 opacity-70 cursor-not-allowed" value={shipmentForm.origin} readOnly />
                </div>
              </div>

              {/* Destination info */}
              <div className="glass-card p-3 border border-amber-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-amber-400" />
                  <span className="text-sm font-medium text-foreground">Deliver to (Buyer)</span>
                </div>
                <div className="grid gap-1">
                  <Label className="text-foreground text-xs">Address</Label>
                  <Input className="glass-input text-foreground text-sm h-9 opacity-70 cursor-not-allowed" value={shipmentForm.destination} readOnly />
                </div>
              </div>

              {/* Budget Range */}
              <div className="glass-card p-3 border border-teal-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <IndianRupee className="h-4 w-4 text-teal-400" />
                  <span className="text-sm font-medium text-foreground">Transport Budget Range</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1">
                    <Label className="text-foreground text-xs">Budget Min (₹)</Label>
                    <Input type="number" className="glass-input text-foreground text-sm h-9" placeholder="e.g. 5000" value={shipmentForm.budgetMin} onChange={e => setShipmentForm(p => ({ ...p, budgetMin: e.target.value }))} />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-foreground text-xs">Budget Max (₹)</Label>
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
      const matchesState = !producerStateFilter || p.state === producerStateFilter
      const matchesCert = !producerCertFilter ||
        (p.certifications && p.certifications.toLowerCase().includes(producerCertFilter.toLowerCase()))
      const matchesOrganic = !organicOnly ||
        (p.certifications && p.certifications.toLowerCase().includes('organic'))
      return matchesSearch && matchesState && matchesCert && matchesOrganic
    })

    // Sort producers
    const sortedProducers = [...filteredProducers].sort((a: any, b: any) => {
      if (producerSort === 'rating') return (b.avgRating || 0) - (a.avgRating || 0)
      if (producerSort === 'experience') return (b.yearsExperience || 0) - (a.yearsExperience || 0)
      if (producerSort === 'newest') return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      return 0
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

        {/* Search, Filters & Sort */}
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
            <div className="flex flex-wrap gap-2">
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
              <Select value={producerSort} onValueChange={setProducerSort}>
                <SelectTrigger className="glass-input text-foreground w-36">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Top Rated</SelectItem>
                  <SelectItem value="experience">Most Experienced</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
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
                onClick={() => { setProducerSearch(''); setProducerStateFilter(''); setProducerCertFilter(''); setOrganicOnly(false); setProducerSort('rating') }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Producers Card Grid */}
        {producersLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-72 rounded-xl" />)}
          </div>
        ) : sortedProducers.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Sprout className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No producers found matching your criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedProducers.map((producer: any, i: number) => {
              const isVerified = producer.verificationStatus === 'verified'
              const isPending = producer.verificationStatus === 'pending'
              const pCerts = producer.certifications ? producer.certifications.split(',').map((c: string) => c.trim()).filter(Boolean) : []
              const productCount = producer._count?.products || 0
              return (
                <motion.div
                  key={producer.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  whileHover={{ y: -4 }}
                  className="glass-card overflow-hidden hover:border-emerald-500/20 transition-all cursor-pointer"
                  onClick={() => { setSelectedProducerId(producer.id); setView('producer-profile') }}
                >
                  {/* Banner gradient */}
                  <div className="h-16 bg-gradient-to-r from-emerald-900/40 to-amber-900/30 relative">
                    {producer.bannerUrl && (
                      <img src={producer.bannerUrl} alt="" className="w-full h-full object-cover opacity-60" />
                    )}
                    {/* Verification badge */}
                    {isVerified && (
                      <BadgeCheck className="absolute top-2 right-2 w-5 h-5 text-emerald-400" />
                    )}
                    {isPending && (
                      <Clock className="absolute top-2 right-2 w-4 h-4 text-yellow-400" />
                    )}
                  </div>

                  {/* Avatar - overlapping the banner */}
                  <div className="px-4 -mt-8 relative z-10">
                    <Avatar className="h-14 w-14 border-[3px] border-background shadow-lg">
                      {producer.avatarUrl ? (
                        <AvatarImage src={producer.avatarUrl} alt={producer.name || ''} />
                      ) : null}
                      <AvatarFallback className="bg-emerald-500/20 text-emerald-400 font-bold">
                        {(producer.name || 'P').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  {/* Info */}
                  <div className="p-4 pt-2 space-y-3">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-semibold text-foreground text-sm truncate">{producer.name}</h4>
                      </div>
                      {producer.companyName && (
                        <p className="text-xs text-amber-400 truncate">{producer.companyName}</p>
                      )}
                      {producer.farmName && !producer.companyName && (
                        <p className="text-xs text-amber-400 truncate flex items-center gap-1">
                          <Sprout className="h-3 w-3" /> {producer.farmName}
                        </p>
                      )}
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3 text-emerald-400" />
                      {[producer.city, producer.state].filter(Boolean).join(', ') || 'India'}
                    </div>

                    {/* Verification & Rating row */}
                    <div className="flex items-center gap-2">
                      {!isVerified && (
                        <Badge className={`border text-[9px] px-1.5 py-0 ${
                          isPending ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                          'bg-red-500/20 text-red-400 border-red-500/30'
                        }`}>
                          {isPending ? <><Clock className="h-2.5 w-2.5 mr-0.5" /> Pending</> :
                           <><Shield className="h-2.5 w-2.5 mr-0.5" /> Unverified</>}
                        </Badge>
                      )}
                      {(producer.avgRating > 0 || producer.totalReviews > 0) && (
                        <div className="flex items-center gap-1">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-3 w-3 ${
                                  star <= Math.round(producer.avgRating || 0)
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-muted-foreground/30'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-amber-400 font-medium">{(producer.avgRating || 0).toFixed(1)}</span>
                          {producer.totalReviews > 0 && (
                            <span className="text-[9px] text-muted-foreground">({producer.totalReviews})</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="glass-card p-2">
                        <p className="text-xs font-bold text-foreground">{producer.yearsExperience || 0}</p>
                        <p className="text-[9px] text-muted-foreground">Yrs Exp</p>
                      </div>
                      <div className="glass-card p-2">
                        <p className="text-xs font-bold text-foreground">{producer.avgRating?.toFixed(1) || '—'}</p>
                        <p className="text-[9px] text-muted-foreground">Rating</p>
                      </div>
                      <div className="glass-card p-2">
                        <p className="text-xs font-bold text-foreground">{producer.farmSize || '—'}</p>
                        <p className="text-[9px] text-muted-foreground">Farm</p>
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

                    {/* Product count */}
                    {productCount > 0 && (
                      <p className="text-[10px] text-muted-foreground">
                        <ShoppingBag className="h-3 w-3 inline mr-1 text-emerald-400" />
                        {productCount} product{productCount !== 1 ? 's' : ''} listed
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-8 text-xs border-white/10 hover:bg-white/5"
                        onClick={(e) => {
                          e.stopPropagation()
                          setActiveChatUser(producer.id)
                          setChatOpen(true)
                        }}
                      >
                        <MessageSquare className="w-3 h-3 mr-1" /> Message
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 h-8 text-xs bg-emerald-500 hover:bg-emerald-400 text-white"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedProducerId(producer.id)
                          setView('producer-profile')
                        }}
                      >
                        View Profile
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
