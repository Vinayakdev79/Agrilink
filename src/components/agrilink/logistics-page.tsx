'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import {
  ArrowLeft,
  ArrowRight,
  Truck,
  MapPin,
  Clock,
  Route,
  Package,
  Gavel,
  Plus,
  CheckCircle2,
  Circle,
  ChevronRight,
  Navigation,
  Phone,
  User,
  IndianRupee,
  CalendarDays,
  Timer,
  TrendingUp,
  Users,
  Map,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'

// ─── Types ────────────────────────────────────────────────────────────────────
interface TransportBid {
  id: string
  shipmentId: string
  transporterId: string
  bidAmount: number
  estimatedDays?: number
  vehicleType?: string
  comments?: string
  status: string
  createdAt: string
  transporter: { id: string; name: string; companyName: string }
}

interface ShipmentOrder {
  id: string
  buyer: { id: string; name: string; companyName: string; phone?: string }
  seller: { id: string; name: string; companyName: string; phone?: string }
  product: { name: string; category: string }
}

interface Shipment {
  id: string
  orderId: string
  transporterId?: string
  origin: string
  destination: string
  distance?: number
  status: string
  pickupDate?: string
  deliveryDate?: string
  actualDelivery?: string
  vehicleType?: string
  vehicleNumber?: string
  driverName?: string
  driverPhone?: string
  createdAt: string
  order: ShipmentOrder
  transporter?: { id: string; name: string; companyName: string; phone?: string }
  transportBids: TransportBid[]
}

interface UserOrder {
  id: string
  status: string
  product: { name: string }
  shipment: { id: string; status: string } | null
}

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_STEPS = ['pending', 'assigned', 'picked_up', 'in_transit', 'delivered'] as const

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  bidding: 'Bidding',
  assigned: 'Assigned',
  picked_up: 'Picked Up',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
  bidding: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  assigned: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  picked_up: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25',
  in_transit: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25',
  delivered: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  cancelled: 'bg-red-500/15 text-red-400 border-red-500/25',
}

const VEHICLE_TYPES = [
  { value: 'truck', label: 'Truck' },
  { value: 'tempo', label: 'Tempo' },
  { value: 'container', label: 'Container' },
  { value: 'tractor_trailer', label: 'Tractor Trailer' },
  { value: 'mini_truck', label: 'Mini Truck' },
]

// ─── Animation Variants ───────────────────────────────────────────────────────
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  },
}

