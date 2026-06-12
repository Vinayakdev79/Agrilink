'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  MapPin, IndianRupee, Truck, User, Building2, CheckCircle, Star
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import { toast } from 'sonner'

interface CreateShipmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedOrder: any
  user: any
  onSubmit: (data: Record<string, unknown>) => Promise<void>
}

export function CreateShipmentDialog({ open, onOpenChange, selectedOrder, user, onSubmit }: CreateShipmentDialogProps) {
  const [transporterOption, setTransporterOption] = useState<'platform' | 'external'>('platform')
  const [transporters, setTransporters] = useState<any[]>([])
  const [selectedTransporterId, setSelectedTransporterId] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [externalForm, setExternalForm] = useState({
    transporterName: '', companyName: '', driverName: '',
    vehicleNumber: '', mobileNumber: '',
    estimatedPickupDate: '', estimatedDeliveryDate: '',
  })
  const [budgetRange, setBudgetRange] = useState({ min: '', max: '' })

  const resetForm = () => {
    setTransporterOption('platform')
    setSelectedTransporterId('')
    setExternalForm({
      transporterName: '', companyName: '', driverName: '',
      vehicleNumber: '', mobileNumber: '',
      estimatedPickupDate: '', estimatedDeliveryDate: '',
    })
    setBudgetRange({ min: '', max: '' })
  }

  const handleOpen = (val: boolean) => {
    if (val) {
      resetForm()
      fetch('/api/users?role=transporter')
        .then(r => r.json())
        .then(data => {
          if (data.users) setTransporters(data.users)
        })
        .catch(() => toast.error('Failed to load transporters'))
    }
    onOpenChange(val)
  }

  const handleSubmit = async () => {
    if (transporterOption === 'platform' && !selectedTransporterId) {
      toast.error('Please select a transporter')
      return
    }
    if (transporterOption === 'external') {
      if (!externalForm.transporterName || !externalForm.driverName || !externalForm.vehicleNumber || !externalForm.mobileNumber) {
        toast.error('Please fill all required external transporter fields')
        return
      }
    }

    setSubmitting(true)
    try {
      const order = selectedOrder
      const pickupAddress = user.farmLocation || [user.city, user.state].filter(Boolean).join(', ') || order.product?.location || ''
      const deliveryAddress = order.deliveryFullAddress || [order.deliveryAddress, order.deliveryCity, order.deliveryState].filter(Boolean).join(', ') || [order.buyer?.city, order.buyer?.state].filter(Boolean).join(', ') || ''

      const shipmentData: Record<string, unknown> = {
        orderId: order.id,
        origin: pickupAddress,
        destination: deliveryAddress,
        exactPickupAddress: pickupAddress,
        exactDropAddress: deliveryAddress,
        expectedPickupDate: transporterOption === 'external' && externalForm.estimatedPickupDate
          ? new Date(externalForm.estimatedPickupDate).toISOString()
          : null,
        budgetMin: budgetRange.min ? parseFloat(budgetRange.min) : null,
        budgetMax: budgetRange.max ? parseFloat(budgetRange.max) : null,
        isExternalTransporter: transporterOption === 'external',
      }

      if (transporterOption === 'platform') {
        shipmentData.transporterId = selectedTransporterId
        shipmentData.status = 'assigned'
      } else {
        shipmentData.externalTransporterName = externalForm.transporterName
        shipmentData.externalCompanyName = externalForm.companyName || null
        shipmentData.driverName = externalForm.driverName
        shipmentData.vehicleNumber = externalForm.vehicleNumber
        shipmentData.driverPhone = externalForm.mobileNumber
        shipmentData.expectedDeliveryDate = externalForm.estimatedDeliveryDate
          ? new Date(externalForm.estimatedDeliveryDate).toISOString()
          : null
        shipmentData.status = 'assigned'
      }

      await onSubmit(shipmentData)
      onOpenChange(false)
    } catch {
      toast.error('Failed to create shipment')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="bg-[oklch(0.15_0.012_260/0.95)] border-white/20 backdrop-blur-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">Create Shipment</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {selectedOrder && (
              <>Order: {selectedOrder.product?.name || 'N/A'} &bull; {selectedOrder.quantity} {selectedOrder.product?.unit || ''}</>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-4">
          {/* Pickup & Delivery Info (auto-filled) */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Addresses (Auto-filled)
            </h4>
            <div className="grid gap-2">
              <div className="glass-card p-3 border border-emerald-500/15">
                <p className="text-[10px] text-muted-foreground mb-0.5">Pickup Location (Your Address)</p>
                <p className="text-xs text-foreground font-medium">
                  {user?.farmLocation || [user?.city, user?.state].filter(Boolean).join(', ') || selectedOrder?.product?.location || 'Not set'}
                </p>
              </div>
              <div className="glass-card p-3 border border-teal-500/15">
                <p className="text-[10px] text-muted-foreground mb-0.5">Delivery Address (Buyer)</p>
                <p className="text-xs text-foreground font-medium">
                  {selectedOrder?.deliveryFullAddress || [selectedOrder?.deliveryAddress, selectedOrder?.deliveryCity, selectedOrder?.deliveryState].filter(Boolean).join(', ') || [selectedOrder?.buyer?.city, selectedOrder?.buyer?.state].filter(Boolean).join(', ') || 'Not set'}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-glass-border" />

          {/* Budget Range */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
              <IndianRupee className="h-4 w-4" /> Budget Range (Transport Cost)
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label className="text-foreground text-xs">Min Budget (₹)</Label>
                <Input type="number" className="glass-input text-foreground" placeholder="1000" value={budgetRange.min} onChange={e => setBudgetRange(p => ({ ...p, min: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label className="text-foreground text-xs">Max Budget (₹)</Label>
                <Input type="number" className="glass-input text-foreground" placeholder="5000" value={budgetRange.max} onChange={e => setBudgetRange(p => ({ ...p, max: e.target.value }))} />
              </div>
            </div>
          </div>

          <div className="border-t border-glass-border" />

          {/* Transporter Option Toggle */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
              <Truck className="h-4 w-4" /> Transporter
            </h4>
            <div className="flex gap-2">
              <button
                type="button"
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
                  transporterOption === 'platform'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-white/5 text-muted-foreground border border-white/10 hover:bg-white/10'
                }`}
                onClick={() => setTransporterOption('platform')}
              >
                <Building2 className="h-4 w-4 mx-auto mb-1" />
                AgroBridge Transporters
              </button>
              <button
                type="button"
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
                  transporterOption === 'external'
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : 'bg-white/5 text-muted-foreground border border-white/10 hover:bg-white/10'
                }`}
                onClick={() => setTransporterOption('external')}
              >
                <User className="h-4 w-4 mx-auto mb-1" />
                Own Transporter
              </button>
            </div>

            {transporterOption === 'platform' && (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {transporters.length === 0 ? (
                  <div className="glass-card p-4 text-center">
                    <p className="text-xs text-muted-foreground">Loading transporters...</p>
                  </div>
                ) : (
                  transporters.map((t: any) => (
                    <button
                      key={t.id}
                      type="button"
                      className={`w-full glass-card p-3 text-left transition-all ${
                        selectedTransporterId === t.id ? 'border-emerald-500/40 bg-emerald-500/5' : 'hover:border-white/20'
                      }`}
                      onClick={() => setSelectedTransporterId(t.id)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 border border-glass-border">
                          <AvatarFallback className="bg-teal-500/20 text-teal-400 text-[10px] font-semibold">
                            {(t.name || t.companyName || 'T').slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{t.companyName || t.name}</p>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            {t.city && <span>{t.city}</span>}
                            {t.avgRating && (
                              <span className="flex items-center gap-0.5">
                                <Star className="h-2.5 w-2.5 text-amber-400" /> {t.avgRating.toFixed(1)}
                              </span>
                            )}
                            <span>{t._count?.shipmentsAsTransporter || 0} shipments</span>
                          </div>
                        </div>
                        {selectedTransporterId === t.id && (
                          <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}

            {transporterOption === 'external' && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground bg-purple-500/10 p-2 rounded-lg border border-purple-500/20">
                  No logistics commission is charged when using your own transporter. The shipment will still be tracked within AgroBridge.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label className="text-foreground text-xs">Transporter Name *</Label>
                    <Input className="glass-input text-foreground" placeholder="e.g. Sharma Logistics" value={externalForm.transporterName} onChange={e => setExternalForm(p => ({ ...p, transporterName: e.target.value }))} />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-foreground text-xs">Company Name</Label>
                    <Input className="glass-input text-foreground" placeholder="Optional" value={externalForm.companyName} onChange={e => setExternalForm(p => ({ ...p, companyName: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label className="text-foreground text-xs">Driver Name *</Label>
                    <Input className="glass-input text-foreground" placeholder="e.g. Raj Kumar" value={externalForm.driverName} onChange={e => setExternalForm(p => ({ ...p, driverName: e.target.value }))} />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-foreground text-xs">Vehicle Number *</Label>
                    <Input className="glass-input text-foreground" placeholder="e.g. MH12AB1234" value={externalForm.vehicleNumber} onChange={e => setExternalForm(p => ({ ...p, vehicleNumber: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label className="text-foreground text-xs">Mobile Number *</Label>
                    <Input className="glass-input text-foreground" placeholder="e.g. 9876543210" value={externalForm.mobileNumber} onChange={e => setExternalForm(p => ({ ...p, mobileNumber: e.target.value }))} />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-foreground text-xs">Estimated Pickup Date *</Label>
                    <Input type="date" className="glass-input text-foreground" value={externalForm.estimatedPickupDate} onChange={e => setExternalForm(p => ({ ...p, estimatedPickupDate: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label className="text-foreground text-xs">Estimated Delivery Date</Label>
                    <Input type="date" className="glass-input text-foreground" value={externalForm.estimatedDeliveryDate} onChange={e => setExternalForm(p => ({ ...p, estimatedDeliveryDate: e.target.value }))} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" className="border-glass-border" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="bg-emerald-600 hover:bg-emerald-500" onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <><span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" /> Creating...</>
            ) : (
              'Create Shipment'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
