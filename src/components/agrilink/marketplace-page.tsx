'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Search,
  SlidersHorizontal,
  MapPin,
  Shield,
  BadgeCheck,
  MessageSquare,
  ShoppingCart,
  Package,
  X,
  IndianRupee,
  Filter,
  RotateCcw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
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
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Seller {
  id: string
  name: string
  companyName?: string
  verificationStatus: string
  state?: string
  city?: string
}

interface Product {
  id: string
  sellerId: string
  category: string
  name: string
  description?: string
  quantity: number
  unit: string
  pricePerUnit: number
  minOrderQty?: number
  location: string
  state?: string
  qualityGrade?: string
  images?: string
  isActive: boolean
  createdAt: string
  seller: Seller
}

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'grains', label: 'Grains' },
  { key: 'vegetables', label: 'Vegetables' },
  { key: 'fruits', label: 'Fruits' },
  { key: 'spices', label: 'Spices' },
  { key: 'dairy', label: 'Dairy' },
  { key: 'poultry', label: 'Poultry' },
  { key: 'pulses', label: 'Pulses' },
  { key: 'oilseeds', label: 'Oilseeds' },
] as const

const CATEGORY_COLORS: Record<string, string> = {
  grains: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  vegetables: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  fruits: 'bg-rose-500/15 text-rose-400 border-rose-500/25',
  spices: 'bg-orange-500/15 text-orange-400 border-orange-500/25',
  dairy: 'bg-sky-500/15 text-sky-400 border-sky-500/25',
  poultry: 'bg-lime-500/15 text-lime-400 border-lime-500/25',
  pulses: 'bg-violet-500/15 text-violet-400 border-violet-500/25',
  oilseeds: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
}

const GRADE_COLORS: Record<string, string> = {
  A: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  B: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  C: 'bg-red-500/15 text-red-400 border-red-500/25',
}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi',
]

// ─── Animation Variants ───────────────────────────────────────────────────────
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
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

// ─── Product Card Skeleton ────────────────────────────────────────────────────
function ProductCardSkeleton() {
  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-start justify-between">
        <Skeleton className="h-5 w-20 rounded-lg" />
        <Skeleton className="h-5 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-6 w-3/4 rounded-lg" />
      <div className="space-y-2">
        <Skeleton className="h-5 w-24 rounded-lg" />
        <Skeleton className="h-4 w-32 rounded-lg" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-20 rounded" />
        <Skeleton className="h-4 w-16 rounded" />
      </div>
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-9 flex-1 rounded-xl" />
        <Skeleton className="h-9 flex-1 rounded-xl" />
      </div>
    </div>
  )
}

