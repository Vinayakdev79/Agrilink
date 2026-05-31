'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin, Navigation, Truck, CheckCircle2, Circle, Clock,
  Package, Crosshair
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog'

// ─── Types ────────────────────────────────────────────────────────────────────
interface ShipmentData {
  id: string
  origin: string
  destination: string
  status: string
  exactPickupAddress?: string | null
  exactDropAddress?: string | null
  pickupLatitude?: string | null
  pickupLongitude?: string | null
  dropLatitude?: string | null
  dropLongitude?: string | null
  currentLatitude?: string | null
  currentLongitude?: string | null
  lastTrackingUpdate?: string | null
  expectedPickupDate?: string | null
  vehicleType?: string | null
  vehicleNumber?: string | null
  driverName?: string | null
  driverPhone?: string | null
  order?: {
    product?: { name: string; category: string; quantity?: number; unit?: string }
  }
  transporter?: { id: string; name: string; companyName: string; phone?: string }
}

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_STEPS = ['pending', 'assigned', 'picked_up', 'in_transit', 'delivered'] as const

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  assigned: 'Assigned',
  picked_up: 'Picked Up',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  bidding: 'Bidding',
  cancelled: 'Cancelled',
}

// ─── SVG Mini-Map ─────────────────────────────────────────────────────────────
function TrackingMap({
  pickupLat,
  pickupLng,
  dropLat,
  dropLng,
  currentLat,
  currentLng,
}: {
  pickupLat: number | null
  pickupLng: number | null
  dropLat: number | null
  dropLng: number | null
  currentLat: number | null
  currentLng: number | null
}) {
  // Default coordinates (India center) if not available
  const pLat = pickupLat || 28.6
  const pLng = pickupLng || 77.2
  const dLat = dropLat || 19.1
  const dLng = dropLng || 72.9
  const cLat = currentLat
  const cLng = currentLng

  // Calculate bounding box with padding
  const allLats = [pLat, dLat, ...(cLat ? [cLat] : [])]
  const allLngs = [pLng, dLng, ...(cLng ? [cLng] : [])]
  const minLat = Math.min(...allLats)
  const maxLat = Math.max(...allLats)
  const minLng = Math.min(...allLngs)
  const maxLng = Math.max(...allLngs)
  const latRange = Math.max(maxLat - minLat, 2)
  const lngRange = Math.max(maxLng - minLng, 2)
  const padLat = latRange * 0.2
  const padLng = lngRange * 0.2

  // SVG coordinate mapping (Y is inverted for lat)
  const mapToSvgX = (lng: number) => 20 + ((lng - minLng + padLng) / (lngRange + 2 * padLng)) * 260
  const mapToSvgY = (lat: number) => 20 + ((maxLat + padLat - lat) / (latRange + 2 * padLng)) * 160

  const pickupX = mapToSvgX(pLng)
  const pickupY = mapToSvgY(pLat)
  const dropX = mapToSvgX(dLng)
  const dropY = mapToSvgY(dLat)

  let currentX = 0
  let currentY = 0
  let hasTracking = false

  if (cLat && cLng) {
    currentX = mapToSvgX(cLng)
    currentY = mapToSvgY(cLat)
    hasTracking = true
  }

  // Calculate progress percentage
  const totalDist = Math.sqrt((dropX - pickupX) ** 2 + (dropY - pickupY) ** 2)
  const traveledDist = hasTracking
    ? Math.sqrt((currentX - pickupX) ** 2 + (currentY - pickupY) ** 2)
    : 0
  const progress = totalDist > 0 ? Math.min(Math.round((traveledDist / totalDist) * 100), 100) : 0

  return (
    <div className="relative">
      <svg
        viewBox="0 0 300 200"
        className="w-full h-48 sm:h-56 rounded-xl overflow-hidden"
        style={{ background: 'rgba(10,15,25,0.8)' }}
      >
        {/* Grid pattern */}
        <defs>
          <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
          </pattern>
          <filter id="glow-green">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feFlood floodColor="#10b981" floodOpacity="0.6" />
            <feComposite in2="blur" operator="in" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-red">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feFlood floodColor="#ef4444" floodOpacity="0.6" />
            <feComposite in2="blur" operator="in" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-blue">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feFlood floodColor="#3b82f6" floodOpacity="0.8" />
            <feComposite in2="blur" operator="in" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect width="300" height="200" fill="url(#grid)" />

        {/* Route line (full, dashed) */}
        <line
          x1={pickupX} y1={pickupY} x2={dropX} y2={dropY}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="2"
          strokeDasharray="6 4"
        />

        {/* Traveled route line (solid, emerald) */}
        {hasTracking && (
          <line
            x1={pickupX} y1={pickupY} x2={currentX} y2={currentY}
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.8"
          />
        )}

        {/* Pickup point (green) */}
        <circle cx={pickupX} cy={pickupY} r="7" fill="#10b981" filter="url(#glow-green)" />
        <circle cx={pickupX} cy={pickupY} r="3.5" fill="#10b981" />
        <text x={pickupX} y={pickupY - 12} textAnchor="middle" fill="#10b981" fontSize="8" fontWeight="600">
          PICKUP
        </text>

        {/* Drop point (red) */}
        <circle cx={dropX} cy={dropY} r="7" fill="#ef4444" filter="url(#glow-red)" />
        <circle cx={dropX} cy={dropY} r="3.5" fill="#ef4444" />
        <text x={dropX} y={dropY - 12} textAnchor="middle" fill="#ef4444" fontSize="8" fontWeight="600">
          DROP
        </text>

        {/* Current position (pulsing blue) */}
        {hasTracking && (
          <>
            <motion.circle
              cx={currentX}
              cy={currentY}
              r="12"
              fill="rgba(59,130,246,0.15)"
              animate={{ r: [12, 18, 12], opacity: [0.4, 0.1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <circle cx={currentX} cy={currentY} r="6" fill="#3b82f6" filter="url(#glow-blue)" />
            <circle cx={currentX} cy={currentY} r="3" fill="#60a5fa" />
          </>
        )}

        {/* Coordinate labels */}
        <text x={pickupX} y={pickupY + 18} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="6">
          {pLat.toFixed(2)}, {pLng.toFixed(2)}
        </text>
        <text x={dropX} y={dropY + 18} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="6">
          {dLat.toFixed(2)}, {dLng.toFixed(2)}
        </text>
      </svg>

      {/* Progress bar overlay */}
      <div className="absolute bottom-2 left-2 right-2">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
          <span>Progress</span>
          <span className="text-emerald-400 font-bold">{hasTracking ? `${progress}%` : 'Awaiting'}</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400"
            initial={{ width: 0 }}
            animate={{ width: hasTracking ? `${progress}%` : '0%' }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Status Timeline ──────────────────────────────────────────────────────────
function TrackerTimeline({ currentStatus }: { currentStatus: string }) {
  const currentIdx = STATUS_STEPS.indexOf(currentStatus as typeof STATUS_STEPS[number])
  const isActive = (idx: number) => {
    if (currentStatus === 'cancelled') return false
    return idx <= currentIdx
  }
  const isCurrent = (idx: number) => idx === currentIdx && currentStatus !== 'cancelled'

  return (
    <div className="flex items-start gap-0 w-full">
      {STATUS_STEPS.map((step, idx) => (
        <div key={step} className="flex flex-col items-center flex-1">
          <div className="flex items-center w-full">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all shrink-0 ${
                isActive(idx)
                  ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30'
                  : 'bg-white/10 border border-white/15'
              }`}
            >
              {isActive(idx) ? (
                <CheckCircle2 className="w-4 h-4 text-white" />
              ) : (
                <Circle className="w-3.5 h-3.5 text-muted-foreground" />
              )}
            </div>
            {idx < STATUS_STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-1 ${
                  isActive(idx) && isActive(idx + 1) ? 'bg-emerald-500/60' : 'bg-white/10'
                }`}
              />
            )}
          </div>
          <span
            className={`text-[9px] mt-1.5 whitespace-nowrap text-center ${
              isCurrent(idx) ? 'text-emerald-400 font-bold' : 'text-muted-foreground'
            }`}
          >
            {STATUS_LABELS[step]}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Main ShipmentTracker Component ──────────────────────────────────────────
export function ShipmentTracker({
  shipment,
  open,
  onClose,
}: {
  shipment: ShipmentData | null
  open: boolean
  onClose: () => void
}) {
  if (!shipment) return null

  const pickupLat = shipment.pickupLatitude ? parseFloat(shipment.pickupLatitude) : null
  const pickupLng = shipment.pickupLongitude ? parseFloat(shipment.pickupLongitude) : null
  const dropLat = shipment.dropLatitude ? parseFloat(shipment.dropLatitude) : null
  const dropLng = shipment.dropLongitude ? parseFloat(shipment.dropLongitude) : null
  const currentLat = shipment.currentLatitude ? parseFloat(shipment.currentLatitude) : null
  const currentLng = shipment.currentLongitude ? parseFloat(shipment.currentLongitude) : null

  const isInTransit = ['picked_up', 'in_transit'].includes(shipment.status)
  const isDelivered = shipment.status === 'delivered'

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[oklch(0.15_0.012_260/0.95)] border-white/20 backdrop-blur-xl max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
            <Crosshair className="w-5 h-5 text-emerald-400" />
            Shipment Tracker
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {shipment.origin} → {shipment.destination}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <Badge
              className={`border text-xs ${
                isDelivered
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
                  : isInTransit
                  ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25'
                  : 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25'
              }`}
            >
              {STATUS_LABELS[shipment.status] || shipment.status}
            </Badge>
            {shipment.lastTrackingUpdate && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Updated: {new Date(shipment.lastTrackingUpdate).toLocaleString('en-IN')}
              </span>
            )}
          </div>

          {/* Map */}
          <TrackingMap
            pickupLat={pickupLat}
            pickupLng={pickupLng}
            dropLat={dropLat}
            dropLng={dropLng}
            currentLat={currentLat}
            currentLng={currentLng}
          />

          {/* Status Timeline */}
          <div className="glass-card p-4">
            <TrackerTimeline currentStatus={shipment.status} />
          </div>

          {/* Exact Addresses */}
          <div className="glass-card p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Pickup Location</p>
                <p className="text-sm font-medium text-foreground">
                  {shipment.exactPickupAddress || shipment.origin}
                </p>
                {pickupLat && pickupLng && (
                  <p className="text-[10px] text-muted-foreground">
                    {pickupLat.toFixed(4)}, {pickupLng.toFixed(4)}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <Navigation className="w-3.5 h-3.5 text-red-400" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Drop-off Location</p>
                <p className="text-sm font-medium text-foreground">
                  {shipment.exactDropAddress || shipment.destination}
                </p>
                {dropLat && dropLng && (
                  <p className="text-[10px] text-muted-foreground">
                    {dropLat.toFixed(4)}, {dropLng.toFixed(4)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Shipment Details */}
          <div className="glass-card p-4">
            <div className="grid grid-cols-2 gap-3">
              {shipment.order?.product && (
                <div>
                  <p className="text-[10px] text-muted-foreground">Product</p>
                  <p className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <Package className="w-3 h-3 text-emerald-400" />
                    {shipment.order.product.name}
                  </p>
                </div>
              )}
              {shipment.expectedPickupDate && (
                <div>
                  <p className="text-[10px] text-muted-foreground">Expected Pickup</p>
                  <p className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-400" />
                    {new Date(shipment.expectedPickupDate).toLocaleDateString('en-IN')}
                  </p>
                </div>
              )}
              {shipment.vehicleType && (
                <div>
                  <p className="text-[10px] text-muted-foreground">Vehicle</p>
                  <p className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <Truck className="w-3 h-3 text-teal-400" />
                    {shipment.vehicleType} {shipment.vehicleNumber ? `(${shipment.vehicleNumber})` : ''}
                  </p>
                </div>
              )}
              {shipment.driverName && (
                <div>
                  <p className="text-[10px] text-muted-foreground">Driver</p>
                  <p className="text-xs font-semibold text-foreground">
                    {shipment.driverName}
                    {shipment.driverPhone && (
                      <span className="text-muted-foreground ml-1">{shipment.driverPhone}</span>
                    )}
                  </p>
                </div>
              )}
              {shipment.transporter && (
                <div className="col-span-2">
                  <p className="text-[10px] text-muted-foreground">Transport Company</p>
                  <p className="text-xs font-semibold text-foreground">
                    {shipment.transporter.companyName || shipment.transporter.name}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Awaiting Pickup message */}
          {!isInTransit && !isDelivered && (
            <div className="glass-card p-4 text-center">
              <div className="w-12 h-12 rounded-full bg-yellow-500/15 flex items-center justify-center mx-auto mb-2">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
              <p className="text-sm font-semibold text-foreground">Awaiting Pickup</p>
              <p className="text-xs text-muted-foreground mt-1">
                GPS tracking will be available once the shipment is picked up
              </p>
            </div>
          )}

          {/* Delivered message */}
          {isDelivered && (
            <div className="glass-card p-4 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
              <p className="text-sm font-semibold text-emerald-400">Delivered Successfully</p>
              <p className="text-xs text-muted-foreground mt-1">
                This shipment has been delivered
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Inline Mini Tracker (for embedding in cards) ────────────────────────────
export function MiniTracker({
  shipment,
  onTrack,
}: {
  shipment: ShipmentData
  onTrack: () => void
}) {
  const isInTransit = ['picked_up', 'in_transit'].includes(shipment.status)

  return (
    <Button
      size="sm"
      variant="outline"
      className={`gap-1.5 text-xs ${
        isInTransit
          ? 'border-cyan-500/30 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10'
          : 'border-emerald-500/30 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10'
      }`}
      onClick={onTrack}
    >
      <Crosshair className="w-3.5 h-3.5" />
      Track
    </Button>
  )
}

// ─── SVG Mini Map Preview (for embedding in shipment cards) ──────────────────
export function MiniMapPreview({
  pickupLat,
  pickupLng,
  dropLat,
  dropLng,
}: {
  pickupLat: string | null | undefined
  pickupLng: string | null | undefined
  dropLat: string | null | undefined
  dropLng: string | null | undefined
}) {
  const pLat = pickupLat ? parseFloat(pickupLat) : 28.6
  const pLng = pickupLng ? parseFloat(pickupLng) : 77.2
  const dLat = dropLat ? parseFloat(dropLat) : 19.1
  const dLng = dropLng ? parseFloat(dropLng) : 72.9

  const allLats = [pLat, dLat]
  const allLngs = [pLng, dLng]
  const minLat = Math.min(...allLats)
  const maxLat = Math.max(...allLats)
  const minLng = Math.min(...allLngs)
  const maxLng = Math.max(...allLngs)
  const latRange = Math.max(maxLat - minLat, 1)
  const lngRange = Math.max(maxLng - minLng, 1)
  const padLat = latRange * 0.3
  const padLng = lngRange * 0.3

  const mapToSvgX = (lng: number) => 10 + ((lng - minLng + padLng) / (lngRange + 2 * padLng)) * 80
  const mapToSvgY = (lat: number) => 5 + ((maxLat + padLat - lat) / (latRange + 2 * padLat)) * 50

  const px = mapToSvgX(pLng)
  const py = mapToSvgY(pLat)
  const dx = mapToSvgX(dLng)
  const dy = mapToSvgY(dLat)

  return (
    <svg viewBox="0 0 100 60" className="w-full h-14 rounded-lg" style={{ background: 'rgba(10,15,25,0.6)' }}>
      <line x1={px} y1={py} x2={dx} y2={dy} stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="3 2" />
      <circle cx={px} cy={py} r="3.5" fill="#10b981" opacity="0.9" />
      <circle cx={px} cy={py} r="1.5" fill="#10b981" />
      <circle cx={dx} cy={dy} r="3.5" fill="#ef4444" opacity="0.9" />
      <circle cx={dx} cy={dy} r="1.5" fill="#ef4444" />
    </svg>
  )
}
