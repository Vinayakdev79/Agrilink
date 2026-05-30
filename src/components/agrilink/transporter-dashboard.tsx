'use client'

import { useAppStore } from '@/lib/store'
import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Truck, Package, IndianRupee, Star, MapPin, Clock, Gavel,
  TrendingUp, TrendingDown, CheckCircle, Navigation, MessageSquare
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
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { toast } from 'sonner'

interface TransporterDashboardProps {
  tab: string
}

const earningsData = [
  { month: 'Jul', earnings: 45000, trips: 8 },
  { month: 'Aug', earnings: 62000, trips: 12 },
  { month: 'Sep', earnings: 38000, trips: 7 },
  { month: 'Oct', earnings: 78000, trips: 14 },
  { month: 'Nov', earnings: 55000, trips: 10 },
  { month: 'Dec', earnings: 89000, trips: 16 },
]

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  bidding: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  assigned: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  picked_up: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  in_transit: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  delivered: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  accepted: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
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
        <div className="h-10 w-10 rounded-xl bg-teal-500/15 flex items-center justify-center text-teal-400">
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

export function TransporterDashboard({ tab }: TransporterDashboardProps) {
  const { user, setChatOpen, setActiveChatUser } = useAppStore()
  const [shipments, setShipments] = useState<any[]>([])
  const [pendingShipments, setPendingShipments] = useState<any[]>([])
  const [bids, setBids] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [bidDialogOpen, setBidDialogOpen] = useState(false)
  const [bidForm, setBidForm] = useState({
    shipmentId: '', bidAmount: '', estimatedDays: '', vehicleType: 'truck', comments: ''
  })

  const fetchData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const [shipRes, myShipRes] = await Promise.all([
        fetch('/api/shipments'),
        fetch(`/api/shipments?transporterId=${user.id}`)
      ])
      const shipData = await shipRes.json()
      const myShipData = await myShipRes.json()

      if (shipData.shipments) setShipments(shipData.shipments)
      if (shipData.pendingShipments) setPendingShipments(shipData.pendingShipments)

      // My shipments and bids
      const myShipments = myShipData.shipments || []
      setShipments(prev => prev.length > 0 ? prev : myShipments)

      // Collect bids from my shipments
      const myBids: any[] = []
      const allShipments = shipData.shipments || []
      allShipments.forEach((s: any) => {
        if (s.transportBids) {
          s.transportBids.forEach((b: any) => {
            if (b.transporterId === user.id) {
              myBids.push({ ...b, shipment: s })
            }
          })
        }
      })
      setBids(myBids)
    } catch {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handlePlaceBid = async () => {
    if (!user) return
    try {
      const res = await fetch('/api/transport-bids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipmentId: bidForm.shipmentId,
          transporterId: user.id,
          bidAmount: bidForm.bidAmount,
          estimatedDays: bidForm.estimatedDays,
          vehicleType: bidForm.vehicleType,
          comments: bidForm.comments
        })
      })
      if (res.ok) {
        toast.success('Bid placed successfully!')
        setBidDialogOpen(false)
        setBidForm({ shipmentId: '', bidAmount: '', estimatedDays: '', vehicleType: 'truck', comments: '' })
        fetchData()
      } else {
        toast.error('Failed to place bid')
      }
    } catch {
      toast.error('Failed to place bid')
    }
  }

  const handleShipmentStatus = async (shipmentId: string, status: string) => {
    try {
      const res = await fetch('/api/shipments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipmentId, status })
      })
      if (res.ok) {
        toast.success(`Shipment status updated to ${status.replace('_', ' ')}`)
        fetchData()
      } else {
        toast.error('Failed to update shipment')
      }
    } catch {
      toast.error('Failed to update shipment')
    }
  }

  const myShipments = shipments.filter(s => s.transporterId === user?.id)
  const activeShipments = myShipments.filter(s => ['assigned', 'picked_up', 'in_transit'].includes(s.status)).length
  const completedShipments = myShipments.filter(s => s.status === 'delivered').length
  const totalEarnings = myShipments.filter(s => s.status === 'delivered').reduce((s, sh) => {
    const bid = sh.transportBids?.find((b: any) => b.status === 'accepted')
    return s + (bid?.bidAmount || 0)
  }, 0)
  const avgRating = 4.5

  if (tab === 'overview') {
    return (
      <div className="space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<Truck className="h-5 w-5" />} value={String(activeShipments)} label="Active Shipments" trend="+3" trendUp />
          <StatCard icon={<CheckCircle className="h-5 w-5" />} value={String(completedShipments)} label="Completed" trend="+22%" trendUp />
          <StatCard icon={<IndianRupee className="h-5 w-5" />} value={`₹${(totalEarnings / 1000).toFixed(0)}K`} label="Revenue" trend="+18%" trendUp />
          <StatCard icon={<Star className="h-5 w-5" />} value={avgRating.toFixed(1)} label="Rating" trend="+0.2" trendUp />
        </div>

        {/* Earnings chart */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Earnings Overview</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={earningsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.4)" fontSize={12} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickFormatter={(v) => `₹${v / 1000}K`} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(15,15,30,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                  formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Earnings']}
                />
                <Bar dataKey="earnings" fill="#14b8a6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent bids */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Recent Bids</h3>
            <Button variant="ghost" size="sm" className="text-teal-400 hover:text-teal-300" onClick={() => useAppStore.getState().setDashboardTab('bids')}>
              View All
            </Button>
          </div>
          {bids.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">No bids placed yet. Check available loads!</p>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {bids.slice(0, 5).map((bid) => (
                <div key={bid.id} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-glass-border">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {bid.shipment?.origin} → {bid.shipment?.destination}
                    </p>
                    <p className="text-xs text-muted-foreground">Bid: ₹{bid.bidAmount?.toLocaleString()}</p>
                  </div>
                  <Badge className={`${statusColors[bid.status] || ''} border text-xs`}>
                    {bid.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (tab === 'loads') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-foreground">Available Loads</h3>
          <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/30 border text-xs">
            {pendingShipments.length} available
          </Badge>
        </div>

        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div>
        ) : pendingShipments.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No available loads at the moment. Check back later!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingShipments.map((shipment, i) => (
              <motion.div
                key={shipment.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-5 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-foreground">
                      {shipment.order?.product?.name || 'Freight Load'}
                    </h4>
                    <p className="text-xs text-muted-foreground capitalize">{shipment.order?.product?.category || 'General'}</p>
                  </div>
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 border text-xs">
                    Bidding Open
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span className="text-foreground">{shipment.origin}</span>
                  </div>
                  <div className="flex-1 border-t border-dashed border-glass-border" />
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-red-400" />
                    <span className="text-foreground">{shipment.destination}</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Distance</p>
                    <p className="text-foreground">{shipment.distance || '—'} km</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Bids</p>
                    <p className="text-amber-400 font-medium">{shipment.transportBids?.length || 0} bids</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Order</p>
                    <p className="text-foreground text-xs">{shipment.order?.product?.name || 'N/A'}</p>
                  </div>
                </div>
                <div className="pt-2 border-t border-glass-border">
                  <Button
                    className="bg-teal-600 hover:bg-teal-500 gap-2 w-full"
                    onClick={() => {
                      setBidForm(prev => ({ ...prev, shipmentId: shipment.id }))
                      setBidDialogOpen(true)
                    }}
                  >
                    <Gavel className="h-4 w-4" /> Place Bid
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Bid Dialog */}
        <Dialog open={bidDialogOpen} onOpenChange={setBidDialogOpen}>
          <DialogContent className="bg-[#0d0d1a] border-glass-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Place Bid</DialogTitle>
              <DialogDescription className="text-muted-foreground">Submit your bid for this shipment</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label className="text-foreground">Bid Amount (₹)</Label>
                <Input type="number" className="glass-input text-foreground" placeholder="e.g. 15000" value={bidForm.bidAmount} onChange={e => setBidForm(p => ({ ...p, bidAmount: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-foreground">Estimated Days</Label>
                  <Input type="number" className="glass-input text-foreground" placeholder="e.g. 3" value={bidForm.estimatedDays} onChange={e => setBidForm(p => ({ ...p, estimatedDays: e.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label className="text-foreground">Vehicle Type</Label>
                  <Select value={bidForm.vehicleType} onValueChange={v => setBidForm(p => ({ ...p, vehicleType: v }))}>
                    <SelectTrigger className="glass-input text-foreground"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="truck">Truck</SelectItem>
                      <SelectItem value="tempo">Tempo</SelectItem>
                      <SelectItem value="container">Container</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label className="text-foreground">Comments</Label>
                <Textarea className="glass-input text-foreground min-h-[60px]" placeholder="Any notes..." value={bidForm.comments} onChange={e => setBidForm(p => ({ ...p, comments: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" className="border-glass-border" onClick={() => setBidDialogOpen(false)}>Cancel</Button>
              <Button className="bg-teal-600 hover:bg-teal-500" onClick={handlePlaceBid}>Submit Bid</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  if (tab === 'shipments') {
    return (
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-foreground">My Shipments</h3>
        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div>
        ) : myShipments.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No shipments assigned yet. Place bids on available loads!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {myShipments.map((shipment, i) => (
              <motion.div
                key={shipment.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-5 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-foreground">
                      {shipment.order?.product?.name || 'Shipment'}
                    </h4>
                    <p className="text-xs text-muted-foreground">ID: {shipment.id.slice(-8)}</p>
                  </div>
                  <Badge className={`${statusColors[shipment.status] || ''} border text-xs`}>
                    {shipment.status.replace('_', ' ')}
                  </Badge>
                </div>

                {/* Route display */}
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Navigation className="h-4 w-4 text-emerald-400" />
                    <span className="text-foreground">{shipment.origin}</span>
                  </div>
                  <div className="flex-1 border-t border-dashed border-glass-border" />
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-red-400" />
                    <span className="text-foreground">{shipment.destination}</span>
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Distance</p>
                    <p className="text-foreground">{shipment.distance || '—'} km</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Vehicle</p>
                    <p className="text-foreground capitalize">{shipment.vehicleType || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Pickup Date</p>
                    <p className="text-foreground text-xs">{shipment.pickupDate ? new Date(shipment.pickupDate).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Delivery</p>
                    <p className="text-foreground text-xs">{shipment.deliveryDate ? new Date(shipment.deliveryDate).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>

                {/* Status actions */}
                {['assigned', 'picked_up', 'in_transit'].includes(shipment.status) && (
                  <div className="pt-2 border-t border-glass-border flex gap-2 flex-wrap">
                    {shipment.status === 'assigned' && (
                      <Button size="sm" className="bg-cyan-600 hover:bg-cyan-500 gap-1 text-xs" onClick={() => handleShipmentStatus(shipment.id, 'picked_up')}>
                        <CheckCircle className="h-3 w-3" /> Picked Up
                      </Button>
                    )}
                    {shipment.status === 'picked_up' && (
                      <Button size="sm" className="bg-teal-600 hover:bg-teal-500 gap-1 text-xs" onClick={() => handleShipmentStatus(shipment.id, 'in_transit')}>
                        <Navigation className="h-3 w-3" /> In Transit
                      </Button>
                    )}
                    {shipment.status === 'in_transit' && (
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 gap-1 text-xs" onClick={() => handleShipmentStatus(shipment.id, 'delivered')}>
                        <CheckCircle className="h-3 w-3" /> Delivered
                      </Button>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (tab === 'bids') {
    return (
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-foreground">My Bids</h3>
        {bids.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Gavel className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No bids placed yet. Check available loads to start bidding!</p>
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-glass-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Route</TableHead>
                  <TableHead className="text-muted-foreground">Amount</TableHead>
                  <TableHead className="text-muted-foreground">Est. Days</TableHead>
                  <TableHead className="text-muted-foreground">Vehicle</TableHead>
                  <TableHead className="text-muted-foreground">Date</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bids.map((bid) => (
                  <TableRow key={bid.id} className="border-glass-border">
                    <TableCell className="font-medium text-foreground">
                      {bid.shipment?.origin} → {bid.shipment?.destination}
                    </TableCell>
                    <TableCell className="text-teal-400 font-medium">₹{bid.bidAmount?.toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground">{bid.estimatedDays || '—'} days</TableCell>
                    <TableCell className="text-muted-foreground capitalize">{bid.vehicleType || '—'}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{new Date(bid.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge className={`${statusColors[bid.status] || ''} border text-xs`}>
                        {bid.status}
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

  if (tab === 'messages') {
    const conversations = myShipments.reduce((acc: any[], shipment) => {
      const order = shipment.order
      const participantId = order?.buyer?.id || order?.seller?.id
      const participantName = order?.buyer?.name || order?.seller?.name || 'Unknown'
      if (participantId && !acc.find(c => c.id === participantId)) {
        acc.push({ id: participantId, name: participantName, lastShipment: `${shipment.origin} → ${shipment.destination}` })
      }
      return acc
    }, [])

    return (
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-foreground">Messages</h3>
        {conversations.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No conversations yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv: any, i: number) => (
              <motion.button
                key={conv.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="w-full glass-card p-4 flex items-center gap-4 hover:border-teal-500/30 transition-colors text-left"
                onClick={() => { setActiveChatUser(conv.id); setChatOpen(true) }}
              >
                <div className="h-10 w-10 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400 font-semibold text-sm">
                  {conv.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{conv.name}</p>
                  <p className="text-xs text-muted-foreground">{conv.lastShipment}</p>
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
      <Truck className="h-12 w-12 text-teal-400 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-foreground mb-2">Profile Settings</h3>
      <p className="text-muted-foreground mb-4">Manage your account details and verification status</p>
      <Button className="bg-teal-600 hover:bg-teal-500 gap-2" onClick={() => useAppStore.getState().setView('profile')}>
        <Truck className="h-4 w-4" /> Go to Profile
      </Button>
    </div>
  )
}