// ─── Product Card ─────────────────────────────────────────────────────────────
function ProductCard({
  product,
  onContact,
  onOrder,
}: {
  product: Product
  onContact: (p: Product) => void
  onOrder: (p: Product) => void
}) {
  const { setSelectedProductId, setView } = useAppStore()
  const catColor = CATEGORY_COLORS[product.category] || 'bg-gray-500/15 text-gray-400 border-gray-500/25'
  const gradeColor = GRADE_COLORS[product.qualityGrade || ''] || 'bg-gray-500/15 text-gray-400 border-gray-500/25'

  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -4, transition: { duration: 0.25 } }}
      className="glass-card p-5 hover:bg-white/[0.07] transition-all duration-300 group cursor-pointer"
      onClick={() => {
        setSelectedProductId(product.id)
        setView('product')
      }}
    >
      {/* Top badges */}
      <div className="flex items-start justify-between mb-3">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${catColor}`}>
          {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
        </span>
        {product.qualityGrade && (
          <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${gradeColor}`}>
            {product.qualityGrade}
          </span>
        )}
      </div>

      {/* Name */}
      <h3 className="text-base font-semibold text-foreground leading-tight group-hover:text-emerald-400 transition-colors mb-2">
        {product.name}
      </h3>

      {/* Price */}
      <div className="flex items-baseline gap-1 mb-2">
        <IndianRupee className="w-3.5 h-3.5 text-emerald-400" />
        <span className="text-xl font-bold text-foreground">
          {product.pricePerUnit.toLocaleString('en-IN')}
        </span>
        <span className="text-xs text-muted-foreground">/ {product.unit}</span>
      </div>

      {/* Quantity */}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1.5">
        <Package className="w-3.5 h-3.5" />
        <span>{product.quantity.toLocaleString('en-IN')} {product.unit} available</span>
      </div>

      {/* Location */}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
        <MapPin className="w-3.5 h-3.5 text-emerald-400" />
        <span>{product.location}{product.state ? `, ${product.state}` : ''}</span>
      </div>

      {/* Seller */}
      <div className="flex items-center gap-2 pt-3 border-t border-white/5 mb-3">
        <div className="w-7 h-7 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-emerald-400">
            {(product.seller.name || product.seller.companyName || '?')[0].toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-foreground truncate">
            {product.seller.companyName || product.seller.name}
          </p>
        </div>
        {product.seller.verificationStatus === 'verified' && (
          <BadgeCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 h-9 text-xs border-white/10 hover:bg-white/5 hover:border-white/20"
          onClick={(e) => {
            e.stopPropagation()
            onContact(product)
          }}
        >
          <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
          Contact
        </Button>
        <Button
          size="sm"
          className="flex-1 h-9 text-xs bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20"
          onClick={(e) => {
            e.stopPropagation()
            onOrder(product)
          }}
        >
          <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
          Order
        </Button>
      </div>
    </motion.div>
  )
}

// ─── Filter Sidebar ───────────────────────────────────────────────────────────
function FilterSidebar({
  filters,
  setFilters,
  onApply,
  onReset,
}: {
  filters: { state: string; grade: string; priceRange: number[]; verifiedOnly: boolean }
  setFilters: React.Dispatch<React.SetStateAction<typeof filters>>
  onApply: () => void
  onReset: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-card p-5 space-y-6 sticky top-24"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Filter className="w-4 h-4 text-emerald-400" />
          Filters
        </h3>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-muted-foreground hover:text-foreground"
          onClick={onReset}
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          Reset
        </Button>
      </div>

      {/* State filter */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Location / State</Label>
        <Select
          value={filters.state}
          onValueChange={(v) => setFilters((f) => ({ ...f, state: v === '_all' ? '' : v }))}
        >
          <SelectTrigger className="h-9 text-xs bg-white/5 border-white/10">
            <SelectValue placeholder="All States" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-white/10">
            <SelectItem value="_all" className="text-xs">All States</SelectItem>
            {INDIAN_STATES.map((s) => (
              <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grade filter */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Quality Grade</Label>
        <Select
          value={filters.grade}
          onValueChange={(v) => setFilters((f) => ({ ...f, grade: v === '_all' ? '' : v }))}
        >
          <SelectTrigger className="h-9 text-xs bg-white/5 border-white/10">
            <SelectValue placeholder="All Grades" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-white/10">
            <SelectItem value="_all" className="text-xs">All Grades</SelectItem>
            <SelectItem value="A" className="text-xs">Grade A</SelectItem>
            <SelectItem value="B" className="text-xs">Grade B</SelectItem>
            <SelectItem value="C" className="text-xs">Grade C</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Price range */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">
          Max Price: ₹{filters.priceRange[0].toLocaleString('en-IN')}
        </Label>
        <Slider
          value={filters.priceRange}
          onValueChange={(v) => setFilters((f) => ({ ...f, priceRange: v }))}
          max={50000}
          min={0}
          step={500}
          className="py-2"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>₹0</span>
          <span>₹50,000</span>
        </div>
      </div>

      {/* Verified only */}
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          Verified Sellers Only
        </Label>
        <Switch
          checked={filters.verifiedOnly}
          onCheckedChange={(v) => setFilters((f) => ({ ...f, verifiedOnly: v }))}
        />
      </div>

      <Button
        onClick={onApply}
        className="w-full bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20"
      >
        Apply Filters
      </Button>
    </motion.div>
  )
}

// ─── Product Detail Dialog ────────────────────────────────────────────────────
function ProductDetailDialog({
  product,
  open,
  onClose,
  onOrder,
  onMessage,
}: {
  product: Product | null
  open: boolean
  onClose: () => void
  onOrder: (product: Product, qty: number) => void
  onMessage: (product: Product) => void
}) {
  const [qty, setQty] = useState(1)

  if (!product) return null

  const totalPrice = qty * product.pricePerUnit
  const catColor = CATEGORY_COLORS[product.category] || 'bg-gray-500/15 text-gray-400 border-gray-500/25'
  const gradeColor = GRADE_COLORS[product.qualityGrade || ''] || 'bg-gray-500/15 text-gray-400 border-gray-500/25'

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[oklch(0.15_0.012_260/0.95)] border-white/20 backdrop-blur-xl max-w-lg p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${catColor}`}>
                  {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
                </span>
                {product.qualityGrade && (
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${gradeColor}`}>
                    Grade {product.qualityGrade}
                  </span>
                )}
              </div>
              <DialogTitle className="text-xl font-bold text-foreground">
                {product.name}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {product.description || 'No description provided.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-4">
          {/* Price */}
          <div className="flex items-baseline gap-1.5">
            <IndianRupee className="w-5 h-5 text-emerald-400" />
            <span className="text-2xl font-bold text-foreground">
              {product.pricePerUnit.toLocaleString('en-IN')}
            </span>
            <span className="text-sm text-muted-foreground">/ {product.unit}</span>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="glass-card p-3">
              <p className="text-xs text-muted-foreground mb-1">Available</p>
              <p className="text-sm font-semibold text-foreground">
                {product.quantity.toLocaleString('en-IN')} {product.unit}
              </p>
            </div>
            <div className="glass-card p-3">
              <p className="text-xs text-muted-foreground mb-1">Min. Order</p>
              <p className="text-sm font-semibold text-foreground">
                {product.minOrderQty || 1} {product.unit}
              </p>
            </div>
            <div className="glass-card p-3">
              <p className="text-xs text-muted-foreground mb-1">Location</p>
              <p className="text-sm font-semibold text-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-400" />
                {product.location}
              </p>
            </div>
            <div className="glass-card p-3">
              <p className="text-xs text-muted-foreground mb-1">Listed</p>
              <p className="text-sm font-semibold text-foreground">
                {new Date(product.createdAt).toLocaleDateString('en-IN')}
              </p>
            </div>
          </div>

          {/* Seller info */}
          <div className="glass-card p-4">
            <p className="text-xs text-muted-foreground mb-2">Seller</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-emerald-400">
                  {(product.seller.name || product.seller.companyName || '?')[0].toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {product.seller.companyName || product.seller.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {product.seller.city && product.seller.state
                    ? `${product.seller.city}, ${product.seller.state}`
                    : product.seller.state || 'India'}
                </p>
              </div>
              {product.seller.verificationStatus === 'verified' && (
                <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/25 text-xs">
                  <BadgeCheck className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
          </div>

          {/* Order form */}
          <div className="glass-card p-4">
            <Label className="text-xs text-muted-foreground mb-2 block">Place Order</Label>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Input
                  type="number"
                  min={product.minOrderQty || 1}
                  max={product.quantity}
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
                  className="h-10 bg-white/5 border-white/10 text-sm"
                />
              </div>
              <span className="text-xs text-muted-foreground">{product.unit}</span>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-lg font-bold text-emerald-400">
                  ₹{totalPrice.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 pt-0 gap-2">
          <Button
            variant="outline"
            className="flex-1 border-white/10 hover:bg-white/5 hover:border-white/20"
            onClick={() => onMessage(product)}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Message Seller
          </Button>
          <Button
            className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20"
            onClick={() => onOrder(product, qty)}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Place Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Marketplace Page ────────────────────────────────────────────────────
export function MarketplacePage() {
  const { setView, user, marketplaceCategory, setMarketplaceCategory, marketplaceSearch, setMarketplaceSearch, setChatOpen, setActiveChatUser } = useAppStore()

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [searchInput, setSearchInput] = useState(marketplaceSearch)
  const [ordering, setOrdering] = useState(false)

  const [filters, setFilters] = useState({
    state: '',
    grade: '',
    priceRange: [50000] as number[],
    verifiedOnly: false,
  })

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (marketplaceCategory !== 'all') params.set('category', marketplaceCategory)
      if (marketplaceSearch) params.set('search', marketplaceSearch)
      if (filters.state) params.set('state', filters.state)
      if (filters.grade) params.set('grade', filters.grade)

      const res = await fetch(`/api/products?${params.toString()}`)
      const data = await res.json()

      let filtered = data.products || []

      // Client-side price range filter
      if (filters.priceRange[0] < 50000) {
        filtered = filtered.filter((p: Product) => p.pricePerUnit <= filters.priceRange[0])
      }

      // Client-side verified-only filter
      if (filters.verifiedOnly) {
        filtered = filtered.filter((p: Product) => p.seller.verificationStatus === 'verified')
      }

      setProducts(filtered)
    } catch {
      toast.error('Failed to load products')
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [marketplaceCategory, marketplaceSearch, filters])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Handle search
  const handleSearch = () => {
    setMarketplaceSearch(searchInput)
  }

  // Handle contact supplier
  const handleContact = (product: Product) => {
    setActiveChatUser(product.seller.id)
    setChatOpen(true)
    toast.success(`Chat opened with ${product.seller.companyName || product.seller.name}`)
  }

  // Handle place order
  const handleOrder = async (product: Product, qty: number) => {
    if (!user) {
      toast.error('Please sign in to place an order')
      setView('auth')
      return
    }
    if (user.role !== 'buyer' && user.role !== 'admin') {
      toast.error('Only buyers can place orders')
      return
    }

    setOrdering(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerId: user.id,
          sellerId: product.sellerId,
          productId: product.id,
          quantity: qty,
          unitPrice: product.pricePerUnit,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Order placed for ${qty} ${product.unit} of ${product.name}`)
        setDetailOpen(false)
      } else {
        toast.error(data.error || 'Failed to place order')
      }
    } catch {
      toast.error('Failed to place order')
    } finally {
      setOrdering(false)
    }
  }

  const resetFilters = () => {
    setFilters({ state: '', grade: '', priceRange: [50000], verifiedOnly: false })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 -left-20 w-72 h-72 bg-amber-500/4 rounded-full blur-[100px]" />
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
            <h1 className="text-lg font-bold text-foreground">Agricultural Marketplace</h1>
          </div>

          {/* Search bar */}
          <div className="hidden sm:flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search products..."
                className="pl-9 h-9 bg-white/5 border-white/10 text-sm"
              />
            </div>
            <Button
              size="sm"
              className="h-9 bg-emerald-500 hover:bg-emerald-400 text-white"
              onClick={handleSearch}
            >
              <Search className="w-4 h-4" />
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="hidden lg:flex border-white/10 hover:bg-white/5 h-9"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="w-4 h-4 mr-1.5" />
            Filters
          </Button>
        </motion.div>

        {/* Mobile search */}
        <div className="sm:hidden px-4 mt-3 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search products..."
              className="pl-9 h-9 bg-white/5 border-white/10 text-sm"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-9 border-white/10 hover:bg-white/5"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </Button>
        </div>

        {/* Category Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="px-4 sm:px-6 mt-4 overflow-x-auto"
        >
          <div className="flex items-center gap-2 pb-2 min-w-max">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setMarketplaceCategory(cat.key)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  marketplaceCategory === cat.key
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                    : 'bg-white/5 border border-white/10 text-muted-foreground hover:bg-white/10 hover:text-foreground'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="px-4 sm:px-6 mt-6 flex gap-6">
          {/* Filter Sidebar (desktop) */}
          {showFilters && (
            <div className="hidden lg:block w-72 shrink-0">
              <FilterSidebar
                filters={filters}
                setFilters={setFilters}
                onApply={fetchProducts}
                onReset={resetFilters}
              />
            </div>
          )}

          {/* Mobile Filter Sheet */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 lg:hidden"
              >
                <div className="absolute inset-0 bg-black/60" onClick={() => setShowFilters(false)} />
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  className="absolute right-0 top-0 bottom-0 w-80 bg-background border-l border-white/10 p-4 overflow-y-auto"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-foreground">Filters</h3>
                    <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <FilterSidebar
                    filters={filters}
                    setFilters={setFilters}
                    onApply={() => {
                      fetchProducts()
                      setShowFilters(false)
                    }}
                    onReset={resetFilters}
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Product Grid */}
          <div className="flex-1 min-w-0">
            {/* Results count */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {loading ? 'Loading...' : `${products.length} product${products.length !== 1 ? 's' : ''} found`}
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-12 text-center"
              >
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Products Found</h3>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your filters or search query.
                </p>
              </motion.div>
            ) : (
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                key={`${marketplaceCategory}-${marketplaceSearch}`}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onContact={handleContact}
                    onOrder={(p) => {
                      setSelectedProduct(p)
                      setDetailOpen(true)
                    }}
                  />
                ))}
              </motion.div>
            )}
          </div>
        </div>

        {/* Bottom spacing */}
        <div className="h-16" />
      </div>

      {/* Product Detail Dialog */}
      <ProductDetailDialog
        key={selectedProduct?.id || 'none'}
        product={selectedProduct}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onOrder={(product, qty) => handleOrder(product, qty)}
        onMessage={(product) => {
          handleContact(product)
          setDetailOpen(false)
        }}
      />
    </div>
  )
}
