'use client'

import { useAppStore } from '@/lib/store'
import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Truck, Package, IndianRupee, Star, MapPin, Clock, Gavel,
  TrendingUp, TrendingDown, CheckCircle, Navigation, MessageSquare,
  Crosshair, CalendarDays, Route as RouteIcon, AlertTriangle,
  Phone, User as UserIcon, ClipboardList, ChevronDown, ChevronUp,
  ShieldCheck, ShieldAlert, Timer, Zap
} from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
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
import { ShipmentTracker, MiniMapPreview } from '@/components/agrilink/shipment-tracker'

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

// ─── Performance Stats Interface ──────────────────────────────────────────────
interface PerformanceStats {
  pickupSuccessRate: number
  deliverySuccessRate: number
  avgResponseTimeHours: number
  warningCount: number
  totalCompletedShipments: number
  totalFailedShipments: number
}

// ─── Helper: Calculate time remaining until deadline ─────────────────────────
function getTimeRemaining(deadline: string | null | undefined): {
  ms: number
  hours: number
  minutes: number
  expired: boolean
  label: string
} {
  if (!deadline) return { ms: 0, hours: 0, minutes: 0, expired: false, label: 'No deadline' }
  const now = new Date().getTime()
  const deadlineMs = new Date(deadline).getTime()
  const diff = deadlineMs - now
  if (diff <= 0) {
    const overdueH = Math.abs(Math.floor(diff / (1000 * 60 * 60)))
    return { ms: diff, hours: 0, minutes: 0, expired: true, label: `Overdue by ${overdueH}h` }
  }
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return { ms: diff, hours, minutes, expired: false, label: `${hours}h ${minutes}m left` }
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

// ─── Animated Performance Stat Card ───────────────────────────────────────────
function PerfStatCard({ icon, value, label, suffix, color }: {
  icon: React.ReactNode; value: number | string; label: string; suffix?: string;
  color?: string
}) {
  const displayValue = typeof value === 'number' ? value.toFixed(suffix === '%' ? 1 : 0) : value
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className="glass-card p-4 flex flex-col items-center gap-2 text-center"
    >
      <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${color || 'bg-teal-500/15 text-teal-400'}`}>
        {icon}
      </div>
      <motion.p
        className="text-xl font-bold text-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {displayValue}{suffix || ''}
      </motion.p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </motion.div>
  )
}

// ─── Circular Progress for Rate Stats ─────────────────────────────────────────
function CircularProgress({ value, size = 56, strokeWidth = 4, color }: {
  value: number; size?: number; strokeWidth?: number; color: string
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={strokeWidth} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        strokeLinecap="round"
      />
    </svg>
  )
}

// SVG Mini-Map for available loads
function LoadMiniMap({ shipment }: { shipment: any }) {
  const pLat = shipment.pickupLatitude ? parseFloat(shipment.pickupLatitude) : null
  const pLng = shipment.pickupLongitude ? parseFloat(shipment.pickupLongitude) : null
  const dLat = shipment.dropLatitude ? parseFloat(shipment.dropLatitude) : null
  const dLng = shipment.dropLongitude ? parseFloat(shipment.dropLongitude) : null

  if (!pLat || !pLng || !dLat || !dLng) {
    return (
      <svg viewBox="0 0 100 30" className="w-full h-8 mt-2" style={{ background: 'rgba(10,15,25,0.5)' }}>
        <line x1="10" y1="15" x2="90" y2="15" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="3 2" />
        <circle cx="10" cy="15" r="4" fill="#10b981" opacity="0.8" />
        <circle cx="10" cy="15" r="1.5" fill="#10b981" />
        <circle cx="90" cy="15" r="4" fill="#ef4444" opacity="0.8" />
        <circle cx="90" cy="15" r="1.5" fill="#ef4444" />
      </svg>
    )
  }

  return <MiniMapPreview pickupLat={String(pLat)} pickupLng={String(pLng)} dropLat={String(dLat)} dropLng={String(dLng)} />
}

// ─── Deadline Badge Component ─────────────────────────────────────────────────
function DeadlineBadge({ pickupDeadline, assignedAt }: {
  pickupDeadline: string | null | undefined; assignedAt: string | null | undefined
}) {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000) // update every minute
    return () => clearInterval(timer)
  }, [])

  // Use pickupDeadline if available, otherwise fallback to assignedAt + 24h
  const deadline = pickupDeadline || (assignedAt ? new Date(new Date(assignedAt).getTime() + 24 * 60 * 60 * 1000).toISOString() : null)
  const remaining = getTimeRemaining(deadline)

  // Force re-render using now
  void now

  if (!deadline) return null

  if (remaining.expired) {
    return (
      <motion.div
        animate={{ opacity: [1, 0.5, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-500/20 border border-red-500/30"
      >
        <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
        <span className="text-xs font-semibold text-red-400">Pickup deadline exceeded!</span>
      </motion.div>
    )
  }

  const isUrgent = remaining.hours < 4
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${
      isUrgent
        ? 'bg-amber-500/20 border-amber-500/30'
        : 'bg-teal-500/15 border-teal-500/25'
    }`}>
      <Timer className={`h-3.5 w-3.5 ${isUrgent ? 'text-amber-400' : 'text-teal-400'}`} />
      <span className={`text-xs font-medium ${isUrgent ? 'text-amber-400' : 'text-teal-400'}`}>
        {remaining.label}
      </span>
    </div>
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

  // Tracking state
  const [trackingShipment, setTrackingShipment] = useState<any>(null)
  const [trackerOpen, setTrackerOpen] = useState(false)

  // Pickup date state
  const [pickupDateDialogOpen, setPickupDateDialogOpen] = useState(false)
  const [pickupDateShipmentId, setPickupDateShipmentId] = useState<string>('')
  const [pickupDateValue, setPickupDateValue] = useState<Date | undefined>(undefined)

  // Performance stats state
  const [perfStats, setPerfStats] = useState<PerformanceStats | null>(null)
  const [perfLoading, setPerfLoading] = useState(false)

  // Shipment details expansion state
  const [expandedShipmentId, setExpandedShipmentId] = useState<string | null>(null)

  // Shipment instructions state
  const [shipmentInstructions, setShipmentInstructions] = useState<Record<string, string>>({})

  const fetchPerformanceStats = useCallback(async () => {
    if (!user) return
    setPerfLoading(true)
    try {
      const res = await fetch(`/api/users?id=${user.id}`)
      if (res.ok) {
        const data = await res.json()
        const u = data.user
        setPerfStats({
          pickupSuccessRate: u.pickupSuccessRate ?? 100,
          deliverySuccessRate: u.deliverySuccessRate ?? 100,
          avgResponseTimeHours: u.avgResponseTimeHours ?? 0,
          warningCount: u.warningCount ?? 0,
          totalCompletedShipments: u.totalCompletedShipments ?? 0,
          totalFailedShipments: u.totalFailedShipments ?? 0,
        })
      }
    } catch {
      // Silently fail - perf stats are not critical
    } finally {
      setPerfLoading(false)
    }
  }, [user])

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

  useEffect(() => {
    fetchPerformanceStats()
  }, [fetchPerformanceStats])

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

  const handleShipmentStatus = async (shipmentId: string, status: string, extraData?: Record<string, unknown>) => {
    try {
      const body: Record<string, unknown> = { shipmentId, status }
      if (extraData) Object.assign(body, extraData)
      const res = await fetch('/api/shipments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (res.ok) {
        toast.success(`Shipment status updated to ${status.replace('_', ' ')}`)
        fetchData()
        fetchPerformanceStats()
      } else {
        toast.error('Failed to update shipment')
      }
    } catch {
      toast.error('Failed to update shipment')
    }
  }

  const handleSetPickupDate = async () => {
    if (!pickupDateValue) {
      toast.error('Please select a pickup date')
      return
    }
    const dateStr = pickupDateValue.toISOString().split('T')[0]
    await handleShipmentStatus(pickupDateShipmentId, 'assigned', { expectedPickupDate: dateStr })
    setPickupDateDialogOpen(false)
    setPickupDateValue(undefined)
    setPickupDateShipmentId('')
  }

  const handleTrackShipment = (shipment: any) => {
    setTrackingShipment(shipment)
    setTrackerOpen(true)
  }

  const handleChatWithProducer = (sellerId: string | null | undefined) => {
    if (sellerId) {
      setActiveChatUser(sellerId)
      setChatOpen(true)
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

  // ─── OVERVIEW TAB ───────────────────────────────────────────────────────────
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

        {/* ─── Performance Stats Section ────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="h-9 w-9 rounded-lg bg-teal-500/15 flex items-center justify-center">
              <Zap className="h-5 w-5 text-teal-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Performance Stats</h3>
              <p className="text-xs text-muted-foreground">Your transport performance metrics</p>
            </div>
          </div>

          {perfLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
            </div>
          ) : perfStats ? (
            <>
              {/* Rate stats with circular progress */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {/* Pickup Success Rate */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="glass-card p-4 flex items-center gap-4"
                >
                  <div className="relative flex items-center justify-center">
                    <CircularProgress value={perfStats.pickupSuccessRate} color={perfStats.pickupSuccessRate >= 90 ? '#14b8a6' : perfStats.pickupSuccessRate >= 70 ? '#f59e0b' : '#ef4444'} />
                    <span className="absolute text-xs font-bold text-foreground">
                      {perfStats.pickupSuccessRate.toFixed(0)}%
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Pickup Success Rate</p>
                    <p className="text-xs text-muted-foreground">Within 24hrs deadline</p>
                    <Badge className={`mt-1 border text-[10px] ${
                      perfStats.pickupSuccessRate >= 90
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
                        : perfStats.pickupSuccessRate >= 70
                        ? 'bg-amber-500/15 text-amber-400 border-amber-500/25'
                        : 'bg-red-500/15 text-red-400 border-red-500/25'
                    }`}>
                      {perfStats.pickupSuccessRate >= 90 ? 'Excellent' : perfStats.pickupSuccessRate >= 70 ? 'Fair' : 'Needs Improvement'}
                    </Badge>
                  </div>
                </motion.div>

                {/* Delivery Success Rate */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="glass-card p-4 flex items-center gap-4"
                >
                  <div className="relative flex items-center justify-center">
                    <CircularProgress value={perfStats.deliverySuccessRate} color={perfStats.deliverySuccessRate >= 90 ? '#14b8a6' : perfStats.deliverySuccessRate >= 70 ? '#f59e0b' : '#ef4444'} />
                    <span className="absolute text-xs font-bold text-foreground">
                      {perfStats.deliverySuccessRate.toFixed(0)}%
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Delivery Success Rate</p>
                    <p className="text-xs text-muted-foreground">Successful deliveries</p>
                    <Badge className={`mt-1 border text-[10px] ${
                      perfStats.deliverySuccessRate >= 90
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
                        : perfStats.deliverySuccessRate >= 70
                        ? 'bg-amber-500/15 text-amber-400 border-amber-500/25'
                        : 'bg-red-500/15 text-red-400 border-red-500/25'
                    }`}>
                      {perfStats.deliverySuccessRate >= 90 ? 'Excellent' : perfStats.deliverySuccessRate >= 70 ? 'Fair' : 'Needs Improvement'}
                    </Badge>
                  </div>
                </motion.div>

                {/* Average Response Time */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="glass-card p-4 flex items-center gap-4"
                >
                  <div className="relative flex items-center justify-center">
                    <CircularProgress
                      value={Math.max(0, 100 - (perfStats.avgResponseTimeHours / 24) * 100)}
                      color={perfStats.avgResponseTimeHours <= 6 ? '#14b8a6' : perfStats.avgResponseTimeHours <= 12 ? '#f59e0b' : '#ef4444'}
                    />
                    <span className="absolute text-[10px] font-bold text-foreground">
                      {perfStats.avgResponseTimeHours.toFixed(1)}h
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Avg Response Time</p>
                    <p className="text-xs text-muted-foreground">Assignment to pickup</p>
                    <Badge className={`mt-1 border text-[10px] ${
                      perfStats.avgResponseTimeHours <= 6
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
                        : perfStats.avgResponseTimeHours <= 12
                        ? 'bg-amber-500/15 text-amber-400 border-amber-500/25'
                        : 'bg-red-500/15 text-red-400 border-red-500/25'
                    }`}>
                      {perfStats.avgResponseTimeHours <= 6 ? 'Fast' : perfStats.avgResponseTimeHours <= 12 ? 'Average' : 'Slow'}
                    </Badge>
                  </div>
                </motion.div>
              </div>

              {/* Compact stat cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <PerfStatCard
                  icon={<AlertTriangle className="h-4 w-4" />}
                  value={perfStats.warningCount}
                  label="Warnings"
                  color={perfStats.warningCount > 0 ? 'bg-amber-500/15 text-amber-400' : 'bg-emerald-500/15 text-emerald-400'}
                />
                <PerfStatCard
                  icon={<ShieldCheck className="h-4 w-4" />}
                  value={perfStats.totalCompletedShipments}
                  label="Completed Shipments"
                  color="bg-teal-500/15 text-teal-400"
                />
                <PerfStatCard
                  icon={<ShieldAlert className="h-4 w-4" />}
                  value={perfStats.totalFailedShipments}
                  label="Failed Shipments"
                  color={perfStats.totalFailedShipments > 0 ? 'bg-red-500/15 text-red-400' : 'bg-emerald-500/15 text-emerald-400'}
                />
              </div>
            </>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-4">Unable to load performance stats</p>
          )}
        </motion.div>

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

  // ─── LOADS TAB ──────────────────────────────────────────────────────────────
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
          <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-2xl" />)}</div>
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

                {/* Producer Info */}
                {shipment.order?.seller && (
                  <div className="glass-card p-3 border-l-2 border-teal-500/40">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400 font-semibold text-xs shrink-0">
                        {(shipment.order.seller.name || 'P').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {shipment.order.seller.companyName || shipment.order.seller.name}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {shipment.order.seller.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3 text-teal-400" />
                              {shipment.order.seller.phone}
                            </span>
                          )}
                          {shipment.order.seller.city && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-teal-400" />
                              {shipment.order.seller.city}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Exact pickup and drop addresses */}
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin className="w-3 h-3 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{shipment.exactPickupAddress || shipment.origin}</p>
                      {shipment.pickupLatitude && shipment.pickupLongitude && (
                        <p className="text-[10px] text-muted-foreground">
                          {parseFloat(shipment.pickupLatitude).toFixed(4)}, {parseFloat(shipment.pickupLongitude).toFixed(4)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Navigation className="w-3 h-3 text-red-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{shipment.exactDropAddress || shipment.destination}</p>
                      {shipment.dropLatitude && shipment.dropLongitude && (
                        <p className="text-[10px] text-muted-foreground">
                          {parseFloat(shipment.dropLatitude).toFixed(4)}, {parseFloat(shipment.dropLongitude).toFixed(4)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Mini Map Preview */}
                <LoadMiniMap shipment={shipment} />

                {/* Product & order details */}
                <div className="glass-card p-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Distance</p>
                      <p className="text-foreground">{shipment.distance || '—'} km</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Product</p>
                      <p className="text-foreground text-xs">{shipment.order?.product?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Quantity</p>
                      <p className="text-foreground text-xs">
                        {shipment.order?.product?.quantity ? `${shipment.order.product.quantity} ${shipment.order.product.unit || ''}` : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Bids</p>
                      <p className="text-amber-400 font-medium">{shipment.transportBids?.length || 0} bids</p>
                    </div>
                  </div>
                  {shipment.expectedPickupDate && (
                    <div className="mt-2 pt-2 border-t border-glass-border">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <CalendarDays className="h-3 w-3 text-amber-400" />
                        Expected pickup: {new Date(shipment.expectedPickupDate).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-glass-border flex gap-2">
                  <Button
                    className="bg-teal-600 hover:bg-teal-500 gap-2 flex-1"
                    onClick={() => {
                      setBidForm(prev => ({ ...prev, shipmentId: shipment.id }))
                      setBidDialogOpen(true)
                    }}
                  >
                    <Gavel className="h-4 w-4" /> Place Bid
                  </Button>
                  {shipment.order?.seller?.id && (
                    <Button
                      variant="outline"
                      className="border-teal-500/30 text-teal-400 hover:text-teal-300 hover:bg-teal-500/10 gap-1"
                      onClick={() => handleChatWithProducer(shipment.order.seller.id)}
                    >
                      <MessageSquare className="h-4 w-4" /> Chat
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Bid Dialog */}
        <Dialog open={bidDialogOpen} onOpenChange={setBidDialogOpen}>
          <DialogContent className="bg-[oklch(0.15_0.012_260/0.95)] border-white/20 backdrop-blur-xl">
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
                      <SelectItem value="tractor_trailer">Tractor Trailer</SelectItem>
                      <SelectItem value="mini_truck">Mini Truck</SelectItem>
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

  // ─── SHIPMENTS TAB ──────────────────────────────────────────────────────────
  if (tab === 'shipments') {
    return (
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-foreground">My Shipments</h3>
        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-2xl" />)}</div>
        ) : myShipments.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No shipments assigned yet. Place bids on available loads!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {myShipments.map((shipment, i) => {
              const isExpanded = expandedShipmentId === shipment.id
              const seller = shipment.order?.seller
              const deadline = shipment.pickupDeadline || (shipment.assignedAt ? new Date(new Date(shipment.assignedAt).getTime() + 24 * 60 * 60 * 1000).toISOString() : null)
              const remaining = getTimeRemaining(deadline)

              return (
                <motion.div
                  key={shipment.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`glass-card p-5 space-y-3 ${
                    remaining.expired && ['assigned', 'pending'].includes(shipment.status)
                      ? 'border-red-500/30'
                      : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-foreground">
                        {shipment.order?.product?.name || 'Shipment'}
                      </h4>
                      <p className="text-xs text-muted-foreground">ID: {shipment.id.slice(-8)}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      <Badge className={`${statusColors[shipment.status] || ''} border text-xs`}>
                        {shipment.status.replace('_', ' ')}
                      </Badge>
                      {/* Deadline Warning Badge */}
                      <DeadlineBadge pickupDeadline={shipment.pickupDeadline} assignedAt={shipment.assignedAt} />
                      {['picked_up', 'in_transit'].includes(shipment.status) && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-cyan-500/30 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 gap-1 text-xs h-7"
                          onClick={() => handleTrackShipment(shipment)}
                        >
                          <Crosshair className="h-3 w-3" /> Track
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* ─── Producer Information Card ──────────────────────────────── */}
                  {seller && (
                    <div className="glass-card p-3 border-l-2 border-teal-500/40">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400 font-semibold text-sm shrink-0">
                          {(seller.name || 'P').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {seller.companyName || seller.name}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                            {seller.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3 text-teal-400" />
                                {seller.phone}
                              </span>
                            )}
                            {seller.city && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-teal-400" />
                                {seller.city}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-teal-500/30 text-teal-400 hover:text-teal-300 hover:bg-teal-500/10 gap-1 text-xs shrink-0"
                          onClick={() => handleChatWithProducer(seller.id)}
                        >
                          <MessageSquare className="h-3 w-3" /> Chat with Producer
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Exact addresses */}
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <MapPin className="w-3 h-3 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{shipment.exactPickupAddress || shipment.origin}</p>
                        {shipment.pickupLatitude && shipment.pickupLongitude && (
                          <p className="text-[10px] text-muted-foreground">
                            {parseFloat(shipment.pickupLatitude).toFixed(4)}, {parseFloat(shipment.pickupLongitude).toFixed(4)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <Navigation className="w-3 h-3 text-red-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{shipment.exactDropAddress || shipment.destination}</p>
                        {shipment.dropLatitude && shipment.dropLongitude && (
                          <p className="text-[10px] text-muted-foreground">
                            {parseFloat(shipment.dropLatitude).toFixed(4)}, {parseFloat(shipment.dropLongitude).toFixed(4)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Mini Map */}
                  <LoadMiniMap shipment={shipment} />

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

                  {/* Assignment & Deadline Info */}
                  {shipment.assignedAt && (
                    <div className="glass-card p-3 border-l-2 border-amber-500/40">
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-muted-foreground">Assigned At</p>
                          <p className="text-foreground font-medium">
                            {new Date(shipment.assignedAt).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Pickup Deadline</p>
                          <p className={`font-medium ${remaining.expired ? 'text-red-400' : 'text-amber-400'}`}>
                            {shipment.pickupDeadline
                              ? new Date(shipment.pickupDeadline).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                              : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Expected Pickup Date - set by transporter */}
                  {shipment.status === 'assigned' && !shipment.expectedPickupDate && (
                    <div className="pt-2 border-t border-glass-border">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-amber-500/30 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 gap-1 text-xs w-full"
                        onClick={() => {
                          setPickupDateShipmentId(shipment.id)
                          setPickupDateValue(undefined)
                          setPickupDateDialogOpen(true)
                        }}
                      >
                        <CalendarDays className="h-3 w-3" /> Set Expected Pickup Date
                      </Button>
                    </div>
                  )}
                  {shipment.expectedPickupDate && (
                    <div className="pt-2 border-t border-glass-border">
                      <div className="flex items-center gap-2 text-xs">
                        <CalendarDays className="h-3 w-3 text-amber-400" />
                        <span className="text-muted-foreground">Expected Pickup:</span>
                        <span className="text-amber-400 font-medium">
                          {new Date(shipment.expectedPickupDate).toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* ─── Shipment Instructions (expandable) ─────────────────────── */}
                  <div className="border-t border-glass-border pt-2">
                    <button
                      className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
                      onClick={() => setExpandedShipmentId(isExpanded ? null : shipment.id)}
                    >
                      <ClipboardList className="h-3.5 w-3.5 text-teal-400" />
                      <span className="font-medium">Shipment Instructions & Notes</span>
                      {isExpanded ? <ChevronUp className="h-3 w-3 ml-auto" /> : <ChevronDown className="h-3 w-3 ml-auto" />}
                    </button>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-3 space-y-3">
                            {/* Producer Notes (read-only) */}
                            {shipment.order?.notes && (
                              <div className="glass-card p-3">
                                <p className="text-xs font-semibold text-teal-400 mb-1 flex items-center gap-1">
                                  <UserIcon className="h-3 w-3" /> Producer Notes
                                </p>
                                <p className="text-sm text-foreground/80">{shipment.order.notes}</p>
                              </div>
                            )}
                            {shipment.specialInstructions && (
                              <div className="glass-card p-3">
                                <p className="text-xs font-semibold text-amber-400 mb-1 flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3" /> Special Instructions
                                </p>
                                <p className="text-sm text-foreground/80">{shipment.specialInstructions}</p>
                              </div>
                            )}
                            {/* Transporter's own notes field */}
                            <div>
                              <Label className="text-xs text-muted-foreground mb-1 block">Your Notes</Label>
                              <Textarea
                                className="glass-input text-foreground text-sm min-h-[60px]"
                                placeholder="Add your notes about this shipment (handling instructions, route notes, etc.)"
                                value={shipmentInstructions[shipment.id] || ''}
                                onChange={e => setShipmentInstructions(prev => ({ ...prev, [shipment.id]: e.target.value }))}
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
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
                      {seller?.id && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-teal-500/30 text-teal-400 hover:text-teal-300 hover:bg-teal-500/10 gap-1 text-xs ml-auto"
                          onClick={() => handleChatWithProducer(seller.id)}
                        >
                          <MessageSquare className="h-3 w-3" /> Chat with Producer
                        </Button>
                      )}
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Shipment Tracker Dialog */}
        <ShipmentTracker
          shipment={trackingShipment}
          open={trackerOpen}
          onClose={() => setTrackerOpen(false)}
        />

        {/* Set Pickup Date Dialog */}
        <Dialog open={pickupDateDialogOpen} onOpenChange={setPickupDateDialogOpen}>
          <DialogContent className="bg-[oklch(0.15_0.012_260/0.95)] border-white/20 backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle className="text-foreground flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-amber-400" />
                Set Expected Pickup Date
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Set the expected pickup date for this shipment. This will be visible to the buyer and producer.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label className="text-foreground">Expected Pickup Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`glass-input text-foreground justify-start gap-2 font-normal ${!pickupDateValue ? 'text-muted-foreground' : ''}`}
                    >
                      <CalendarDays className="h-4 w-4 text-amber-400" />
                      {pickupDateValue
                        ? pickupDateValue.toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
                        : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-[oklch(0.15_0.012_260/0.98)] border-white/20" align="start">
                    <Calendar
                      mode="single"
                      selected={pickupDateValue}
                      onSelect={setPickupDateValue}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" className="border-glass-border" onClick={() => setPickupDateDialogOpen(false)}>Cancel</Button>
              <Button className="bg-amber-600 hover:bg-amber-500" onClick={handleSetPickupDate}>Set Pickup Date</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // ─── BIDS TAB ───────────────────────────────────────────────────────────────
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

  // ─── MESSAGES TAB ───────────────────────────────────────────────────────────
  if (tab === 'messages') {
    const conversations = myShipments.reduce((acc: any[], shipment) => {
      const order = shipment.order
      const participantId = order?.buyer?.id || order?.seller?.id
      const participantName = order?.buyer?.name || order?.seller?.name || 'Unknown'
      const isSeller = !!order?.seller?.id && !order?.buyer?.id
      if (participantId && !acc.find(c => c.id === participantId)) {
        acc.push({
          id: participantId,
          name: participantName,
          companyName: isSeller ? order.seller?.companyName : order.buyer?.companyName,
          phone: isSeller ? order.seller?.phone : order.buyer?.phone,
          role: isSeller ? 'Producer' : 'Buyer',
          lastShipment: `${shipment.origin} → ${shipment.destination}`
        })
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
                <div className="flex items-center gap-2">
                  {conv.role && (
                    <Badge className="bg-teal-500/15 text-teal-400 border-teal-500/25 border text-[10px]">
                      {conv.role}
                    </Badge>
                  )}
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </div>
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