// ─── Status Timeline ──────────────────────────────────────────────────────────
function StatusTimeline({ currentStatus }: { currentStatus: string }) {
  const currentIdx = STATUS_STEPS.indexOf(currentStatus as typeof STATUS_STEPS[number])
  const isActive = (idx: number) => {
    if (currentStatus === 'cancelled') return false
    return idx <= currentIdx
  }
  const isCurrent = (idx: number) => idx === currentIdx && currentStatus !== 'cancelled'

  return (
    <div className="flex items-center gap-0 w-full">
      {STATUS_STEPS.map((step, idx) => (
        <div key={step} className="flex items-center flex-1 last:flex-initial">
          <div className="flex flex-col items-center">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                isActive(idx)
                  ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30'
                  : 'bg-white/10 border border-white/15'
              }`}
            >
              {isActive(idx) ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              ) : (
                <Circle className="w-3 h-3 text-muted-foreground" />
              )}
            </div>
            <span
              className={`text-[10px] mt-1 whitespace-nowrap ${
                isCurrent(idx) ? 'text-emerald-400 font-semibold' : 'text-muted-foreground'
              }`}
            >
              {STATUS_LABELS[step]}
            </span>
          </div>
          {idx < STATUS_STEPS.length - 1 && (
            <div
              className={`flex-1 h-0.5 mx-1 ${
                isActive(idx) && isActive(idx + 1) ? 'bg-emerald-500/60' : 'bg-white/10'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Shipment Card Skeleton ──────────────────────────────────────────────────
function ShipmentCardSkeleton() {
  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32 rounded-lg" />
        <Skeleton className="h-5 w-20 rounded-lg" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-4 w-24 rounded" />
        <Skeleton className="h-4 w-4 rounded" />
        <Skeleton className="h-4 w-24 rounded" />
      </div>
      <Skeleton className="h-8 w-full rounded-lg" />
      <div className="flex gap-2">
        <Skeleton className="h-9 flex-1 rounded-xl" />
      </div>
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: React.ElementType
  value: string
  label: string
  color: 'emerald' | 'amber'
}) {
  const isEmerald = color === 'emerald'
  return (
    <motion.div variants={scaleIn} className="glass-card p-4">
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isEmerald ? 'bg-emerald-500/15' : 'bg-amber-500/15'
          }`}
        >
          <Icon className={`w-5 h-5 ${isEmerald ? 'text-emerald-400' : 'text-amber-400'}`} />
        </div>
        <div>
          <p className="text-xl font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Bid Form Dialog ──────────────────────────────────────────────────────────
function BidFormDialog({
  shipment,
  open,
  onClose,
  onSubmit,
}: {
  shipment: Shipment | null
  open: boolean
  onClose: () => void
  onSubmit: (data: { bidAmount: number; estimatedDays: number; vehicleType: string; comments: string }) => void
}) {
  const [bidAmount, setBidAmount] = useState('')
  const [estimatedDays, setEstimatedDays] = useState('')
  const [vehicleType, setVehicleType] = useState('')
  const [comments, setComments] = useState('')

  if (!shipment) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-card-strong border-white/15 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
            <Gavel className="w-5 h-5 text-amber-400" />
            Place Bid
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {shipment.origin} → {shipment.destination}
            {shipment.distance ? ` • ${shipment.distance} km` : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="glass-card p-3">
            <p className="text-xs text-muted-foreground">Product</p>
            <p className="text-sm font-semibold text-foreground">{shipment.order.product.name}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Buyer: {shipment.order.buyer.companyName || shipment.order.buyer.name}
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Bid Amount (₹)</Label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="number"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder="Enter bid amount"
                className="pl-9 h-10 bg-white/5 border-white/10 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Est. Delivery (Days)</Label>
              <Input
                type="number"
                value={estimatedDays}
                onChange={(e) => setEstimatedDays(e.target.value)}
                placeholder="Days"
                className="h-10 bg-white/5 border-white/10 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Vehicle Type</Label>
              <Select value={vehicleType} onValueChange={setVehicleType}>
                <SelectTrigger className="h-10 text-xs bg-white/5 border-white/10">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-white/10">
                  {VEHICLE_TYPES.map((v) => (
                    <SelectItem key={v.value} value={v.value} className="text-xs">
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Comments</Label>
            <Textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Additional details about your bid..."
              className="bg-white/5 border-white/10 text-sm min-h-[60px] resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 mt-2">
          <Button variant="outline" onClick={onClose} className="border-white/10 hover:bg-white/5">
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (!bidAmount || parseFloat(bidAmount) <= 0) {
                toast.error('Please enter a valid bid amount')
                return
              }
              onSubmit({
                bidAmount: parseFloat(bidAmount),
                estimatedDays: estimatedDays ? parseInt(estimatedDays) : 3,
                vehicleType,
                comments,
              })
            }}
            className="bg-amber-500 hover:bg-amber-400 text-white shadow-lg shadow-amber-500/20"
          >
            <Gavel className="w-4 h-4 mr-2" />
            Submit Bid
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Create Shipment Dialog ──────────────────────────────────────────────────
function CreateShipmentDialog({
  orders,
  open,
  onClose,
  onSubmit,
}: {
  orders: UserOrder[]
  open: boolean
  onClose: () => void
  onSubmit: (data: { orderId: string; origin: string; destination: string; distance: string }) => void
}) {
  const [orderId, setOrderId] = useState('')
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [distance, setDistance] = useState('')

  // Only show orders without shipments
  const eligibleOrders = orders.filter((o) => !o.shipment && o.status !== 'cancelled')

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-card-strong border-white/15 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-400" />
            Create Shipment Request
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Request logistics for your confirmed order
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Select Order</Label>
            <Select value={orderId} onValueChange={setOrderId}>
              <SelectTrigger className="h-10 text-xs bg-white/5 border-white/10">
                <SelectValue placeholder="Choose an order" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-white/10">
                {eligibleOrders.length === 0 ? (
                  <SelectItem value="_none" disabled className="text-xs">
                    No eligible orders
                  </SelectItem>
                ) : (
                  eligibleOrders.map((o) => (
                    <SelectItem key={o.id} value={o.id} className="text-xs">
                      {o.product.name} ({o.status})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Origin</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
              <Input
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="Pickup location"
                className="pl-9 h-10 bg-white/5 border-white/10 text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Destination</Label>
            <div className="relative">
              <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
              <Input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Delivery location"
                className="pl-9 h-10 bg-white/5 border-white/10 text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Distance (km)</Label>
            <Input
              type="number"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              placeholder="Approximate distance"
              className="h-10 bg-white/5 border-white/10 text-sm"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 mt-2">
          <Button variant="outline" onClick={onClose} className="border-white/10 hover:bg-white/5">
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (!orderId || !origin || !destination) {
                toast.error('Please fill in all required fields')
                return
              }
              onSubmit({ orderId, origin, destination, distance })
            }}
            className="bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Shipment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Available Load Card ──────────────────────────────────────────────────────
function AvailableLoadCard({
  shipment,
  onBid,
}: {
  shipment: Shipment
  onBid: (s: Shipment) => void
}) {
  const statusColor = STATUS_COLORS[shipment.status] || 'bg-gray-500/15 text-gray-400 border-gray-500/25'
  const lowestBid = shipment.transportBids.length > 0
    ? Math.min(...shipment.transportBids.map((b) => b.bidAmount))
    : null

  return (
    <motion.div variants={fadeUp} className="glass-card p-5 hover:bg-white/[0.07] transition-all duration-300">
      {/* Route header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium text-foreground truncate">{shipment.origin}</span>
        </div>
        <div className="shrink-0">
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
          <span className="text-sm font-medium text-foreground truncate">{shipment.destination}</span>
          <Navigation className="w-4 h-4 text-amber-400 shrink-0" />
        </div>
      </div>

      {/* Details */}
      <div className="flex flex-wrap gap-3 mb-3">
        {shipment.distance && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Route className="w-3.5 h-3.5" />
            <span>{shipment.distance} km</span>
          </div>
        )}
        {shipment.vehicleType && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Truck className="w-3.5 h-3.5" />
            <span>{shipment.vehicleType}</span>
          </div>
        )}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <CalendarDays className="w-3.5 h-3.5" />
          <span>{new Date(shipment.createdAt).toLocaleDateString('en-IN')}</span>
        </div>
      </div>

      {/* Product info */}
      <div className="glass-card p-3 mb-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Product</p>
            <p className="text-sm font-semibold text-foreground">{shipment.order.product.name}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Buyer</p>
            <p className="text-sm font-medium text-foreground">
              {shipment.order.buyer.companyName || shipment.order.buyer.name}
            </p>
          </div>
        </div>
      </div>

      {/* Bid info */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">{shipment.transportBids.length}</p>
            <p className="text-[10px] text-muted-foreground">Bids</p>
          </div>
          {lowestBid !== null && (
            <div className="text-center">
              <p className="text-lg font-bold text-emerald-400">₹{lowestBid.toLocaleString('en-IN')}</p>
              <p className="text-[10px] text-muted-foreground">Lowest Bid</p>
            </div>
          )}
        </div>
        <Badge className={`${statusColor} border text-xs`}>
          {STATUS_LABELS[shipment.status] || shipment.status}
        </Badge>
      </div>

      {/* Bid button */}
      <Button
        className="w-full bg-amber-500/15 border border-amber-500/25 text-amber-400 hover:bg-amber-500/25 transition-all"
        onClick={() => onBid(shipment)}
      >
        <Gavel className="w-4 h-4 mr-2" />
        Place Bid
      </Button>
    </motion.div>
  )
}

// ─── My Shipment Card ─────────────────────────────────────────────────────────
function MyShipmentCard({
  shipment,
  onUpdateStatus,
}: {
  shipment: Shipment
  onUpdateStatus: (shipmentId: string, status: string) => void
}) {
  const statusColor = STATUS_COLORS[shipment.status] || 'bg-gray-500/15 text-gray-400 border-gray-500/25'

  const getNextStatus = (current: string): string | null => {
    const idx = STATUS_STEPS.indexOf(current as typeof STATUS_STEPS[number])
    if (idx >= 0 && idx < STATUS_STEPS.length - 1) return STATUS_STEPS[idx + 1]
    return null
  }

  const nextStatus = getNextStatus(shipment.status)

  return (
    <motion.div variants={fadeUp} className="glass-card p-5 hover:bg-white/[0.07] transition-all duration-300">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium text-foreground">{shipment.origin}</span>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">{shipment.destination}</span>
            <Navigation className="w-3.5 h-3.5 text-amber-400" />
          </div>
          {shipment.distance && (
            <p className="text-xs text-muted-foreground ml-6">{shipment.distance} km</p>
          )}
        </div>
        <Badge className={`${statusColor} border text-xs`}>
          {STATUS_LABELS[shipment.status] || shipment.status}
        </Badge>
      </div>

      {/* Status Timeline */}
      {shipment.status !== 'cancelled' && (
        <div className="mb-4 py-3">
          <StatusTimeline currentStatus={shipment.status} />
        </div>
      )}

      {/* Order details */}
      <div className="glass-card p-3 mb-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] text-muted-foreground">Product</p>
            <p className="text-xs font-semibold text-foreground">{shipment.order.product.name}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Buyer</p>
            <p className="text-xs font-semibold text-foreground">
              {shipment.order.buyer.companyName || shipment.order.buyer.name}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Seller</p>
            <p className="text-xs font-semibold text-foreground">
              {shipment.order.seller.companyName || shipment.order.seller.name}
            </p>
          </div>
          {shipment.distance && (
            <div>
              <p className="text-[10px] text-muted-foreground">Distance</p>
              <p className="text-xs font-semibold text-foreground">{shipment.distance} km</p>
            </div>
          )}
        </div>
      </div>

      {/* Vehicle & Driver info */}
      {(shipment.vehicleType || shipment.driverName) && (
        <div className="glass-card p-3 mb-3">
          <div className="grid grid-cols-2 gap-3">
            {shipment.vehicleType && (
              <div>
                <p className="text-[10px] text-muted-foreground">Vehicle</p>
                <p className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <Truck className="w-3 h-3 text-emerald-400" />
                  {shipment.vehicleType}
                  {shipment.vehicleNumber && ` (${shipment.vehicleNumber})`}
                </p>
              </div>
            )}
            {shipment.driverName && (
              <div>
                <p className="text-[10px] text-muted-foreground">Driver</p>
                <p className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <User className="w-3 h-3 text-emerald-400" />
                  {shipment.driverName}
                </p>
                {shipment.driverPhone && (
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Phone className="w-2.5 h-2.5" />
                    {shipment.driverPhone}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bids preview */}
      {shipment.transportBids.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] text-muted-foreground mb-1.5">
            Bids ({shipment.transportBids.length})
          </p>
          <div className="space-y-1 max-h-24 overflow-y-auto custom-scrollbar">
            {shipment.transportBids.slice(0, 3).map((bid) => (
              <div key={bid.id} className="flex items-center justify-between py-1 px-2 rounded-lg bg-white/3">
                <span className="text-[10px] text-muted-foreground">
                  {bid.transporter.companyName || bid.transporter.name}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-foreground">
                    ₹{bid.bidAmount.toLocaleString('en-IN')}
                  </span>
                  <Badge
                    className={`text-[8px] px-1.5 py-0 ${
                      bid.status === 'accepted'
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : bid.status === 'rejected'
                        ? 'bg-red-500/15 text-red-400'
                        : 'bg-yellow-500/15 text-yellow-400'
                    }`}
                  >
                    {bid.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Update status button */}
      {nextStatus && (
        <Button
          className="w-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/25 transition-all text-xs"
          onClick={() => onUpdateStatus(shipment.id, nextStatus)}
        >
          <ChevronRight className="w-3.5 h-3.5 mr-1.5" />
          Update to {STATUS_LABELS[nextStatus]}
        </Button>
      )}
    </motion.div>
  )
}

// ─── Main Logistics Page ──────────────────────────────────────────────────────
export function LogisticsPage() {
  const { setView, user } = useAppStore()

  const [pendingShipments, setPendingShipments] = useState<Shipment[]>([])
  const [myShipments, setMyShipments] = useState<Shipment[]>([])
  const [userOrders, setUserOrders] = useState<UserOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('available')

  const [bidShipment, setBidShipment] = useState<Shipment | null>(null)
  const [bidOpen, setBidOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [createDialogKey, setCreateDialogKey] = useState(0)

  const isTransporter = user?.role === 'transporter'
  const isBuyer = user?.role === 'buyer'

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch shipments
      const shipRes = await fetch('/api/shipments')
      const shipData = await shipRes.json()

      setPendingShipments(shipData.pendingShipments || [])
      setMyShipments(shipData.shipments || [])

      // Fetch user's orders for create shipment dialog
      if (user && isBuyer) {
        const orderRes = await fetch(`/api/orders?userId=${user.id}&role=buyer`)
        const orderData = await orderRes.json()
        setUserOrders(orderData.orders || [])
      }
    } catch {
      toast.error('Failed to load logistics data')
    } finally {
      setLoading(false)
    }
  }, [user, isBuyer])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Place bid
  const handlePlaceBid = async (data: {
    bidAmount: number
    estimatedDays: number
    vehicleType: string
    comments: string
  }) => {
    if (!user) {
      toast.error('Please sign in to place a bid')
      setView('auth')
      return
    }
    if (!bidShipment) return

    try {
      const res = await fetch('/api/transport-bids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipmentId: bidShipment.id,
          transporterId: user.id,
          ...data,
        }),
      })
      const result = await res.json()
      if (res.ok) {
        toast.success('Bid placed successfully!')
        setBidOpen(false)
        fetchData()
      } else {
        toast.error(result.error || 'Failed to place bid')
      }
    } catch {
      toast.error('Failed to place bid')
    }
  }

  // Create shipment
  const handleCreateShipment = async (data: {
    orderId: string
    origin: string
    destination: string
    distance: string
  }) => {
    try {
      const res = await fetch('/api/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (res.ok) {
        toast.success('Shipment request created!')
        setCreateOpen(false)
        fetchData()
      } else {
        toast.error(result.error || 'Failed to create shipment')
      }
    } catch {
      toast.error('Failed to create shipment')
    }
  }

  // Update shipment status
  const handleUpdateStatus = async (shipmentId: string, status: string) => {
    try {
      const res = await fetch('/api/shipments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipmentId, status }),
      })
      const result = await res.json()
      if (res.ok) {
        toast.success(`Shipment status updated to ${STATUS_LABELS[status]}`)
        fetchData()
      } else {
        toast.error(result.error || 'Failed to update status')
      }
    } catch {
      toast.error('Failed to update status')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-emerald-500/4 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="sticky top-0 z-40 glass-card-strong mx-4 sm:mx-6 mt-4 px-4 sm:px-6 py-3 flex items-center gap-4"
        >
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground shrink-0"
            onClick={() => setView('dashboard')}
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            <span className="hidden sm:inline">Back</span>
          </Button>

          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">Logistics Marketplace</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Find transporters or bid on shipments
            </p>
          </div>

          {isBuyer && (
            <Button
              size="sm"
              className="h-9 bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20"
              onClick={() => { setCreateOpen(true); setCreateDialogKey((k) => k + 1) }}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline">New Shipment</span>
              <span className="sm:hidden">New</span>
            </Button>
          )}
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="px-4 sm:px-6 mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3"
        >
          <StatCard icon={Timer} value="2.4 Days" label="Avg. Delivery Time" color="emerald" />
          <StatCard icon={Users} value="3,200+" label="Active Transporters" color="amber" />
          <StatCard icon={Map} value="840+" label="Routes Covered" color="emerald" />
          <StatCard icon={TrendingUp} value="96.8%" label="On-Time Delivery" color="amber" />
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="px-4 sm:px-6 mt-6"
        >
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-white/5 border border-white/10 p-1">
              <TabsTrigger
                value="available"
                className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white text-xs px-4"
              >
                <Package className="w-3.5 h-3.5 mr-1.5" />
                Available Loads
                {pendingShipments.length > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold">
                    {pendingShipments.length}
                  </span>
                )}
              </TabsTrigger>
              {(isTransporter || myShipments.length > 0) && (
                <TabsTrigger
                  value="my-shipments"
                  className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white text-xs px-4"
                >
                  <Truck className="w-3.5 h-3.5 mr-1.5" />
                  My Shipments
                  {myShipments.length > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                      {myShipments.length}
                    </span>
                  )}
                </TabsTrigger>
              )}
            </TabsList>

            {/* Available Loads Tab */}
            <TabsContent value="available" className="mt-6">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <ShipmentCardSkeleton key={i} />
                  ))}
                </div>
              ) : pendingShipments.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-12 text-center"
                >
                  <Truck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Available Loads</h3>
                  <p className="text-sm text-muted-foreground">
                    There are no pending shipments to bid on right now. Check back later.
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                  {pendingShipments.map((shipment) => (
                    <AvailableLoadCard
                      key={shipment.id}
                      shipment={shipment}
                      onBid={(s) => {
                        setBidShipment(s)
                        setBidOpen(true)
                      }}
                    />
                  ))}
                </motion.div>
              )}
            </TabsContent>

            {/* My Shipments Tab */}
            <TabsContent value="my-shipments" className="mt-6">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <ShipmentCardSkeleton key={i} />
                  ))}
                </div>
              ) : myShipments.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-12 text-center"
                >
                  <Route className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Shipments Yet</h3>
                  <p className="text-sm text-muted-foreground">
                    {isTransporter
                      ? 'Start bidding on available loads to see your shipments here.'
                      : 'Your shipment tracking will appear here once orders are assigned to transporters.'}
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  {myShipments.map((shipment) => (
                    <MyShipmentCard
                      key={shipment.id}
                      shipment={shipment}
                      onUpdateStatus={handleUpdateStatus}
                    />
                  ))}
                </motion.div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Bottom spacing */}
        <div className="h-16" />
      </div>

      {/* Bid Form Dialog */}
      <BidFormDialog
        key={bidShipment?.id || 'none'}
        shipment={bidShipment}
        open={bidOpen}
        onClose={() => setBidOpen(false)}
        onSubmit={handlePlaceBid}
      />

      {/* Create Shipment Dialog */}
      <CreateShipmentDialog
        key={createDialogKey}
        orders={userOrders}
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreateShipment}
      />
    </div>
  )
}
