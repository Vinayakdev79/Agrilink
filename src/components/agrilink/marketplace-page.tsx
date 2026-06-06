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
  imageUrl?: string
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

const CATEGORY_GRADIENTS: Record<string, string> = {
  grains: 'from-amber-900/40 to-amber-700/20',
  vegetables: 'from-emerald-900/40 to-emerald-700/20',
  fruits: 'from-rose-900/40 to-rose-700/20',
  spices: 'from-orange-900/40 to-orange-700/20',
  dairy: 'from-sky-900/40 to-sky-700/20',
  poultry: 'from-lime-900/40 to-lime-700/20',
  pulses: 'from-violet-900/40 to-violet-700/20',
  oilseeds: 'from-yellow-900/40 to-yellow-700/20',
}

const CATEGORY_ICONS: Record<string, string> = {
  grains: '🌾',
  vegetables: '🥬',
  fruits: '🥭',
  spices: '🌶️',
  dairy: '🥛',
  poultry: '🍗',
  pulses: '🫘',
  oilseeds: '🌻',
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
    <div className="glass-card overflow-hidden">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="p-4 space-y-3">
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
    </div>
  )
}

// ─── Product Card ─────────────────────────────────────────────────────────────
function ProductCard({
  product,
  onContact,
}: {
  product: Product
  onContact: (p: Product) => void
}) {
  const { setSelectedProductId, setView, addToCart, cart, setCartOpen, user } = useAppStore()
  const catColor = CATEGORY_COLORS[product.category] || 'bg-gray-500/15 text-gray-400 border-gray-500/25'
  const gradeColor = GRADE_COLORS[product.qualityGrade || ''] || 'bg-gray-500/15 text-gray-400 border-gray-500/25'
  const gradient = CATEGORY_GRADIENTS[product.category] || 'from-gray-900/40 to-gray-700/20'
  const emoji = CATEGORY_ICONS[product.category] || '📦'

  // Parse product image
  const productImage = product.imageUrl || (product.images ? product.images.split(',')[0] : null)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user) {
      toast.error('Please sign in to add items to cart')
      return
    }
    if (user.role !== 'buyer' && user.role !== 'admin') {
      toast.error('Only buyers can add items to cart')
      return
    }

    addToCart({
      productId: product.id,
      productName: product.name,
      productImage: productImage || undefined,
      sellerId: product.sellerId,
      sellerName: product.seller.companyName || product.seller.name,
      quantity: product.minOrderQty || 1,
      unit: product.unit,
      pricePerUnit: product.pricePerUnit,
      minOrderQty: product.minOrderQty || 1,
      maxQuantity: product.quantity,
      location: product.location,
      state: product.state,
    })
    toast.success(`${product.name} added to cart`)
  }

  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -4, transition: { duration: 0.25 } }}
      className="glass-card overflow-hidden hover:bg-white/[0.07] transition-all duration-300 group cursor-pointer flex flex-col"
      onClick={() => {
        setSelectedProductId(product.id)
        setView('product')
      }}
    >
      {/* Product Image / Placeholder */}
      <div className="aspect-[4/3] relative overflow-hidden">
        {productImage ? (
          <img
            src={productImage}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none'
              const parent = (e.target as HTMLImageElement).parentElement
              if (parent) {
                parent.classList.add('bg-gradient-to-br', gradient)
                parent.innerHTML = `<span class="text-5xl">${emoji}</span>`
                parent.style.display = 'flex'
                parent.style.alignItems = 'center'
                parent.style.justifyContent = 'center'
              }
            }}
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
            <span className="text-5xl">{emoji}</span>
          </div>
        )}

        {/* Top badges overlay */}
        <div className="absolute top-2 left-2 right-2 flex items-start justify-between">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border backdrop-blur-sm ${catColor}`}>
            {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
          </span>
          {product.qualityGrade && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border backdrop-blur-sm ${gradeColor}`}>
              {product.qualityGrade}
            </span>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex flex-col flex-1">
        {/* Name */}
        <h3 className="text-sm font-semibold text-foreground leading-tight group-hover:text-emerald-400 transition-colors mb-2">
          {product.name}
        </h3>

        {/* Price */}
        <div className="flex items-baseline gap-1 mb-2">
          <IndianRupee className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-lg font-bold text-foreground">
            {product.pricePerUnit.toLocaleString('en-IN')}
          </span>
          <span className="text-xs text-muted-foreground">/ {product.unit}</span>
        </div>

        {/* Quantity */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
          <Package className="w-3 h-3" />
          <span>{product.quantity.toLocaleString('en-IN')} {product.unit} available</span>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
          <MapPin className="w-3 h-3 text-emerald-400" />
          <span>{product.location}{product.state ? `, ${product.state}` : ''}</span>
        </div>

        {/* Seller */}
        <div className="flex items-center gap-2 pt-2 border-t border-white/5 mb-3">
          <div className="w-6 h-6 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-bold text-emerald-400">
              {(product.seller.name || product.seller.companyName || '?')[0].toUpperCase()}
            </span>
          </div>
          <p className="text-xs font-medium text-foreground truncate flex-1">
            {product.seller.companyName || product.seller.name}
          </p>
          {product.seller.verificationStatus === 'verified' && (
            <BadgeCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-auto">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-8 text-xs border-white/10 hover:bg-white/5 hover:border-white/20"
            onClick={(e) => {
              e.stopPropagation()
              onContact(product)
            }}
          >
            <MessageSquare className="w-3 h-3 mr-1" />
            Contact
          </Button>
          <Button
            size="sm"
            className="flex-1 h-8 text-xs bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20"
            onClick={handleAddToCart}
          >
            <ShoppingCart className="w-3 h-3 mr-1" />
            Add to Cart
          </Button>
        </div>
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

// ─── Main Marketplace Page ────────────────────────────────────────────────────
export function MarketplacePage() {
  const { setView, user, marketplaceCategory, setMarketplaceCategory, marketplaceSearch, setMarketplaceSearch, setChatOpen, setActiveChatUser, setCartOpen, cart } = useAppStore()

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [searchInput, setSearchInput] = useState(marketplaceSearch)

  const [filters, setFilters] = useState({
    state: '',
    grade: '',
    priceRange: [50000] as number[],
    verifiedOnly: false,
  })

  // Cart item count
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

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

          {/* Cart Icon Button */}
          <Button
            variant="outline"
            size="sm"
            className="relative border-white/10 hover:bg-white/5 hover:border-white/20 h-9 w-9 p-0"
            onClick={() => setCartOpen(true)}
          >
            <ShoppingCart className="w-4 h-4" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 size-4 flex items-center justify-center rounded-full bg-emerald-500 text-white text-[10px] font-bold">
                {cartItemCount > 99 ? '99+' : cartItemCount}
              </span>
            )}
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
                  />
                ))}
              </motion.div>
            )}
          </div>
        </div>

        {/* Bottom spacing */}
        <div className="h-16" />
      </div>
    </div>
  )
}
