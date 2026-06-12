'use client'

import { useAppStore } from '@/lib/store'
import { useEffect, useState, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Package, ShoppingCart, IndianRupee, Star, Plus, MessageSquare,
  TrendingUp, TrendingDown, MapPin, Eye, Check, X, User,
  Truck, Phone, Clock, Crosshair, CalendarDays,
  Upload, Image as ImageIcon, Leaf, FileText, Shield,
  AlertTriangle, Pencil, CheckCircle, Building2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts'
import { toast } from 'sonner'
import { ShipmentTracker } from '@/components/agrilink/shipment-tracker'

// ─── Types ────────────────────────────────────────────────────────────────────
interface ProducerDashboardProps {
  tab: string
}

// ─── Constants ────────────────────────────────────────────────────────────────
const revenueData = [
  { month: 'Jul', revenue: 125000, orders: 12 },
  { month: 'Aug', revenue: 178000, orders: 16 },
  { month: 'Sep', revenue: 145000, orders: 14 },
  { month: 'Oct', revenue: 210000, orders: 20 },
  { month: 'Nov', revenue: 195000, orders: 18 },
  { month: 'Dec', revenue: 245000, orders: 22 },
]

const statusColors: Record<string, string> = {
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

const categories = ['grains', 'vegetables', 'fruits', 'spices', 'dairy', 'poultry', 'pulses', 'oilseeds']

// ─── Stock Bar ────────────────────────────────────────────────────────────────
function StockBar({ quantity, unit, minOrderQty }: { quantity: number; unit: string; minOrderQty?: number }) {
  const isOutOfStock = quantity === 0
  const isLowStock = quantity > 0 && quantity < 10
  const maxQty = minOrderQty ? Math.max(minOrderQty * 20, quantity) : quantity
  const stockPercent = maxQty > 0 ? Math.min((quantity / maxQty) * 100, 100) : 0
  const stockBarColor = isOutOfStock
    ? 'bg-red-500'
    : isLowStock
      ? 'bg-yellow-500'
      : stockPercent > 50
        ? 'bg-emerald-500'
        : 'bg-yellow-500'

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground flex items-center gap-1">
          <Package className="h-3 w-3" />
          Stock Remaining
        </span>
        <span
          className={`font-medium ${
            isOutOfStock ? 'text-red-400' : isLowStock ? 'text-yellow-400' : 'text-foreground'
          }`}
        >
          {isOutOfStock ? 'Out of Stock' : `${quantity.toLocaleString('en-IN')} ${unit}`}
        </span>
      </div>
      {!isOutOfStock && (
        <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${stockBarColor}`}
            style={{ width: `${stockPercent}%` }}
          />
        </div>
      )}
      {isLowStock && (
        <div className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3 text-orange-400" />
          <span className="text-[10px] font-semibold text-orange-400">Low Stock</span>
        </div>
      )}
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  icon,
  value,
  label,
  trend,
  trendUp,
}: {
  icon: React.ReactNode
  value: string
  label: string
  trend?: string
  trendUp?: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <div className="h-10 w-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400">
          {icon}
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 text-xs font-medium ${
              trendUp ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
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

// ─── Add Listing Form ─────────────────────────────────────────────────────────
function AddListingForm({
  formData,
  setFormData,
}: {
  formData: Record<string, any>
  setFormData: React.Dispatch<React.SetStateAction<Record<string, any>>>
  onSubmit?: () => void
  onCancel?: () => void
  isSubmitting?: boolean
}) {
  const [uploading, setUploading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const uploadForm = new FormData()
      uploadForm.append('file', file)
      uploadForm.append('folder', 'products')
      const res = await fetch('/api/upload', { method: 'POST', body: uploadForm })
      if (res.ok) {
        const data = await res.json()
        setFormData((prev) => ({ ...prev, imageUrl: data.url }))
        setImagePreview(data.url)
        toast.success('Image uploaded!')
      } else {
        toast.error('Failed to upload image')
      }
    } catch {
      toast.error('Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  const setField = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="grid gap-5 py-4">
      {/* Basic Details */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
          <Package className="h-4 w-4" /> Basic Details
        </h4>
        <div className="grid gap-3">
          <div className="grid gap-2">
            <Label className="text-foreground text-xs">Product Name *</Label>
            <Input
              className="glass-input text-foreground"
              placeholder="e.g. Basmati Rice"
              value={formData.name}
              onChange={(e) => setField('name', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label className="text-foreground text-xs">Category *</Label>
              <Select value={formData.category} onValueChange={(v) => setField('category', v)}>
                <SelectTrigger className="glass-input text-foreground">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label className="text-foreground text-xs">Quality Grade</Label>
              <Select value={formData.qualityGrade} onValueChange={(v) => setField('qualityGrade', v)}>
                <SelectTrigger className="glass-input text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">Grade A</SelectItem>
                  <SelectItem value="B">Grade B</SelectItem>
                  <SelectItem value="C">Grade C</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-glass-border" />

      {/* Product Image */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
          <ImageIcon className="h-4 w-4" /> Product Image
        </h4>
        <div className="grid gap-3">
          {imagePreview || formData.imageUrl ? (
            <div className="relative w-full h-40 rounded-xl overflow-hidden border border-glass-border">
              <img
                src={imagePreview || formData.imageUrl}
                alt="Product preview"
                className="w-full h-full object-cover"
              />
              <Button
                size="sm"
                variant="outline"
                className="absolute top-2 right-2 border-glass-border bg-black/50 text-white hover:bg-black/70 h-7 text-xs"
                onClick={() => fileInputRef.current?.click()}
              >
                Change
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full h-32 rounded-xl border-2 border-dashed border-glass-border hover:border-emerald-500/40 flex flex-col items-center justify-center gap-2 transition-colors bg-white/[0.02]"
            >
              {uploading ? (
                <>
                  <span className="h-6 w-6 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                  <p className="text-xs text-muted-foreground">Uploading...</p>
                </>
              ) : (
                <>
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Click to upload product image</p>
                  <p className="text-[10px] text-muted-foreground/60">JPEG, PNG, WebP — Max 5MB</p>
                </>
              )}
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleImageUpload}
          />
        </div>
      </div>

      <div className="border-t border-glass-border" />

      {/* Pricing & Quantity */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
          <IndianRupee className="h-4 w-4" /> Pricing & Quantity
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label className="text-foreground text-xs">Price per Unit (₹) *</Label>
            <Input
              type="number"
              className="glass-input text-foreground"
              placeholder="500"
              value={formData.pricePerUnit}
              onChange={(e) => setField('pricePerUnit', e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label className="text-foreground text-xs">Unit *</Label>
            <Select value={formData.unit} onValueChange={(v) => setField('unit', v)}>
              <SelectTrigger className="glass-input text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kg">Kg</SelectItem>
                <SelectItem value="quintal">Quintal</SelectItem>
                <SelectItem value="tonne">Tonne</SelectItem>
                <SelectItem value="litre">Litre</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label className="text-foreground text-xs">Quantity *</Label>
            <Input
              type="number"
              className="glass-input text-foreground"
              placeholder="100"
              value={formData.quantity}
              onChange={(e) => setField('quantity', e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label className="text-foreground text-xs">Min Order Qty</Label>
            <Input
              type="number"
              className="glass-input text-foreground"
              placeholder="10"
              value={formData.minOrderQty}
              onChange={(e) => setField('minOrderQty', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="border-t border-glass-border" />

      {/* Location */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
          <MapPin className="h-4 w-4" /> Location
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label className="text-foreground text-xs">Location *</Label>
            <Input
              className="glass-input text-foreground"
              placeholder="e.g. Nashik"
              value={formData.location}
              onChange={(e) => setField('location', e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label className="text-foreground text-xs">State</Label>
            <Input
              className="glass-input text-foreground"
              placeholder="e.g. Maharashtra"
              value={formData.state}
              onChange={(e) => setField('state', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="border-t border-glass-border" />

      {/* Crop Details */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
          <Leaf className="h-4 w-4" /> Crop Details
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label className="text-foreground text-xs">Crop Variety</Label>
            <Input
              className="glass-input text-foreground"
              placeholder="e.g. 1121, Alphonso"
              value={formData.cropVariety}
              onChange={(e) => setField('cropVariety', e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label className="text-foreground text-xs">Harvest Date</Label>
            <Input
              type="date"
              className="glass-input text-foreground"
              value={formData.harvestDate}
              onChange={(e) => setField('harvestDate', e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label className="text-foreground text-xs">Freshness</Label>
            <Select value={formData.freshness} onValueChange={(v) => setField('freshness', v)}>
              <SelectTrigger className="glass-input text-foreground">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Fresh">Fresh</SelectItem>
                <SelectItem value="Recently Harvested">Recently Harvested</SelectItem>
                <SelectItem value="Stored">Stored</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label className="text-foreground text-xs">Is Organic</Label>
            <div className="flex items-center gap-3 h-10">
              <Switch
                checked={formData.isOrganic}
                onCheckedChange={(checked) => setField('isOrganic', checked)}
              />
              <span className="text-sm text-foreground">{formData.isOrganic ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label className="text-foreground text-xs">Pesticides Used</Label>
            <Input
              className="glass-input text-foreground"
              placeholder="e.g. Neem-based"
              value={formData.pesticidesUsed}
              onChange={(e) => setField('pesticidesUsed', e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label className="text-foreground text-xs">Moisture Content</Label>
            <Input
              className="glass-input text-foreground"
              placeholder="e.g. 12%"
              value={formData.moistureContent}
              onChange={(e) => setField('moistureContent', e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label className="text-foreground text-xs">Shelf Life</Label>
            <Input
              className="glass-input text-foreground"
              placeholder="e.g. 6 months"
              value={formData.shelfLife}
              onChange={(e) => setField('shelfLife', e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label className="text-foreground text-xs">Storage Condition</Label>
            <Input
              className="glass-input text-foreground"
              placeholder="e.g. Cool, dry place"
              value={formData.storageCondition}
              onChange={(e) => setField('storageCondition', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="border-t border-glass-border" />

      {/* Certifications */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
          <Shield className="h-4 w-4" /> Certifications
        </h4>
        <div className="grid gap-2">
          <Label className="text-foreground text-xs">Product Certifications</Label>
          <Input
            className="glass-input text-foreground"
            placeholder="e.g. FSSAI, APEDA, Organic India (comma separated)"
            value={formData.certifications}
            onChange={(e) => setField('certifications', e.target.value)}
          />
        </div>
      </div>

      <div className="border-t border-glass-border" />

      {/* Description */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
          <FileText className="h-4 w-4" /> Description
        </h4>
        <div className="grid gap-2">
          <Textarea
            className="glass-input text-foreground min-h-[80px]"
            placeholder="Describe your product..."
            value={formData.description}
            onChange={(e) => setField('description', e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Inline Create Shipment Dialog Content ───────────────────────────────────
function CreateShipmentDialogContent({
  selectedOrder,
  user,
  onClose,
  onSubmit,
  submitting,
}: {
  selectedOrder: any
  user: any
  onClose: () => void
  onSubmit: (_data: Record<string, unknown>) => Promise<void>
  submitting: boolean
}) {
  const [transporterOption, setTransporterOption] = useState<'platform' | 'external'>('platform')
  const [transporters, setTransporters] = useState<any[]>([])
  const [selectedTransporterId, setSelectedTransporterId] = useState<string>('')
  const [budgetRange, setBudgetRange] = useState({ min: '', max: '' })
  const [externalForm, setExternalForm] = useState({
    transporterName: '',
    companyName: '',
    driverName: '',
    vehicleNumber: '',
    mobileNumber: '',
    estimatedPickupDate: '',
    estimatedDeliveryDate: '',
  })

  // Fetch transporters on mount
  useEffect(() => {
    fetch('/api/users?role=transporter')
      .then((r) => r.json())
      .then((data) => {
        if (data.users) setTransporters(data.users)
      })
      .catch(() => toast.error('Failed to load transporters'))
  }, [])

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

    const order = selectedOrder
    const pickupAddress =
      user.farmLocation || [user.city, user.state].filter(Boolean).join(', ') || order.product?.location || ''
    const deliveryAddress =
      order.deliveryFullAddress ||
      [order.deliveryAddress, order.deliveryCity, order.deliveryState].filter(Boolean).join(', ') ||
      [order.buyer?.city, order.buyer?.state].filter(Boolean).join(', ') ||
      ''

    const shipmentData: Record<string, unknown> = {
      orderId: order.id,
      origin: pickupAddress,
      destination: deliveryAddress,
      exactPickupAddress: pickupAddress,
      exactDropAddress: deliveryAddress,
      expectedPickupDate:
        transporterOption === 'external' && externalForm.estimatedPickupDate
          ? new Date(externalForm.estimatedPickupDate).toISOString()
          : null,
      budgetMin: budgetRange.min ? parseFloat(budgetRange.min) : null,
      budgetMax: budgetRange.max ? parseFloat(budgetRange.max) : null,
    }

    if (transporterOption === 'platform') {
      shipmentData.transporterId = selectedTransporterId
      shipmentData.status = 'assigned'
    } else {
      shipmentData.isExternal = true
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
    onClose()
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-foreground">Create Shipment</DialogTitle>
        <DialogDescription className="text-muted-foreground">
          {selectedOrder && (
            <>
              Order: {selectedOrder.product?.name || 'N/A'} &bull; {selectedOrder.quantity}{' '}
              {selectedOrder.product?.unit || ''}
            </>
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
                {user?.farmLocation ||
                  [user?.city, user?.state].filter(Boolean).join(', ') ||
                  selectedOrder?.product?.location ||
                  'Not set'}
              </p>
            </div>
            <div className="glass-card p-3 border border-teal-500/15">
              <p className="text-[10px] text-muted-foreground mb-0.5">Delivery Address (Buyer)</p>
              <p className="text-xs text-foreground font-medium">
                {selectedOrder?.deliveryFullAddress ||
                  [selectedOrder?.deliveryAddress, selectedOrder?.deliveryCity, selectedOrder?.deliveryState]
                    .filter(Boolean)
                    .join(', ') ||
                  [selectedOrder?.buyer?.city, selectedOrder?.buyer?.state].filter(Boolean).join(', ') ||
                  'Not set'}
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
              <Input
                type="number"
                className="glass-input text-foreground"
                placeholder="1000"
                value={budgetRange.min}
                onChange={(e) => setBudgetRange((p) => ({ ...p, min: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-foreground text-xs">Max Budget (₹)</Label>
              <Input
                type="number"
                className="glass-input text-foreground"
                placeholder="5000"
                value={budgetRange.max}
                onChange={(e) => setBudgetRange((p) => ({ ...p, max: e.target.value }))}
              />
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

          {/* Platform Transporters List */}
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
                      selectedTransporterId === t.id
                        ? 'border-emerald-500/40 bg-emerald-500/5'
                        : 'hover:border-white/20'
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
                        <p className="text-sm font-medium text-foreground truncate">
                          {t.companyName || t.name}
                        </p>
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

          {/* External Transporter Form */}
          {transporterOption === 'external' && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground bg-purple-500/10 p-2 rounded-lg border border-purple-500/20">
                No logistics commission is charged when using your own transporter. The shipment will
                still be tracked within AgroBridge.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label className="text-foreground text-xs">Transporter Name *</Label>
                  <Input
                    className="glass-input text-foreground"
                    placeholder="e.g. Sharma Logistics"
                    value={externalForm.transporterName}
                    onChange={(e) =>
                      setExternalForm((p) => ({ ...p, transporterName: e.target.value }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-foreground text-xs">Company Name</Label>
                  <Input
                    className="glass-input text-foreground"
                    placeholder="Optional"
                    value={externalForm.companyName}
                    onChange={(e) =>
                      setExternalForm((p) => ({ ...p, companyName: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label className="text-foreground text-xs">Driver Name *</Label>
                  <Input
                    className="glass-input text-foreground"
                    placeholder="e.g. Raj Kumar"
                    value={externalForm.driverName}
                    onChange={(e) =>
                      setExternalForm((p) => ({ ...p, driverName: e.target.value }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-foreground text-xs">Vehicle Number *</Label>
                  <Input
                    className="glass-input text-foreground"
                    placeholder="e.g. MH12AB1234"
                    value={externalForm.vehicleNumber}
                    onChange={(e) =>
                      setExternalForm((p) => ({ ...p, vehicleNumber: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label className="text-foreground text-xs">Mobile Number *</Label>
                  <Input
                    className="glass-input text-foreground"
                    placeholder="e.g. 9876543210"
                    value={externalForm.mobileNumber}
                    onChange={(e) =>
                      setExternalForm((p) => ({ ...p, mobileNumber: e.target.value }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-foreground text-xs">Estimated Pickup Date *</Label>
                  <Input
                    type="date"
                    className="glass-input text-foreground"
                    value={externalForm.estimatedPickupDate}
                    onChange={(e) =>
                      setExternalForm((p) => ({ ...p, estimatedPickupDate: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label className="text-foreground text-xs">Estimated Delivery Date</Label>
                  <Input
                    type="date"
                    className="glass-input text-foreground"
                    value={externalForm.estimatedDeliveryDate}
                    onChange={(e) =>
                      setExternalForm((p) => ({ ...p, estimatedDeliveryDate: e.target.value }))
                    }
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" className="border-glass-border" onClick={onClose}>
          Cancel
        </Button>
        <Button className="bg-emerald-600 hover:bg-emerald-500" onClick={handleSubmit} disabled={submitting}>
          {submitting ? (
            <>
              <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />{' '}
              Creating...
            </>
          ) : (
            'Create Shipment'
          )}
        </Button>
      </DialogFooter>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Main Producer Dashboard Component ────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
export function ProducerDashboard({ tab }: ProducerDashboardProps) {
  const { user, setChatOpen, setActiveChatUser, setDashboardTab } = useAppStore()

  // Core data state
  const [orders, setOrders] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Add listing dialog state
  const [addListingOpen, setAddListingOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<Record<string, any>>({
    name: '',
    category: '',
    description: '',
    quantity: '',
    unit: 'kg',
    pricePerUnit: '',
    minOrderQty: '',
    location: '',
    state: '',
    qualityGrade: 'A',
    imageUrl: '',
    cropVariety: '',
    harvestDate: '',
    freshness: '',
    isOrganic: false,
    pesticidesUsed: '',
    moistureContent: '',
    shelfLife: '',
    storageCondition: '',
    certifications: '',
  })

  // Shipment tracking state
  const [shipments, setShipments] = useState<any[]>([])
  const [trackingShipment, setTrackingShipment] = useState<any>(null)
  const [trackerOpen, setTrackerOpen] = useState(false)

  // Inline quantity edit state
  const [editingQtyId, setEditingQtyId] = useState<string | null>(null)
  const [editQtyValue, setEditQtyValue] = useState<string>('')

  // Create shipment dialog state
  const [createShipmentOpen, setCreateShipmentOpen] = useState(false)
  const [selectedOrderForShipment, setSelectedOrderForShipment] = useState<any>(null)
  const [shipmentSubmitting, setShipmentSubmitting] = useState(false)

  // ─── Data Fetching ──────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const [ordersRes, productsRes] = await Promise.all([
        fetch(`/api/orders?userId=${user.id}&role=producer`),
        fetch(`/api/products?sellerId=${user.id}`),
      ])
      const ordersData = await ordersRes.json()
      const productsData = await productsRes.json()
      if (ordersData.orders) setOrders(ordersData.orders)
      if (productsData.products) setProducts(productsData.products)

      // Fetch shipments for this producer's orders
      const shipRes = await fetch('/api/shipments')
      const shipData = await shipRes.json()
      const allShipments = shipData.shipments || []
      const myOrderIds = new Set((ordersData.orders || []).map((o: any) => o.id))
      const myShips = allShipments.filter((s: any) => myOrderIds.has(s.orderId))
      setShipments(myShips)
    } catch {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const resetFormData = () => {
    setFormData({
      name: '',
      category: '',
      description: '',
      quantity: '',
      unit: 'kg',
      pricePerUnit: '',
      minOrderQty: '',
      location: '',
      state: '',
      qualityGrade: 'A',
      imageUrl: '',
      cropVariety: '',
      harvestDate: '',
      freshness: '',
      isOrganic: false,
      pesticidesUsed: '',
      moistureContent: '',
      shelfLife: '',
      storageCondition: '',
      certifications: '',
    })
  }

  const handleAddListing = async () => {
    if (!user) return
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sellerId: user.id, ...formData }),
      })
      if (res.ok) {
        toast.success('Listing created successfully!')
        setAddListingOpen(false)
        resetFormData()
        fetchData()
      } else {
        toast.error('Failed to create listing')
      }
    } catch {
      toast.error('Failed to create listing')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOrderAction = async (orderId: string, status: string) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status }),
      })
      if (res.ok) {
        toast.success(`Order ${status === 'confirmed' ? 'accepted' : 'rejected'}`)
        fetchData()
      } else {
        toast.error('Failed to update order')
      }
    } catch {
      toast.error('Failed to update order')
    }
  }

  const handleTrackShipment = (shipment: any) => {
    setTrackingShipment(shipment)
    setTrackerOpen(true)
  }

  const getShipmentForOrder = (orderId: string) => {
    return shipments.find((s: any) => s.orderId === orderId)
  }

  // Inline quantity edit
  const handleStartEditQty = (productId: string, currentQty: number) => {
    setEditingQtyId(productId)
    setEditQtyValue(String(currentQty))
  }

  const handleSaveQty = async (productId: string) => {
    try {
      const res = await fetch('/api/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: parseFloat(editQtyValue) }),
      })
      if (res.ok) {
        toast.success('Quantity updated')
        setEditingQtyId(null)
        fetchData()
      } else {
        toast.error('Failed to update quantity')
      }
    } catch {
      toast.error('Failed to update quantity')
    }
  }

  const handleCancelEditQty = () => {
    setEditingQtyId(null)
    setEditQtyValue('')
  }

  // Create shipment
  const openCreateShipment = (order: any) => {
    setSelectedOrderForShipment(order)
    setCreateShipmentOpen(true)
  }

  const handleCreateShipment = async (shipmentData: Record<string, unknown>) => {
    setShipmentSubmitting(true)
    try {
      const res = await fetch('/api/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shipmentData),
      })
      if (res.ok) {
        toast.success('Shipment created successfully!')
        setCreateShipmentOpen(false)
        setSelectedOrderForShipment(null)
        fetchData()
      } else {
        toast.error('Failed to create shipment')
      }
    } catch {
      toast.error('Failed to create shipment')
    } finally {
      setShipmentSubmitting(false)
    }
  }

  // ─── Computed Values ────────────────────────────────────────────────────────
  const activeListings = products.filter((p) => p.isActive).length
  const totalOrders = orders.length
  const revenue = orders
    .filter((o) => o.status === 'delivered')
    .reduce((s, o) => s + (o.totalPrice || 0), 0)
  const avgRating = user?.avgRating || 4.7

  // ─── Shared Create Shipment Dialog (used by orders & shipments tabs) ────────
  const renderCreateShipmentDialog = () => (
    <Dialog open={createShipmentOpen} onOpenChange={setCreateShipmentOpen}>
      <DialogContent className="bg-[oklch(0.15_0.012_260/0.95)] border-white/20 backdrop-blur-xl max-h-[90vh] overflow-y-auto">
        {selectedOrderForShipment && (
          <CreateShipmentDialogContent
            selectedOrder={selectedOrderForShipment}
            user={user}
            onClose={() => {
              setCreateShipmentOpen(false)
              setSelectedOrderForShipment(null)
            }}
            onSubmit={handleCreateShipment}
            submitting={shipmentSubmitting}
          />
        )}
      </DialogContent>
    </Dialog>
  )

  // ─── Shared Shipment Tracker Dialog ─────────────────────────────────────────
  const renderShipmentTracker = () => (
    <ShipmentTracker
      shipment={trackingShipment}
      open={trackerOpen}
      onClose={() => setTrackerOpen(false)}
    />
  )

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── OVERVIEW TAB ──────────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  if (tab === 'overview') {
    return (
      <div className="space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Package className="h-5 w-5" />}
            value={String(activeListings)}
            label="Active Listings"
            trend="+12%"
            trendUp
          />
          <StatCard
            icon={<ShoppingCart className="h-5 w-5" />}
            value={String(totalOrders)}
            label="Total Orders"
            trend="+8%"
            trendUp
          />
          <StatCard
            icon={<IndianRupee className="h-5 w-5" />}
            value={`₹${(revenue / 1000).toFixed(0)}K`}
            label="Revenue"
            trend="+24%"
            trendUp
          />
          <StatCard
            icon={<Star className="h-5 w-5" />}
            value={avgRating.toFixed(1)}
            label="Avg Rating"
            trend="+0.3"
            trendUp
          />
        </div>

        {/* Revenue chart */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Revenue Trend</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.4)" fontSize={12} />
                <YAxis
                  stroke="rgba(255,255,255,0.4)"
                  fontSize={12}
                  tickFormatter={(v) => `₹${v / 1000}K`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15,15,30,0.9)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: '#fff',
                  }}
                  formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  fill="url(#revenueGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent orders */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Recent Orders</h3>
            <Button
              variant="ghost"
              size="sm"
              className="text-emerald-400 hover:text-emerald-300"
              onClick={() => setDashboardTab('orders')}
            >
              View All
            </Button>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">No orders yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-glass-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Product</TableHead>
                  <TableHead className="text-muted-foreground">Buyer</TableHead>
                  <TableHead className="text-muted-foreground">Qty</TableHead>
                  <TableHead className="text-muted-foreground">Total</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.slice(0, 5).map((order) => (
                  <TableRow key={order.id} className="border-glass-border">
                    <TableCell className="font-medium text-foreground">
                      {order.product?.name || 'N/A'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {order.buyer?.name || order.buyer?.companyName || 'N/A'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {order.quantity} {order.product?.unit || ''}
                    </TableCell>
                    <TableCell className="text-emerald-400 font-medium">
                      ₹{order.totalPrice?.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`${
                          statusColors[order.status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                        } border text-xs`}
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-3">
          <Button className="bg-emerald-600 hover:bg-emerald-500 gap-2" onClick={() => setAddListingOpen(true)}>
            <Plus className="h-4 w-4" /> Add New Listing
          </Button>
          <Button variant="outline" className="border-glass-border gap-2" onClick={() => setChatOpen(true)}>
            <MessageSquare className="h-4 w-4" /> View Messages
          </Button>
        </div>

        {/* Add Listing Dialog */}
        <Dialog open={addListingOpen} onOpenChange={setAddListingOpen}>
          <DialogContent className="bg-[oklch(0.15_0.012_260/0.95)] border-white/20 backdrop-blur-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-foreground">Add New Listing</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Create a new product listing for the marketplace
              </DialogDescription>
            </DialogHeader>
            <AddListingForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleAddListing}
              onCancel={() => setAddListingOpen(false)}
              isSubmitting={isSubmitting}
            />
            <DialogFooter>
              <Button
                variant="outline"
                className="border-glass-border"
                onClick={() => setAddListingOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-500"
                onClick={handleAddListing}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />{' '}
                    Creating...
                  </>
                ) : (
                  'Create Listing'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── LISTINGS TAB ──────────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  if (tab === 'listings') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-foreground">My Listings</h3>
          <Dialog open={addListingOpen} onOpenChange={setAddListingOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-500 gap-2">
                <Plus className="h-4 w-4" /> Add Listing
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[oklch(0.15_0.012_260/0.95)] border-white/20 backdrop-blur-xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-foreground">Add New Listing</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Create a new product listing
                </DialogDescription>
              </DialogHeader>
              <AddListingForm
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleAddListing}
                onCancel={() => setAddListingOpen(false)}
                isSubmitting={isSubmitting}
              />
              <DialogFooter>
                <Button
                  variant="outline"
                  className="border-glass-border"
                  onClick={() => setAddListingOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-500"
                  onClick={handleAddListing}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />{' '}
                      Creating...
                    </>
                  ) : (
                    'Create Listing'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No listings yet. Create your first listing!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-5 space-y-3 hover:border-emerald-500/30 transition-colors"
              >
                {/* Product Image */}
                {product.imageUrl && (
                  <div className="w-full h-32 rounded-xl overflow-hidden border border-glass-border">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Name, Category & Badges */}
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-foreground">{product.name}</h4>
                    <p className="text-xs text-muted-foreground capitalize">{product.category}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {product.quantity === 0 && (
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/30 border text-[9px]">
                        Out of Stock
                      </Badge>
                    )}
                    {product.quantity > 0 && product.quantity < 10 && (
                      <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 border text-[9px]">
                        Low Stock
                      </Badge>
                    )}
                    <Badge
                      className={`${
                        product.isActive
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : 'bg-red-500/20 text-red-400 border-red-500/30'
                      } border text-xs`}
                    >
                      {product.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price</span>
                    <span className="text-emerald-400 font-medium">
                      ₹{product.pricePerUnit}/{product.unit}
                    </span>
                  </div>

                  {/* Inline editable quantity */}
                  <div>
                    {editingQtyId === product.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={editQtyValue}
                          onChange={(e) => setEditQtyValue(e.target.value)}
                          className="h-7 text-xs glass-input w-24"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveQty(product.id)
                            if (e.key === 'Escape') handleCancelEditQty()
                          }}
                          autoFocus
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-emerald-400 hover:text-emerald-300"
                          onClick={() => handleSaveQty(product.id)}
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-red-400 hover:text-red-300"
                          onClick={handleCancelEditQty}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Quantity (Stock)</span>
                        <span
                          className="text-foreground flex items-center gap-1.5 cursor-pointer group"
                          onClick={() => handleStartEditQty(product.id, product.quantity)}
                        >
                          {product.quantity} {product.unit}
                          <Pencil className="h-3 w-3 text-muted-foreground group-hover:text-emerald-400 transition-colors" />
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Stock indicator bar */}
                  <StockBar quantity={product.quantity} unit={product.unit} minOrderQty={product.minOrderQty} />

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Location</span>
                    <span className="text-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {product.location}
                    </span>
                  </div>
                  {product.qualityGrade && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Grade</span>
                      <span className="text-amber-400 font-medium">{product.qualityGrade}</span>
                    </div>
                  )}
                  {product.cropVariety && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Variety</span>
                      <span className="text-foreground">{product.cropVariety}</span>
                    </div>
                  )}
                  {product.isOrganic && (
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 border text-[9px]">
                      <Leaf className="h-2.5 w-2.5 mr-0.5" /> Organic
                    </Badge>
                  )}
                </div>

                <div className="pt-2 border-t border-glass-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground w-full gap-2"
                  >
                    <Eye className="h-4 w-4" /> View Details
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── ORDERS TAB ────────────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  if (tab === 'orders') {
    return (
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-foreground">Orders</h3>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No orders yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const shipment = getShipmentForOrder(order.id)
              const hasTransport =
                shipment &&
                (shipment.transporterId || shipment.isExternalTransporter || shipment.isExternal) &&
                ['assigned', 'picked_up', 'in_transit', 'delivered'].includes(shipment.status)
              const isShippedOrInTransit = shipment && ['picked_up', 'in_transit'].includes(shipment.status)

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-5 space-y-4"
                >
                  {/* Order header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-foreground">
                        {order.product?.name || 'N/A'}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {order.quantity} {order.product?.unit || ''} • ₹
                        {order.totalPrice?.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={`${statusColors[order.status] || ''} border text-xs`}
                      >
                        {order.status}
                      </Badge>
                      {order.status === 'negotiating' && (
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                            onClick={() => handleOrderAction(order.id, 'confirmed')}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            onClick={() => handleOrderAction(order.id, 'cancelled')}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Buyer Information Card */}
                  <div className="glass-card p-4 border border-emerald-500/15">
                    <div className="flex items-center gap-2 mb-3">
                      <User className="h-4 w-4 text-emerald-400" />
                      <h5 className="text-sm font-semibold text-foreground">Buyer Information</h5>
                    </div>
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10 border border-glass-border shrink-0">
                        <AvatarFallback className="bg-emerald-500/20 text-emerald-400 text-xs font-semibold">
                          {(order.buyer?.name || order.buyer?.companyName || 'B')
                            .slice(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium text-foreground">
                          {order.buyer?.name || order.buyer?.companyName || 'Unknown Buyer'}
                        </p>
                        {order.buyer?.phone && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {order.buyer.phone}
                          </p>
                        )}
                        {(order.deliveryFullAddress ||
                          order.deliveryAddress ||
                          order.deliveryCity ||
                          order.buyer?.city) && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {order.deliveryFullAddress ||
                              [order.deliveryAddress, order.deliveryCity, order.deliveryState]
                                .filter(Boolean)
                                .join(', ') ||
                              [order.buyer?.city, order.buyer?.state].filter(Boolean).join(', ')}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Order: {order.quantity} {order.product?.unit || ''} of{' '}
                          {order.product?.name || 'N/A'} • ₹{order.totalPrice?.toLocaleString()}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-emerald-500/30 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 text-xs shrink-0"
                        onClick={() => {
                          setActiveChatUser(order.buyer?.id)
                          setChatOpen(true)
                        }}
                      >
                        <MessageSquare className="h-3 w-3 mr-1" /> Chat
                      </Button>
                    </div>
                  </div>

                  {/* Expected Pickup Date */}
                  {hasTransport && shipment.expectedPickupDate && (
                    <div className="glass-card p-3 border border-amber-500/20 bg-amber-500/5">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-5 w-5 text-amber-400" />
                        <div>
                          <p className="text-xs text-muted-foreground">Expected Pickup Date</p>
                          <p className="text-sm font-bold text-amber-400">
                            {new Date(shipment.expectedPickupDate).toLocaleDateString('en-IN', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Transport Details Card */}
                  {hasTransport && (
                    <div className="glass-card p-4 border border-teal-500/20">
                      <div className="flex items-center gap-2 mb-3">
                        <Truck className="h-4 w-4 text-teal-400" />
                        <h5 className="text-sm font-semibold text-foreground">Transport Details</h5>
                        <Badge
                          className={`${shipmentStatusColors[shipment.status] || ''} border text-[10px] ml-auto`}
                        >
                          {shipment.status.replace('_', ' ')}
                        </Badge>
                        {(shipment.isExternalTransporter || shipment.isExternal) && (
                          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 border text-[9px]">
                            External
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground text-[10px]">Company</p>
                          <p className="text-foreground font-medium text-xs">
                            {shipment.isExternalTransporter || shipment.isExternal
                              ? shipment.externalCompanyName || shipment.externalTransporterName || 'N/A'
                              : shipment.transporter?.companyName || shipment.transporter?.name || 'N/A'}
                          </p>
                        </div>
                        {(shipment.driverName || shipment.isExternalTransporter || shipment.isExternal) && (
                          <div>
                            <p className="text-muted-foreground text-[10px]">Driver</p>
                            <p className="text-foreground font-medium text-xs flex items-center gap-1">
                              <User className="h-3 w-3 text-emerald-400" />
                              {shipment.driverName || 'N/A'}
                            </p>
                            {shipment.driverPhone && (
                              <p className="text-muted-foreground text-[10px] flex items-center gap-1 mt-0.5">
                                <Phone className="h-2.5 w-2.5" /> {shipment.driverPhone}
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
                              {shipment.vehicleNumber ? ` (${shipment.vehicleNumber})` : ''}
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

                  {/* Create Shipment Button */}
                  {(order.status === 'confirmed' || order.status === 'negotiating') && !shipment && (
                    <Button
                      size="sm"
                      className="bg-teal-600 hover:bg-teal-500 text-white gap-1.5 text-xs"
                      onClick={() => openCreateShipment(order)}
                    >
                      <Truck className="h-3.5 w-3.5" /> Create Shipment
                    </Button>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Shipment Tracker Dialog */}
        {renderShipmentTracker()}
        {/* Create Shipment Dialog */}
        {renderCreateShipmentDialog()}
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── SHIPMENTS TAB ─────────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  if (tab === 'shipments') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-foreground">Shipments</h3>
          <Button
            className="bg-emerald-600 hover:bg-emerald-500 gap-2"
            onClick={() => {
              const confirmedWithoutShipment = orders.find(
                (o) =>
                  (o.status === 'confirmed' || o.status === 'negotiating') &&
                  !getShipmentForOrder(o.id)
              )
              if (confirmedWithoutShipment) {
                openCreateShipment(confirmedWithoutShipment)
              } else {
                toast.info('No eligible orders for shipment. Confirm an order first.')
              }
            }}
          >
            <Plus className="h-4 w-4" /> Create Shipment
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : shipments.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No shipments yet. Create a shipment from a confirmed order!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {shipments.map((shipment: any) => {
              const isShippedOrInTransit = ['picked_up', 'in_transit'].includes(shipment.status)
              return (
                <motion.div
                  key={shipment.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-5 space-y-4"
                >
                  {/* Shipment header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-foreground">
                        {shipment.order?.product?.name || 'N/A'}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {shipment.order?.buyer?.name || shipment.order?.buyer?.companyName || 'N/A'} •{' '}
                        {shipment.order?.product?.quantity || 0} {shipment.order?.product?.unit || ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={`${shipmentStatusColors[shipment.status] || ''} border text-xs`}
                      >
                        {shipment.status.replace('_', ' ')}
                      </Badge>
                      {(shipment.isExternalTransporter || shipment.isExternal) && (
                        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 border text-[9px]">
                          External
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Transporter details */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground text-[10px]">Transporter</p>
                      <p className="text-foreground font-medium text-xs">
                        {shipment.isExternalTransporter || shipment.isExternal
                          ? shipment.externalCompanyName || shipment.externalTransporterName || 'N/A'
                          : shipment.transporter?.companyName || shipment.transporter?.name || 'Pending assignment'}
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
                            <Phone className="h-2.5 w-2.5" /> {shipment.driverPhone}
                          </p>
                        )}
                      </div>
                    )}
                    {(shipment.vehicleType || shipment.vehicleNumber) && (
                      <div>
                        <p className="text-muted-foreground text-[10px]">Vehicle</p>
                        <p className="text-foreground font-medium text-xs">
                          {shipment.vehicleType || ''}{' '}
                          {shipment.vehicleNumber ? `(${shipment.vehicleNumber})` : ''}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-muted-foreground text-[10px]">Pickup</p>
                      <p className="text-foreground font-medium text-xs flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-emerald-400" />
                        {shipment.exactPickupAddress || shipment.origin || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-[10px]">Delivery</p>
                      <p className="text-foreground font-medium text-xs flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-red-400" />
                        {shipment.exactDropAddress || shipment.destination || 'N/A'}
                      </p>
                    </div>
                    {shipment.expectedPickupDate && (
                      <div>
                        <p className="text-muted-foreground text-[10px]">Expected Pickup</p>
                        <p className="text-foreground font-medium text-xs flex items-center gap-1">
                          <CalendarDays className="h-3 w-3 text-amber-400" />
                          {new Date(shipment.expectedPickupDate).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Track button */}
                  {isShippedOrInTransit && (
                    <div className="pt-3 border-t border-glass-border">
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
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Shipment Tracker Dialog */}
        {renderShipmentTracker()}
        {/* Create Shipment Dialog */}
        {renderCreateShipmentDialog()}
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── MESSAGES TAB ──────────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  if (tab === 'messages') {
    const conversations = orders.reduce((acc: any[], order) => {
      const buyerId = order.buyer?.id
      if (buyerId && !acc.find((c) => c.id === buyerId)) {
        acc.push({
          id: buyerId,
          name: order.buyer?.name || order.buyer?.companyName || 'Unknown',
          lastOrder: order.product?.name,
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
            <p className="text-muted-foreground">
              No conversations yet. Start trading to connect with buyers!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv: any, i: number) => (
              <motion.button
                key={conv.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="w-full glass-card p-4 flex items-center gap-4 hover:border-emerald-500/30 transition-colors text-left"
                onClick={() => {
                  setActiveChatUser(conv.id)
                  setChatOpen(true)
                }}
              >
                <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-semibold text-sm">
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

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── PROFILE TAB (default) ─────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="glass-card p-6 text-center">
      <User className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-foreground mb-2">Profile Settings</h3>
      <p className="text-muted-foreground mb-4">
        Manage your account details and verification status
      </p>
      <Button
        className="bg-emerald-600 hover:bg-emerald-500 gap-2"
        onClick={() => useAppStore.getState().setView('profile')}
      >
        <User className="h-4 w-4" /> Go to Profile
      </Button>
    </div>
  )
}
