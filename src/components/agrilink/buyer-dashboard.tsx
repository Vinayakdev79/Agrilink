'use client'

import { useAppStore } from '@/lib/store'
import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  ClipboardList, ShoppingCart, IndianRupee, Users, Store, Plus,
  MessageSquare, TrendingUp, TrendingDown, Search, Truck, MapPin,
  ShoppingBag
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
  const { user, setChatOpen, setActiveChatUser, setView, setMarketplaceCategory } = useAppStore()
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

  const fetchData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const ordersRes = await fetch(`/api/orders?userId=${user.id}&role=buyer`)
      const ordersData = await ordersRes.json()
      if (ordersData.orders) setOrders(ordersData.orders)
    } catch {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchData()
  }, [fetchData])

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

  const activeProcurements = requirements.filter(r => r.status === 'open').length
  const totalOrders = orders.length
  const savings = Math.round(orders.filter(o => o.status === 'delivered').reduce((s, o) => s + (o.totalPrice || 0), 0) * 0.12)
  const suppliers = [...new Set(orders.map(o => o.seller?.id).filter(Boolean))].length

  if (tab === 'overview') {
    return (
      <div className="space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<ClipboardList className="h-5 w-5" />} value={String(activeProcurements)} label="Active Procurements" trend="+5%" trendUp />
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
                {orders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-glass-border">
                    <div>
                      <p className="text-sm font-medium text-foreground">{order.product?.name || 'N/A'}</p>
                      <p className="text-xs text-muted-foreground">{order.seller?.name || order.seller?.companyName || 'Unknown'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-amber-400 font-medium">₹{order.totalPrice?.toLocaleString()}</p>
                      <Badge className={`${statusColors[order.status] || ''} border text-[10px]`}>{order.status}</Badge>
                    </div>
                  </div>
                ))}
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
          <DialogContent className="bg-[#0d0d1a] border-glass-border max-h-[90vh] overflow-y-auto">
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
          <h3 className="text-xl font-semibold text-foreground">Procurement</h3>
          <Dialog open={reqOpen} onOpenChange={setReqOpen}>
            <DialogTrigger asChild>
              <Button className="bg-amber-600 hover:bg-amber-500 gap-2">
                <Plus className="h-4 w-4" /> New Requirement
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0d0d1a] border-glass-border max-h-[90vh] overflow-y-auto">
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
                {orders.map((order) => (
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
                      {order.status === 'confirmed' && !order.shipment && (
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
                      {order.shipment && (
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 border text-xs">
                          <Truck className="h-3 w-3 mr-1" /> Shipped
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Create Shipment Dialog */}
        <Dialog open={shipmentForm.open} onOpenChange={(open) => setShipmentForm(prev => ({ ...prev, open }))}>
          <DialogContent className="bg-[#0d0d1a] border-glass-border">
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
