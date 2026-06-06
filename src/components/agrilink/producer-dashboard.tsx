'use client'

import { useAppStore } from '@/lib/store'
import { useEffect, useState, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Package, ShoppingCart, IndianRupee, Star, Plus, MessageSquare,
  TrendingUp, TrendingDown, MapPin, Eye, Check, X, User,
  Truck, Phone, Clock, Crosshair, CalendarDays,
  Upload, Image as ImageIcon, Leaf, FileText, Droplets, Shield
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart
} from 'recharts'
import { toast } from 'sonner'
import { ShipmentTracker } from '@/components/agrilink/shipment-tracker'

interface ProducerDashboardProps {
  tab: string
}

// Mock revenue data
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
        <div className="h-10 w-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400">
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

// ─── Enhanced Add Listing Form ───────────────────────────────────────────────
function AddListingForm({ formData, setFormData, onSubmit, onCancel, isSubmitting }: {
  formData: any; setFormData: React.Dispatch<React.SetStateAction<any>>;
  onSubmit: () => void; onCancel: () => void; isSubmitting: boolean
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
        setFormData((prev: any) => ({ ...prev, imageUrl: data.url }))
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

  return (
    <div className="grid gap-5 py-4">
      {/* Section 1: Basic Details */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
          <Package className="h-4 w-4" /> Basic Details
        </h4>
        <div className="grid gap-3">
          <div className="grid gap-2">
            <Label className="text-foreground text-xs">Product Name *</Label>
            <Input className="glass-input text-foreground" placeholder="e.g. Basmati Rice" value={formData.name} onChange={e => setFormData((p: any) => ({ ...p, name: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label className="text-foreground text-xs">Category *</Label>
              <Select value={formData.category} onValueChange={v => setFormData((p: any) => ({ ...p, category: v }))}>
                <SelectTrigger className="glass-input text-foreground"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label className="text-foreground text-xs">Quality Grade</Label>
              <Select value={formData.qualityGrade} onValueChange={v => setFormData((p: any) => ({ ...p, qualityGrade: v }))}>
                <SelectTrigger className="glass-input text-foreground"><SelectValue /></SelectTrigger>
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

      {/* Section 2: Images */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
          <ImageIcon className="h-4 w-4" /> Product Image
        </h4>
        <div className="grid gap-3">
          {imagePreview || formData.imageUrl ? (
            <div className="relative w-full h-40 rounded-xl overflow-hidden border border-glass-border">
              <img src={imagePreview || formData.imageUrl} alt="Product preview" className="w-full h-full object-cover" />
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

      {/* Section 3: Pricing & Quantity */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
          <IndianRupee className="h-4 w-4" /> Pricing & Quantity
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label className="text-foreground text-xs">Price per Unit (₹) *</Label>
            <Input type="number" className="glass-input text-foreground" placeholder="500" value={formData.pricePerUnit} onChange={e => setFormData((p: any) => ({ ...p, pricePerUnit: e.target.value }))} />
          </div>
          <div className="grid gap-2">
            <Label className="text-foreground text-xs">Unit *</Label>
            <Select value={formData.unit} onValueChange={v => setFormData((p: any) => ({ ...p, unit: v }))}>
              <SelectTrigger className="glass-input text-foreground"><SelectValue /></SelectTrigger>
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
            <Input type="number" className="glass-input text-foreground" placeholder="100" value={formData.quantity} onChange={e => setFormData((p: any) => ({ ...p, quantity: e.target.value }))} />
          </div>
          <div className="grid gap-2">
            <Label className="text-foreground text-xs">Min Order Qty</Label>
            <Input type="number" className="glass-input text-foreground" placeholder="10" value={formData.minOrderQty} onChange={e => setFormData((p: any) => ({ ...p, minOrderQty: e.target.value }))} />
          </div>
        </div>
      </div>

      <div className="border-t border-glass-border" />

      {/* Section 4: Location */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
          <MapPin className="h-4 w-4" /> Location
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label className="text-foreground text-xs">Location *</Label>
            <Input className="glass-input text-foreground" placeholder="e.g. Nashik" value={formData.location} onChange={e => setFormData((p: any) => ({ ...p, location: e.target.value }))} />
          </div>
          <div className="grid gap-2">
            <Label className="text-foreground text-xs">State</Label>
            <Input className="glass-input text-foreground" placeholder="e.g. Maharashtra" value={formData.state} onChange={e => setFormData((p: any) => ({ ...p, state: e.target.value }))} />
          </div>
        </div>
      </div>

      <div className="border-t border-glass-border" />

      {/* Section 5: Crop Details */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
          <Leaf className="h-4 w-4" /> Crop Details
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label className="text-foreground text-xs">Crop Variety</Label>
            <Input className="glass-input text-foreground" placeholder="e.g. 1121, Alphonso" value={formData.cropVariety} onChange={e => setFormData((p: any) => ({ ...p, cropVariety: e.target.value }))} />
          </div>
          <div className="grid gap-2">
            <Label className="text-foreground text-xs">Harvest Date</Label>
            <Input type="date" className="glass-input text-foreground" value={formData.harvestDate} onChange={e => setFormData((p: any) => ({ ...p, harvestDate: e.target.value }))} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label className="text-foreground text-xs">Freshness</Label>
            <Select value={formData.freshness} onValueChange={v => setFormData((p: any) => ({ ...p, freshness: v }))}>
              <SelectTrigger className="glass-input text-foreground"><SelectValue placeholder="Select" /></SelectTrigger>
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
                onCheckedChange={(checked) => setFormData((p: any) => ({ ...p, isOrganic: checked }))}
              />
              <span className="text-sm text-foreground">{formData.isOrganic ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label className="text-foreground text-xs">Pesticides Used</Label>
            <Input className="glass-input text-foreground" placeholder="e.g. Neem-based" value={formData.pesticidesUsed} onChange={e => setFormData((p: any) => ({ ...p, pesticidesUsed: e.target.value }))} />
          </div>
          <div className="grid gap-2">
            <Label className="text-foreground text-xs">Moisture Content</Label>
            <Input className="glass-input text-foreground" placeholder="e.g. 12%" value={formData.moistureContent} onChange={e => setFormData((p: any) => ({ ...p, moistureContent: e.target.value }))} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label className="text-foreground text-xs">Shelf Life</Label>
            <Input className="glass-input text-foreground" placeholder="e.g. 6 months" value={formData.shelfLife} onChange={e => setFormData((p: any) => ({ ...p, shelfLife: e.target.value }))} />
          </div>
          <div className="grid gap-2">
            <Label className="text-foreground text-xs">Storage Condition</Label>
            <Input className="glass-input text-foreground" placeholder="e.g. Cool, dry place" value={formData.storageCondition} onChange={e => setFormData((p: any) => ({ ...p, storageCondition: e.target.value }))} />
          </div>
        </div>
      </div>

      <div className="border-t border-glass-border" />

      {/* Section 6: Certifications */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
          <Shield className="h-4 w-4" /> Certifications
        </h4>
        <div className="grid gap-2">
          <Label className="text-foreground text-xs">Product Certifications</Label>
          <Input className="glass-input text-foreground" placeholder="e.g. FSSAI, APEDA, Organic India (comma separated)" value={formData.certifications} onChange={e => setFormData((p: any) => ({ ...p, certifications: e.target.value }))} />
        </div>
      </div>

      <div className="border-t border-glass-border" />

      {/* Section 7: Description */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
          <FileText className="h-4 w-4" /> Description
        </h4>
        <div className="grid gap-2">
          <Textarea className="glass-input text-foreground min-h-[80px]" placeholder="Describe your product..." value={formData.description} onChange={e => setFormData((p: any) => ({ ...p, description: e.target.value }))} />
        </div>
      </div>
    </div>
  )
}

export function ProducerDashboard({ tab }: ProducerDashboardProps) {
  const { user, setChatOpen, setActiveChatUser, setDashboardTab } = useAppStore()
  const [orders, setOrders] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [addListingOpen, setAddListingOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '', category: '', description: '', quantity: '', unit: 'kg',
    pricePerUnit: '', minOrderQty: '', location: '', state: '', qualityGrade: 'A',
    imageUrl: '', cropVariety: '', harvestDate: '', freshness: '',
    isOrganic: false, pesticidesUsed: '', moistureContent: '', shelfLife: '',
    storageCondition: '', certifications: '',
  })

  // Shipment data for transport details
  const [shipments, setShipments] = useState<any[]>([])
  const [trackingShipment, setTrackingShipment] = useState<any>(null)
  const [trackerOpen, setTrackerOpen] = useState(false)

  const fetchData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const [ordersRes, productsRes] = await Promise.all([
        fetch(`/api/orders?userId=${user.id}&role=producer`),
        fetch(`/api/products?sellerId=${user.id}`)
      ])
      const ordersData = await ordersRes.json()
      const productsData = await productsRes.json()
      if (ordersData.orders) setOrders(ordersData.orders)
      if (productsData.products) setProducts(productsData.products)

      // Fetch shipments related to this producer's orders
      const shipRes = await fetch('/api/shipments')
      const shipData = await shipRes.json()
      const allShipments = shipData.shipments || []
      // Filter shipments that belong to this producer's orders
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

  const resetFormData = () => {
    setFormData({
      name: '', category: '', description: '', quantity: '', unit: 'kg',
      pricePerUnit: '', minOrderQty: '', location: '', state: '', qualityGrade: 'A',
      imageUrl: '', cropVariety: '', harvestDate: '', freshness: '',
      isOrganic: false, pesticidesUsed: '', moistureContent: '', shelfLife: '',
      storageCondition: '', certifications: '',
    })
  }

  const handleAddListing = async () => {
    if (!user) return
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sellerId: user.id, ...formData })
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
        body: JSON.stringify({ orderId, status })
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

  // Get shipment for a specific order
  const getShipmentForOrder = (orderId: string) => {
    return shipments.find((s: any) => s.orderId === orderId)
  }

  const activeListings = products.filter(p => p.isActive).length
  const totalOrders = orders.length
  const revenue = orders.filter(o => o.status === 'delivered').reduce((s, o) => s + (o.totalPrice || 0), 0)
  const avgRating = 4.7

  if (tab === 'overview') {
    return (
      <div className="space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<Package className="h-5 w-5" />} value={String(activeListings)} label="Active Listings" trend="+12%" trendUp />
          <StatCard icon={<ShoppingCart className="h-5 w-5" />} value={String(totalOrders)} label="Total Orders" trend="+8%" trendUp />
          <StatCard icon={<IndianRupee className="h-5 w-5" />} value={`₹${(revenue / 1000).toFixed(0)}K`} label="Revenue" trend="+24%" trendUp />
          <StatCard icon={<Star className="h-5 w-5" />} value={avgRating.toFixed(1)} label="Avg Rating" trend="+0.3" trendUp />
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
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickFormatter={(v) => `₹${v / 1000}K`} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(15,15,30,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                  formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#revenueGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent orders */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Recent Orders</h3>
            <Button variant="ghost" size="sm" className="text-emerald-400 hover:text-emerald-300" onClick={() => setDashboardTab('orders')}>
              View All
            </Button>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
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
                    <TableCell className="font-medium text-foreground">{order.product?.name || 'N/A'}</TableCell>
                    <TableCell className="text-muted-foreground">{order.buyer?.name || order.buyer?.companyName || 'N/A'}</TableCell>
                    <TableCell className="text-muted-foreground">{order.quantity} {order.product?.unit || ''}</TableCell>
                    <TableCell className="text-emerald-400 font-medium">₹{order.totalPrice?.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={`${statusColors[order.status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'} border text-xs`}>
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
          <Button className="bg-emerald-600 hover:bg-emerald-500 gap-2" onClick={() => { setAddListingOpen(true) }}>
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
              <DialogDescription className="text-muted-foreground">Create a new product listing for the marketplace</DialogDescription>
            </DialogHeader>
            <AddListingForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleAddListing}
              onCancel={() => setAddListingOpen(false)}
              isSubmitting={isSubmitting}
            />
            <DialogFooter>
              <Button variant="outline" className="border-glass-border" onClick={() => setAddListingOpen(false)}>Cancel</Button>
              <Button className="bg-emerald-600 hover:bg-emerald-500" onClick={handleAddListing} disabled={isSubmitting}>
                {isSubmitting ? (
                  <><span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" /> Creating...</>
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
                <DialogDescription className="text-muted-foreground">Create a new product listing</DialogDescription>
              </DialogHeader>
              <AddListingForm
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleAddListing}
                onCancel={() => setAddListingOpen(false)}
                isSubmitting={isSubmitting}
              />
              <DialogFooter>
                <Button variant="outline" className="border-glass-border" onClick={() => setAddListingOpen(false)}>Cancel</Button>
                <Button className="bg-emerald-600 hover:bg-emerald-500" onClick={handleAddListing} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <><span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" /> Creating...</>
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
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-48 rounded-2xl" />)}
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
                {product.imageUrl ? (
                  <div className="w-full h-32 rounded-xl overflow-hidden border border-glass-border">
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                ) : null}
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-foreground">{product.name}</h4>
                    <p className="text-xs text-muted-foreground capitalize">{product.category}</p>
                  </div>
                  <Badge className={`${product.isActive ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'} border text-xs`}>
                    {product.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price</span>
                    <span className="text-emerald-400 font-medium">₹{product.pricePerUnit}/{product.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Quantity</span>
                    <span className="text-foreground">{product.quantity} {product.unit}</span>
                  </div>
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
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground w-full gap-2">
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

  if (tab === 'orders') {
    return (
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-foreground">Orders</h3>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
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
              const hasTransport = shipment && shipment.transporterId && ['assigned', 'picked_up', 'in_transit', 'delivered'].includes(shipment.status)
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
                      <h4 className="font-semibold text-foreground">{order.product?.name || 'N/A'}</h4>
                      <p className="text-xs text-muted-foreground">
                        Buyer: {order.buyer?.name || order.buyer?.companyName || 'N/A'} • {order.quantity} {order.product?.unit || ''} • ₹{order.totalPrice?.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`${statusColors[order.status] || ''} border text-xs`}>
                        {order.status}
                      </Badge>
                      {order.status === 'negotiating' && (
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10" onClick={() => handleOrderAction(order.id, 'confirmed')}>
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={() => handleOrderAction(order.id, 'cancelled')}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expected Pickup Date - prominent display */}
                  {hasTransport && shipment.expectedPickupDate && (
                    <div className="glass-card p-3 border border-amber-500/20 bg-amber-500/5">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-5 w-5 text-amber-400" />
                        <div>
                          <p className="text-xs text-muted-foreground">Expected Pickup Date</p>
                          <p className="text-sm font-bold text-amber-400">
                            {new Date(shipment.expectedPickupDate).toLocaleDateString('en-IN', {
                              weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
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
                        <Badge className={`${shipmentStatusColors[shipment.status] || ''} border text-[10px] ml-auto`}>
                          {shipment.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                        {/* Transport Company */}
                        <div>
                          <p className="text-muted-foreground text-[10px]">Company</p>
                          <p className="text-foreground font-medium text-xs">
                            {shipment.transporter?.companyName || shipment.transporter?.name || 'N/A'}
                          </p>
                        </div>
                        {/* Driver */}
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
                        {/* Vehicle */}
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
                        {/* Pickup Location */}
                        <div>
                          <p className="text-muted-foreground text-[10px]">Pickup</p>
                          <p className="text-foreground font-medium text-xs flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-emerald-400" />
                            {shipment.exactPickupAddress || shipment.origin}
                          </p>
                        </div>
                        {/* Drop-off Location */}
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
      </div>
    )
  }

  if (tab === 'messages') {
    const conversations = orders.reduce((acc: any[], order) => {
      const buyerId = order.buyer?.id
      if (buyerId && !acc.find(c => c.id === buyerId)) {
        acc.push({ id: buyerId, name: order.buyer?.name || order.buyer?.companyName || 'Unknown', lastOrder: order.product?.name })
      }
      return acc
    }, [])

    return (
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-foreground">Messages</h3>
        {conversations.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No conversations yet. Start trading to connect with buyers!</p>
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
                onClick={() => { setActiveChatUser(conv.id); setChatOpen(true) }}
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

  // Default: profile tab
  return (
    <div className="glass-card p-6 text-center">
      <User className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-foreground mb-2">Profile Settings</h3>
      <p className="text-muted-foreground mb-4">Manage your account details and verification status</p>
      <Button className="bg-emerald-600 hover:bg-emerald-500 gap-2" onClick={() => useAppStore.getState().setView('profile')}>
        <User className="h-4 w-4" /> Go to Profile
      </Button>
    </div>
  )
}
