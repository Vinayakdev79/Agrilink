'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { computePlatformFee } from '@/lib/razorpay'
import { toast } from 'sonner'
import {
  ArrowLeft,
  MapPin,
  IndianRupee,
  MessageSquare,
  Share2,
  Star,
  Leaf,
  Package,
  Truck,
  Clock,
  Droplets,
  ThermometerSun,
  Calendar,
  Award,
  CheckCircle2,
  XCircle,
  Minus,
  Plus,
  ShoppingCart,
  ChevronRight,
  Sprout,
  Send,
  AlertTriangle,
  Info,
  User,
  BadgeCheck,
  Eye,
  TrendingUp,
  Phone,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'

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
  harvestDate?: string
  freshness?: string
  cropVariety?: string
  isOrganic?: boolean
  pesticidesUsed?: string
  moistureContent?: string
  shelfLife?: string
  storageCondition?: string
  certifications?: string
  isActive: boolean
  createdAt: string
  seller: Seller
  // V4 delivery handling
  deliveryHandledByProducer?: boolean
  deliveryFee?: number
  freeDelivery?: boolean
  deliveryType?: 'platform' | 'producer' | 'local'
  localTransporterName?: string
  localTransporterPhone?: string
  localTransporterVehicle?: string
}

interface ProducerInfo {
  id: string
  name: string
  email: string
  role: string
  companyName?: string
  phone?: string
  state?: string
  city?: string
  verificationStatus: string
  farmName?: string
  farmSize?: string
  farmLocation?: string
  yearsExperience?: number
  certifications?: string
  totalTransactions?: number
  avgRating?: number
  totalReviews?: number
}

interface Review {
  id: string
  reviewerId: string
  targetId: string
  productId?: string
  rating: number
  comment?: string
  createdAt: string
  reviewer?: { name: string; companyName?: string }
}

// ─── Constants ────────────────────────────────────────────────────────────────
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

const TRANSPORT_ESTIMATE_RATE = 0.035 // 3.5%
const PLATFORM_FEE_RATE = 0.02 // 2%

// ─── Animation Variants ───────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
}

// ─── Stock Bar Component ──────────────────────────────────────────────────────
function StockBar({ quantity, maxRef = 500 }: { quantity: number; maxRef?: number }) {
  const pct = Math.min(100, (quantity / maxRef) * 100)
  const barColor = quantity < 10 ? 'bg-red-400' : quantity < 50 ? 'bg-amber-400' : 'bg-emerald-400'
  const glowColor = quantity < 10 ? 'shadow-red-400/40' : quantity < 50 ? 'shadow-amber-400/40' : 'shadow-emerald-400/40'
  return (
    <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
        className={`h-full rounded-full ${barColor} shadow-sm ${glowColor}`}
      />
    </div>
  )
}

// ─── Star Rating Display ──────────────────────────────────────────────────────
function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'w-5 h-5' : size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5'
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClass} ${
            star <= Math.round(rating)
              ? 'text-amber-400 fill-amber-400'
              : 'text-muted-foreground/30'
          }`}
        />
      ))}
    </div>
  )
}

// ─── Interactive Star Rating (for review form) ────────────────────────────────
function InteractiveStarRating({ value, onChange }: { value: number; onChange: (val: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`w-6 h-6 ${
              star <= (hover || value)
                ? 'text-amber-400 fill-amber-400'
                : 'text-muted-foreground/30'
            } transition-colors`}
          />
        </button>
      ))}
      {value > 0 && (
        <span className="text-sm text-muted-foreground ml-2">{value}/5</span>
      )}
    </div>
  )
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────
function ProductPageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 glass-card-strong mx-4 sm:mx-6 mt-4 px-4 sm:px-6 py-3 flex items-center gap-4">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-5 w-40 rounded-lg" />
        <div className="flex-1" />
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <div className="px-4 sm:px-6 mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-4">
          <Skeleton className="aspect-square w-full rounded-xl" />
          <div className="flex gap-2 mt-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-16 rounded-lg" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4 rounded-lg" />
          <Skeleton className="h-10 w-40 rounded-lg" />
          <Skeleton className="h-140 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}

// ─── Similar Product Card (Redesigned) ────────────────────────────────────────
function SimilarProductCard({ product, onClick, onAddToCart }: { product: Product; onClick: () => void; onAddToCart: () => void }) {
  const catColor = CATEGORY_COLORS[product.category] || 'bg-gray-500/15 text-gray-400 border-gray-500/25'
  const gradient = CATEGORY_GRADIENTS[product.category] || 'from-gray-900/40 to-gray-700/20'
  const emoji = CATEGORY_ICONS[product.category] || '📦'
  const productImage = product.imageUrl || (product.images ? product.images.split(',')[0] : null)
  const isLowStock = product.quantity < 10
  const isVerified = product.seller.verificationStatus === 'verified'

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="bg-white/[0.03] border border-white/10 backdrop-blur-sm rounded-2xl overflow-hidden cursor-pointer group relative"
    >
      {/* Hover glow effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-emerald-500/[0.07] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* Image Area */}
      <div className="aspect-[4/3] relative overflow-hidden" onClick={onClick}>
        {productImage ? (
          <img
            src={productImage}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none'
              const parent = (e.target as HTMLImageElement).parentElement
              if (parent) {
                const fallback = parent.querySelector('.img-fallback') as HTMLElement
                if (fallback) fallback.style.display = 'flex'
              }
            }}
          />
        ) : null}
        <div className={`img-fallback w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center ${productImage ? 'hidden' : ''}`}>
          <span className="text-5xl drop-shadow-lg">{emoji}</span>
        </div>

        {/* Overlay gradient at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

        {/* Category Badge */}
        <span className={`absolute top-2.5 left-2.5 text-[10px] font-semibold px-2 py-0.5 rounded-lg border backdrop-blur-md ${catColor}`}>
          {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
        </span>

        {/* Quality Grade */}
        {product.qualityGrade && (
          <span className={`absolute top-2.5 right-2.5 text-[10px] font-bold px-2 py-0.5 rounded-lg border backdrop-blur-md ${GRADE_COLORS[product.qualityGrade] || ''}`}>
            Grade {product.qualityGrade}
          </span>
        )}

        {/* Low Stock Warning */}
        {isLowStock && (
          <span className="absolute bottom-2.5 left-2.5 text-[9px] font-bold px-2 py-0.5 rounded-md bg-red-500/80 text-white backdrop-blur-sm flex items-center gap-1">
            <AlertTriangle className="w-2.5 h-2.5" />
            Low Stock
          </span>
        )}

        {/* Quick View Button on hover */}
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          whileHover={{ scale: 1.1 }}
          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-xl bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/80 hover:text-white hover:bg-black/70 transition-all opacity-0 group-hover:opacity-100 z-10"
          style={product.qualityGrade ? { top: '2.5rem' } : {}}
          onClick={(e) => {
            e.stopPropagation()
            onClick()
          }}
        >
          <Eye className="w-3.5 h-3.5" />
        </motion.button>
      </div>

      {/* Content */}
      <div className="p-3.5 space-y-2.5 relative">
        {/* Product Name */}
        <h4 className="text-sm font-semibold text-foreground truncate leading-tight">{product.name}</h4>

        {/* Price with ₹ symbol */}
        <div className="flex items-baseline gap-1">
          <span className="text-amber-400 font-bold text-base">₹{product.pricePerUnit.toLocaleString('en-IN')}</span>
          <span className="text-[10px] text-muted-foreground font-medium">/ {product.unit}</span>
        </div>

        {/* Available Quantity with Stock Indicator */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Package className={`w-3 h-3 ${isLowStock ? 'text-red-400' : 'text-emerald-400'}`} />
              <span className={`text-[11px] font-semibold ${isLowStock ? 'text-red-400' : 'text-emerald-400'}`}>
                {product.quantity.toLocaleString('en-IN')} {product.unit}
              </span>
            </div>
            {isLowStock && (
              <span className="text-[9px] font-bold text-red-400 flex items-center gap-0.5">
                <AlertTriangle className="w-2.5 h-2.5" />
                Hurry!
              </span>
            )}
          </div>
          <StockBar quantity={product.quantity} />
        </div>

        {/* Producer Name with Avatar */}
        <div className="flex items-center gap-2 pt-0.5">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-500/30 to-emerald-700/30 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <span className="text-[8px] font-bold text-emerald-400">
              {(product.seller.companyName || product.seller.name).charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground truncate flex-1">
            {product.seller.companyName || product.seller.name}
          </span>
          {isVerified && (
            <BadgeCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          )}
        </div>

        {/* Add to Cart Button */}
        <Button
          size="sm"
          className="w-full h-8 text-xs font-semibold bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/20 hover:border-emerald-500/40 transition-all backdrop-blur-sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation()
            onAddToCart()
          }}
        >
          <ShoppingCart className="w-3 h-3 mr-1.5" />
          Add to Cart
        </Button>
      </div>
    </motion.div>
  )
}

// ─── Producer Product Card (Redesigned) ───────────────────────────────────────
function ProducerProductCard({ product, onClick, onAddToCart, producerName, isVerified }: { product: Product; onClick: () => void; onAddToCart: () => void; producerName: string; isVerified: boolean }) {
  const catColor = CATEGORY_COLORS[product.category] || 'bg-gray-500/15 text-gray-400 border-gray-500/25'
  const gradient = CATEGORY_GRADIENTS[product.category] || 'from-gray-900/40 to-gray-700/20'
  const emoji = CATEGORY_ICONS[product.category] || '📦'
  const productImage = product.imageUrl || (product.images ? product.images.split(',')[0] : null)
  const isLowStock = product.quantity < 10

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="bg-white/[0.03] border border-white/10 backdrop-blur-sm rounded-2xl overflow-hidden cursor-pointer group relative"
    >
      {/* Hover glow effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-amber-500/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* Image Area */}
      <div className="aspect-[4/3] relative overflow-hidden" onClick={onClick}>
        {productImage ? (
          <img
            src={productImage}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none'
              const parent = (e.target as HTMLImageElement).parentElement
              if (parent) {
                const fallback = parent.querySelector('.img-fallback') as HTMLElement
                if (fallback) fallback.style.display = 'flex'
              }
            }}
          />
        ) : null}
        <div className={`img-fallback w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center ${productImage ? 'hidden' : ''}`}>
          <span className="text-5xl drop-shadow-lg">{emoji}</span>
        </div>

        {/* Overlay gradient at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

        {/* Category Badge */}
        <span className={`absolute top-2.5 left-2.5 text-[10px] font-semibold px-2 py-0.5 rounded-lg border backdrop-blur-md ${catColor}`}>
          {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
        </span>

        {/* Same Producer Badge */}
        <span className="absolute top-2.5 right-2.5 text-[9px] font-bold px-2 py-0.5 rounded-lg border backdrop-blur-md bg-emerald-500/20 text-emerald-400 border-emerald-500/30 flex items-center gap-1">
          <BadgeCheck className="w-2.5 h-2.5" />
          Same Producer
        </span>

        {/* Low Stock Warning */}
        {isLowStock && (
          <span className="absolute bottom-2.5 left-2.5 text-[9px] font-bold px-2 py-0.5 rounded-md bg-red-500/80 text-white backdrop-blur-sm flex items-center gap-1">
            <AlertTriangle className="w-2.5 h-2.5" />
            Low Stock
          </span>
        )}

        {/* Quick View Button on hover */}
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          whileHover={{ scale: 1.1 }}
          className="absolute bottom-2.5 right-2.5 w-8 h-8 rounded-xl bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/80 hover:text-white hover:bg-black/70 transition-all opacity-0 group-hover:opacity-100 z-10"
          onClick={(e) => {
            e.stopPropagation()
            onClick()
          }}
        >
          <Eye className="w-3.5 h-3.5" />
        </motion.button>
      </div>

      {/* Content */}
      <div className="p-3.5 space-y-2.5 relative">
        {/* Product Name */}
        <h4 className="text-sm font-semibold text-foreground truncate leading-tight">{product.name}</h4>

        {/* Price per unit */}
        <div className="flex items-baseline gap-1">
          <span className="text-amber-400 font-bold text-base">₹{product.pricePerUnit.toLocaleString('en-IN')}</span>
          <span className="text-[10px] text-muted-foreground font-medium">/ {product.unit}</span>
        </div>

        {/* Available Quantity with Stock Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Package className={`w-3 h-3 ${isLowStock ? 'text-red-400' : 'text-emerald-400'}`} />
              <span className={`text-[11px] font-semibold ${isLowStock ? 'text-red-400' : 'text-emerald-400'}`}>
                {product.quantity.toLocaleString('en-IN')} {product.unit} available
              </span>
            </div>
          </div>
          <StockBar quantity={product.quantity} />
        </div>

        {/* Producer Info with Verified Badge */}
        <div className="flex items-center gap-2 pt-0.5">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-500/30 to-emerald-700/30 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <span className="text-[8px] font-bold text-emerald-400">
              {producerName.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground truncate flex-1">
            {producerName}
          </span>
          {isVerified && (
            <div className="flex items-center gap-0.5 shrink-0">
              <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[9px] font-semibold text-emerald-400">Verified</span>
            </div>
          )}
        </div>

        {/* Add to Cart Button */}
        <Button
          size="sm"
          className="w-full h-8 text-xs font-semibold bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/20 hover:border-emerald-500/40 transition-all backdrop-blur-sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation()
            onAddToCart()
          }}
        >
          <ShoppingCart className="w-3 h-3 mr-1.5" />
          Add to Cart
        </Button>
      </div>
    </motion.div>
  )
}

// ─── Main Product Page ────────────────────────────────────────────────────────
export function ProductPage() {
  const {
    selectedProductId,
    setSelectedProductId,
    setView,
    setSelectedProducerId,
    setActiveChatUser,
    setChatOpen,
    user,
    addToCart,
    setCartOpen,
  } = useAppStore()

  const [product, setProduct] = useState<Product | null>(null)
  const [producer, setProducer] = useState<ProducerInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [orderQty, setOrderQty] = useState(1)
  const [selectedImageIdx, setSelectedImageIdx] = useState(0)
  const [sellerProducts, setSellerProducts] = useState<Product[]>([])
  const [similarProducts, setSimilarProducts] = useState<Product[]>([])
  const [reviews, setReviews] = useState<Review[]>([])

  // Review form state
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  // Fetch product by ID
  const fetchProduct = useCallback(async () => {
    if (!selectedProductId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/products?id=${selectedProductId}`)
      const data = await res.json()
      if (res.ok && data.product) {
        setProduct(data.product)
        setOrderQty(data.product.minOrderQty || 1)
      } else {
        // Fallback: fetch all and filter
        const allRes = await fetch('/api/products')
        const allData = await allRes.json()
        const found = (allData.products || []).find((p: Product) => p.id === selectedProductId)
        if (found) {
          setProduct(found)
          setOrderQty(found.minOrderQty || 1)
        } else {
          toast.error('Product not found')
          setView('marketplace')
        }
      }
    } catch {
      toast.error('Failed to load product')
      setView('marketplace')
    } finally {
      setLoading(false)
    }
  }, [selectedProductId, setView])

  useEffect(() => {
    fetchProduct()
  }, [fetchProduct])

  // Fetch producer details
  useEffect(() => {
    if (!product?.sellerId) return
    const fetchProducer = async () => {
      try {
        const res = await fetch(`/api/users?id=${product.sellerId}`)
        const data = await res.json()
        if (data.user) {
          setProducer(data.user as ProducerInfo)
        }
      } catch {
        // silently fail
      }
    }
    fetchProducer()
  }, [product?.sellerId])

  // Fetch seller's other products
  useEffect(() => {
    if (!product?.sellerId || !product?.id) return
    const fetchSellerProducts = async () => {
      try {
        const res = await fetch(`/api/products?sellerId=${product.sellerId}`)
        const data = await res.json()
        setSellerProducts((data.products || []).filter((p: Product) => p.id !== product.id).slice(0, 8))
      } catch {
        setSellerProducts([])
      }
    }
    fetchSellerProducts()
  }, [product?.sellerId, product?.id])

  // Fetch similar category products
  useEffect(() => {
    if (!product?.category || !product?.id) return
    const fetchSimilar = async () => {
      try {
        const res = await fetch(`/api/products?category=${product.category}`)
        const data = await res.json()
        setSimilarProducts((data.products || []).filter((p: Product) => p.id !== product.id && p.sellerId !== product.sellerId).slice(0, 8))
      } catch {
        setSimilarProducts([])
      }
    }
    fetchSimilar()
  }, [product?.category, product?.id, product?.sellerId])

  // Fetch reviews - try by productId first, fallback to seller reviews
  useEffect(() => {
    if (!product?.id || !product?.sellerId) return
    const fetchReviews = async () => {
      try {
        // First try fetching reviews filtered by productId
        const productRes = await fetch(`/api/reviews?targetId=${product.sellerId}&productId=${product.id}`)
        if (productRes.ok) {
          const productData = await productRes.json()
          if (productData.reviews && productData.reviews.length > 0) {
            setReviews(productData.reviews)
            return
          }
        }

        // Fallback: fetch seller reviews
        const sellerRes = await fetch(`/api/reviews?targetId=${product.sellerId}`)
        if (sellerRes.ok) {
          const sellerData = await sellerRes.json()
          if (sellerData.reviews && sellerData.reviews.length > 0) {
            setReviews(sellerData.reviews)
            return
          }
        }

        // Fallback to mock reviews if no real ones exist
        setReviews([
          { id: '1', reviewerId: 'r1', targetId: product.sellerId, productId: product.id, rating: 5, comment: 'Excellent quality produce. Very fresh and well-packaged. Will order again!', createdAt: new Date().toISOString(), reviewer: { name: 'Rajesh Kumar', companyName: 'RK Traders' } },
          { id: '2', reviewerId: 'r2', targetId: product.sellerId, productId: product.id, rating: 4, comment: 'Good quality and timely delivery. Slight delay in communication but overall satisfied.', createdAt: new Date(Date.now() - 86400000 * 3).toISOString(), reviewer: { name: 'Priya Sharma', companyName: 'Sharma Enterprises' } },
          { id: '3', reviewerId: 'r3', targetId: product.sellerId, productId: product.id, rating: 5, comment: 'Best supplier we have worked with. Consistent quality every time.', createdAt: new Date(Date.now() - 86400000 * 7).toISOString(), reviewer: { name: 'Amit Patel' } },
        ])
      } catch {
        setReviews([
          { id: '1', reviewerId: 'r1', targetId: product.sellerId, productId: product.id, rating: 5, comment: 'Excellent quality produce. Very fresh and well-packaged!', createdAt: new Date().toISOString(), reviewer: { name: 'Rajesh Kumar' } },
          { id: '2', reviewerId: 'r2', targetId: product.sellerId, productId: product.id, rating: 4, comment: 'Good quality and timely delivery. Recommended.', createdAt: new Date(Date.now() - 86400000 * 5).toISOString(), reviewer: { name: 'Priya Sharma' } },
        ])
      }
    }
    fetchReviews()
  }, [product?.id, product?.sellerId])

  // Handle Add to Cart for current product
  const handleAddToCart = useCallback(() => {
    if (!user) {
      toast.error('Please sign in to add items to cart')
      setView('auth')
      return
    }
    if (user.role !== 'buyer' && user.role !== 'admin') {
      toast.error('Only buyers can add items to cart')
      return
    }
    if (!product) return

    const productImage = product.imageUrl || (product.images ? product.images.split(',')[0] : undefined)
    addToCart({
      productId: product.id,
      productName: product.name,
      productImage,
      sellerId: product.sellerId,
      sellerName: product.seller.companyName || product.seller.name,
      quantity: orderQty,
      unit: product.unit,
      pricePerUnit: product.pricePerUnit,
      minOrderQty: product.minOrderQty || 1,
      maxQuantity: product.quantity,
      location: product.location,
      state: product.state,
      deliveryHandledByProducer: product.deliveryHandledByProducer || false,
      deliveryFee: product.deliveryFee || 0,
      freeDelivery: product.freeDelivery || false,
      deliveryType: product.deliveryType || 'platform',
      localTransporterName: product.localTransporterName || '',
      localTransporterPhone: product.localTransporterPhone || '',
      localTransporterVehicle: product.localTransporterVehicle || '',
    })
    toast.success(`${product.name} added to cart`)
  }, [user, product, orderQty, addToCart, setView])

  // Handle Add to Cart for related/similar product
  const handleQuickAddToCart = useCallback((p: Product) => {
    if (!user) {
      toast.error('Please sign in to add items to cart')
      setView('auth')
      return
    }
    if (user.role !== 'buyer' && user.role !== 'admin') {
      toast.error('Only buyers can add items to cart')
      return
    }

    const productImage = p.imageUrl || (p.images ? p.images.split(',')[0] : undefined)
    addToCart({
      productId: p.id,
      productName: p.name,
      productImage,
      sellerId: p.sellerId,
      sellerName: p.seller.companyName || p.seller.name,
      quantity: p.minOrderQty || 1,
      unit: p.unit,
      pricePerUnit: p.pricePerUnit,
      minOrderQty: p.minOrderQty || 1,
      maxQuantity: p.quantity,
      location: p.location,
      state: p.state,
      deliveryHandledByProducer: p.deliveryHandledByProducer || false,
      deliveryFee: p.deliveryFee || 0,
      freeDelivery: p.freeDelivery || false,
      deliveryType: p.deliveryType || 'platform',
      localTransporterName: p.localTransporterName || '',
      localTransporterPhone: p.localTransporterPhone || '',
      localTransporterVehicle: p.localTransporterVehicle || '',
    })
    toast.success(`${p.name} added to cart`)
  }, [user, addToCart, setView])

  // Handle Buy Now (add to cart + open cart)
  const handleBuyNow = () => {
    handleAddToCart()
    setCartOpen(true)
  }

  // Handle submit review - include productId
  const handleSubmitReview = async () => {
    if (!user) {
      toast.error('Please sign in to write a review')
      setView('auth')
      return
    }
    if (!product) return
    if (reviewRating === 0) {
      toast.error('Please select a rating')
      return
    }
    if (!reviewComment.trim()) {
      toast.error('Please write a comment')
      return
    }

    setSubmittingReview(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewerId: user.id,
          targetId: product.sellerId,
          productId: product.id,
          rating: reviewRating,
          comment: reviewComment.trim(),
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setReviews((prev) => [data.review || {
          id: Date.now().toString(),
          reviewerId: user.id,
          targetId: product.sellerId,
          productId: product.id,
          rating: reviewRating,
          comment: reviewComment.trim(),
          createdAt: new Date().toISOString(),
          reviewer: { name: user.name, companyName: user.companyName },
        }, ...prev])
        setReviewRating(0)
        setReviewComment('')
        toast.success('Review submitted successfully!')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to submit review')
      }
    } catch {
      toast.error('Failed to submit review')
    } finally {
      setSubmittingReview(false)
    }
  }

  // Handle share
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.name || 'AgriLink Product',
          text: `Check out ${product?.name} on AgriLink - ₹${product?.pricePerUnit.toLocaleString('en-IN')}/${product?.unit}`,
          url: window.location.href,
        })
      } catch {
        // User cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href)
        toast.success('Link copied to clipboard!')
      } catch {
        toast.error('Failed to copy link')
      }
    }
  }

  // Parse images
  const imageList = product?.images ? product.images.split(',').filter(Boolean) : []
  const allImages = product?.imageUrl ? [product.imageUrl, ...imageList] : imageList.length > 0 ? imageList : []

  // Compute total price
  const totalPrice = product ? orderQty * product.pricePerUnit : 0
  // V4: compute platform fee using the new revenue model (₹1000 flat if subtotal > ₹10,000 else ₹0)
  const computedPlatformFee = product ? computePlatformFee(totalPrice) : 0
  // V4: producer-handled delivery fee (waived when freeDelivery)
  const producerDeliveryFee = product && product.deliveryHandledByProducer && !product.freeDelivery ? (product.deliveryFee || 0) : 0

  // Category helpers
  const catColor = CATEGORY_COLORS[product?.category || ''] || 'bg-gray-500/15 text-gray-400 border-gray-500/25'
  const gradient = CATEGORY_GRADIENTS[product?.category || ''] || 'from-gray-900/40 to-gray-700/20'
  const emoji = CATEGORY_ICONS[product?.category || ''] || '📦'
  const gradeColor = GRADE_COLORS[product?.qualityGrade || ''] || ''

  // Certifications
  const productCerts = product?.certifications ? product.certifications.split(',').map((c) => c.trim()).filter(Boolean) : []

  // Average review rating
  const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0

  // Format date
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A'
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
    } catch {
      return 'N/A'
    }
  }

  if (loading) return <ProductPageSkeleton />
  if (!product) return null

  return (
    <div className="min-h-screen bg-background">
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 -left-20 w-72 h-72 bg-amber-500/4 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10">
        {/* ─── Sticky Top Bar ──────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="sticky top-0 z-40 glass-card-strong mx-4 sm:mx-6 mt-4 px-4 sm:px-6 py-3 flex items-center gap-3"
        >
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground shrink-0"
            onClick={() => setView('marketplace')}
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            <span className="hidden sm:inline">Back</span>
          </Button>

          <div className="flex-1 min-w-0">
            <h1 className="text-sm sm:text-base font-bold text-foreground truncate">{product.name}</h1>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground shrink-0"
            onClick={() => {
              setActiveChatUser(product.sellerId)
              setChatOpen(true)
            }}
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline ml-1.5">Chat</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground shrink-0"
            onClick={handleShare}
          >
            <Share2 className="w-4 h-4" />
          </Button>
        </motion.div>

        {/* ─── Main Content (2-column on desktop) ─────────────────────────────── */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="px-4 sm:px-6 mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* ─── Left Column: Product Images ──────────────────────────────────── */}
          <motion.div variants={fadeUp} className="space-y-4">
            {/* Main Image Area */}
            <div className="glass-card p-4">
              <div className={`aspect-square rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center relative overflow-hidden`}>
                {allImages.length > 0 ? (
                  <img
                    src={allImages[selectedImageIdx] || ''}
                    alt={product.name}
                    className="w-full h-full object-cover rounded-xl"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                ) : (
                  <span className="text-7xl">{emoji}</span>
                )}

                {/* Quality Grade Badge */}
                {product.qualityGrade && (
                  <div className={`absolute top-3 left-3 text-sm font-bold px-3 py-1.5 rounded-xl border backdrop-blur-sm ${gradeColor}`}>
                    Grade {product.qualityGrade}
                  </div>
                )}

                {/* Organic Badge */}
                {product.isOrganic && (
                  <div className="absolute top-3 right-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-sm font-semibold px-3 py-1.5 rounded-xl backdrop-blur-sm flex items-center gap-1.5">
                    <Leaf className="w-3.5 h-3.5" />
                    Organic
                  </div>
                )}
              </div>

              {/* Thumbnail Strip */}
              {allImages.length > 1 && (
                <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIdx(idx)}
                      className={`w-16 h-16 rounded-lg border-2 overflow-hidden shrink-0 transition-all ${
                        idx === selectedImageIdx
                          ? 'border-emerald-400 shadow-lg shadow-emerald-500/20'
                          : 'border-white/10 hover:border-white/25'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`${product.name} ${idx + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* If no images, show placeholder thumbnails with category emoji */}
              {allImages.length === 0 && (
                <div className="flex gap-2 mt-3">
                  {[0, 1, 2, 3].map((idx) => (
                    <div
                      key={idx}
                      className={`w-16 h-16 rounded-lg border-2 overflow-hidden shrink-0 flex items-center justify-center ${
                        idx === 0 ? 'border-emerald-400' : 'border-white/10'
                      }`}
                      style={{ background: 'oklch(1 0 0 / 5%)' }}
                    >
                      <span className="text-2xl">{emoji}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Delivery Estimation Card - Simplified */}
            <div className="glass-card p-4 space-y-3 border border-emerald-500/10">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-400" />
                Delivery Estimate
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-emerald-400" /> From
                  </span>
                  <span className="font-medium text-foreground text-xs">{product.location}{product.state ? `, ${product.state}` : ''}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-amber-400" /> Est. Delivery
                  </span>
                  <span className="font-medium text-foreground">2-5 business days</span>
                </div>
                <Separator className="bg-white/5" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Est. Transport Cost</span>
                  <div className="text-right">
                    <span className="text-amber-400 font-semibold">₹{Math.round(totalPrice * TRANSPORT_ESTIMATE_RATE).toLocaleString('en-IN')}</span>
                    <p className="text-[10px] text-muted-foreground/60">~3.5% of order value (estimate only)</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Platform Fee</span>
                  <div className="text-right">
                    {computedPlatformFee === 0 ? (
                      <>
                        <span className="text-emerald-400 font-semibold">FREE</span>
                        <p className="text-[10px] text-muted-foreground/60">No fee on orders ≤ ₹10,000</p>
                      </>
                    ) : (
                      <>
                        <span className="text-foreground font-semibold">₹{computedPlatformFee.toLocaleString('en-IN')}</span>
                        <p className="text-[10px] text-muted-foreground/60">Flat fee on orders &gt; ₹10,000</p>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Truck className="w-3 h-3 text-emerald-400" /> Delivery Fee
                  </span>
                  <div className="text-right">
                    {product.deliveryHandledByProducer ? (
                      product.freeDelivery ? (
                        <>
                          <span className="text-emerald-400 font-semibold">FREE</span>
                          <p className="text-[10px] text-muted-foreground/60">Producer offers free delivery</p>
                        </>
                      ) : producerDeliveryFee > 0 ? (
                        <>
                          <span className="text-foreground font-semibold">₹{producerDeliveryFee.toLocaleString('en-IN')}</span>
                          <p className="text-[10px] text-muted-foreground/60">Set by producer</p>
                        </>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )
                    ) : (
                      <>
                        <span className="text-sky-400/80 font-medium text-xs">Arranged by AgroBridge</span>
                        <p className="text-[10px] text-muted-foreground/60">₹30 booking fee at checkout</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground/60">Transport & platform fees are estimates. Final cost calculated at checkout.</p>
            </div>

            {/* Delivery Options Card - V4 */}
            <div className={`glass-card p-4 space-y-2 border ${
              product.deliveryType === 'local'
                ? 'border-amber-500/30 bg-amber-500/[0.04]'
                : product.deliveryHandledByProducer
                  ? product.freeDelivery
                    ? 'border-emerald-500/30 bg-emerald-500/[0.04]'
                    : 'border-teal-500/30 bg-teal-500/[0.04]'
                  : 'border-sky-500/20 bg-sky-500/[0.03]'
            }`}>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Truck className={`w-4 h-4 ${
                  product.deliveryType === 'local'
                    ? 'text-amber-400'
                    : product.deliveryHandledByProducer
                      ? product.freeDelivery ? 'text-emerald-400' : 'text-teal-400'
                      : 'text-sky-400'
                }`} />
                Delivery Options
              </h3>
              {product.deliveryType === 'local' ? (
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-base">🚚</span>
                    <div>
                      <p className="text-sm font-semibold text-amber-400">Delivery: Producer's Transporter</p>
                      <p className="text-[11px] text-muted-foreground">The producer will assign their own local transporter to deliver this order.</p>
                    </div>
                  </div>
                  {product.localTransporterName && (
                    <div className="glass-card p-3 border border-amber-500/15 mt-2">
                      <p className="text-[10px] text-muted-foreground mb-1.5">Transporter Details</p>
                      <div className="grid grid-cols-1 gap-1.5 text-xs">
                        {product.localTransporterName && (
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3 text-amber-400" />
                            <span className="text-foreground font-medium">{product.localTransporterName}</span>
                          </div>
                        )}
                        {product.localTransporterPhone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3 text-amber-400" />
                            <a href={`tel:${product.localTransporterPhone}`} className="text-foreground font-medium hover:text-amber-400 transition-colors">{product.localTransporterPhone}</a>
                          </div>
                        )}
                        {product.localTransporterVehicle && (
                          <div className="flex items-center gap-2">
                            <Truck className="h-3 w-3 text-amber-400" />
                            <span className="text-foreground font-medium">{product.localTransporterVehicle}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {(product.deliveryFee || 0) > 0 && !product.freeDelivery && (
                    <p className="text-[11px] text-muted-foreground">Delivery fee: ₹{(product.deliveryFee || 0).toLocaleString('en-IN')}</p>
                  )}
                  {product.freeDelivery && (
                    <p className="text-[11px] text-emerald-400">Free delivery</p>
                  )}
                </div>
              ) : product.deliveryHandledByProducer ? (
                product.freeDelivery ? (
                  <div className="flex items-start gap-2">
                    <span className="text-base">🚚</span>
                    <div>
                      <p className="text-sm font-semibold text-emerald-400">FREE Delivery by Producer</p>
                      <p className="text-[11px] text-muted-foreground">This producer handles delivery at no extra cost to you.</p>
                    </div>
                  </div>
                ) : (product.deliveryFee || 0) > 0 ? (
                  <div className="flex items-start gap-2">
                    <span className="text-base">🚚</span>
                    <div>
                      <p className="text-sm font-semibold text-teal-400">Delivery by Producer — ₹{(product.deliveryFee || 0).toLocaleString('en-IN')}</p>
                      <p className="text-[11px] text-muted-foreground">The producer will deliver this order directly for the fee shown above.</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <span className="text-base">🚚</span>
                    <div>
                      <p className="text-sm font-semibold text-emerald-400">Delivery by Producer</p>
                      <p className="text-[11px] text-muted-foreground">The producer will handle delivery directly.</p>
                    </div>
                  </div>
                )
              ) : (
                <div className="flex items-start gap-2">
                  <span className="text-base">🚚</span>
                  <div>
                    <p className="text-sm font-semibold text-sky-400">Transport arranged via AgroBridge</p>
                    <p className="text-[11px] text-muted-foreground">A ₹30 booking fee applies. AgroBridge connects you with verified transporters.</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* ─── Right Column: Product Details ────────────────────────────────── */}
          <motion.div variants={fadeUp} className="space-y-5">
            {/* 1. Product Title & Price */}
            <div className="glass-card p-6 space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${catColor}`}>
                  {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
                </span>
                {product.isOrganic && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg border bg-emerald-500/15 text-emerald-400 border-emerald-500/25 flex items-center gap-1">
                    <Leaf className="w-3 h-3" />
                    Organic
                  </span>
                )}
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">{product.name}</h2>

              {/* Price - ONLY actual price set by producer */}
              <div className="flex items-end gap-2">
                <div className="flex items-baseline gap-1">
                  <IndianRupee className="w-6 h-6 text-emerald-400" />
                  <span className="text-3xl sm:text-4xl font-bold text-foreground">
                    {product.pricePerUnit.toLocaleString('en-IN')}
                  </span>
                </div>
                <span className="text-base text-muted-foreground mb-1">/ {product.unit}</span>
              </div>

              {/* Available Quantity - Prominent Display */}
              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                  product.quantity < 10
                    ? 'bg-red-500/10 border-red-500/25'
                    : 'bg-emerald-500/10 border-emerald-500/25'
                }`}>
                  <Package className={`w-4 h-4 ${product.quantity < 10 ? 'text-red-400' : 'text-emerald-400'}`} />
                  <span className={`text-sm font-bold ${product.quantity < 10 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {product.quantity.toLocaleString('en-IN')} units available
                  </span>
                </div>
                {product.quantity < 10 && (
                  <div className="flex items-center gap-1 text-red-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-xs font-semibold">Low stock!</span>
                  </div>
                )}
              </div>

              {/* Location */}
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>{product.location}{product.state ? `, ${product.state}` : ''}</span>
              </div>
            </div>

            {/* 2. Crop Details Card */}
            <div className="glass-card p-5 space-y-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Sprout className="w-4 h-4 text-emerald-400" />
                Crop Details
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="glass-card p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Variety</p>
                  <p className="text-sm font-semibold text-foreground">{product.cropVariety || 'Standard'}</p>
                </div>
                <div className="glass-card p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Harvest Date
                  </p>
                  <p className="text-sm font-semibold text-foreground">{formatDate(product.harvestDate)}</p>
                </div>
                <div className="glass-card p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Freshness</p>
                  <p className="text-sm font-semibold text-foreground">{product.freshness || 'Fresh'}</p>
                </div>
                <div className="glass-card p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Droplets className="w-3 h-3" /> Moisture
                  </p>
                  <p className="text-sm font-semibold text-foreground">{product.moistureContent || 'N/A'}</p>
                </div>
                <div className="glass-card p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Shelf Life
                  </p>
                  <p className="text-sm font-semibold text-foreground">{product.shelfLife || 'N/A'}</p>
                </div>
                <div className="glass-card p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                    <ThermometerSun className="w-3 h-3" /> Storage
                  </p>
                  <p className="text-sm font-semibold text-foreground">{product.storageCondition || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* 3. Quality & Certifications Card */}
            <div className="glass-card p-5 space-y-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-400" />
                Quality & Certifications
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Quality Grade</span>
                  <span className={`text-sm font-bold px-3 py-1 rounded-lg border ${gradeColor}`}>
                    {product.qualityGrade || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Organic Status</span>
                  {product.isOrganic ? (
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      Certified Organic
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <XCircle className="w-4 h-4" />
                      Conventional
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Pesticides Used</span>
                  <span className="text-sm font-medium text-foreground">{product.pesticidesUsed || 'Not specified'}</span>
                </div>
                {productCerts.length > 0 && (
                  <div className="pt-2">
                    <p className="text-xs text-muted-foreground mb-2">Certifications</p>
                    <div className="flex flex-wrap gap-2">
                      {productCerts.map((cert, idx) => (
                        <span
                          key={idx}
                          className="text-xs font-medium px-2.5 py-1 rounded-lg border bg-amber-500/10 text-amber-400 border-amber-500/20"
                        >
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 4. Availability & Pricing Card */}
            <div className="glass-card p-5 space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-400" />
                Availability & Pricing
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div className={`glass-card p-3 text-center ${product.quantity < 10 ? 'border border-red-500/20' : ''}`}>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Available</p>
                  <p className={`text-base font-bold ${product.quantity < 10 ? 'text-red-400' : 'text-foreground'}`}>{product.quantity.toLocaleString('en-IN')}</p>
                  <p className="text-[10px] text-muted-foreground">{product.unit}</p>
                  {product.quantity < 10 && (
                    <p className="text-[9px] text-red-400 font-semibold mt-0.5">Low stock!</p>
                  )}
                </div>
                <div className="glass-card p-3 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Min Order</p>
                  <p className="text-base font-bold text-foreground">{product.minOrderQty || 1}</p>
                  <p className="text-[10px] text-muted-foreground">{product.unit}</p>
                </div>
                <div className="glass-card p-3 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Price</p>
                  <p className="text-base font-bold text-emerald-400">₹{product.pricePerUnit.toLocaleString('en-IN')}</p>
                  <p className="text-[10px] text-muted-foreground">per {product.unit}</p>
                </div>
              </div>
            </div>

            {/* 5. Add to Cart / Buy Now Section */}
            <div className="glass-card-strong p-5 space-y-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-emerald-400" />
                Add to Cart
              </h3>

              <div className="flex items-center gap-4">
                {/* Quantity Input */}
                <div className="flex items-center gap-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 w-10 rounded-l-xl rounded-r-none border-white/10 hover:bg-white/10"
                    onClick={() => setOrderQty(Math.max(product.minOrderQty || 1, orderQty - 1))}
                    disabled={orderQty <= (product.minOrderQty || 1)}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <Input
                    type="number"
                    min={product.minOrderQty || 1}
                    max={product.quantity}
                    value={orderQty}
                    onChange={(e) => setOrderQty(Math.max(product.minOrderQty || 1, Math.min(product.quantity, Number(e.target.value) || 1)))}
                    className="h-10 w-20 text-center rounded-none border-white/10 bg-white/5 text-base font-semibold"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 w-10 rounded-r-xl rounded-l-none border-white/10 hover:bg-white/10"
                    onClick={() => setOrderQty(Math.min(product.quantity, orderQty + 1))}
                    disabled={orderQty >= product.quantity}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {/* Total Price */}
                <div className="flex-1 text-right">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <div className="flex items-baseline justify-end gap-1">
                    <IndianRupee className="w-4 h-4 text-emerald-400" />
                    <span className="text-xl font-bold text-foreground">{totalPrice.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  className="h-11 text-sm font-semibold bg-white/10 hover:bg-white/15 text-foreground border border-white/10"
                  variant="outline"
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add to Cart
                </Button>
                <Button
                  className="h-11 text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20"
                  onClick={handleBuyNow}
                >
                  Buy Now
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>

            {/* 6. Producer Info Card */}
            {producer && (
              <div
                className="glass-card p-4 cursor-pointer hover:bg-white/[0.04] transition-colors"
                onClick={() => {
                  setSelectedProducerId(product.sellerId)
                  setView('producer-profile')
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-lg font-bold text-emerald-400">
                    {(producer.companyName || producer.name).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-foreground truncate">
                      {producer.companyName || producer.name}
                    </h4>
                    <p className="text-xs text-muted-foreground truncate">
                      {producer.farmName && `${producer.farmName} · `}{producer.city}{producer.state ? `, ${producer.state}` : ''}
                    </p>
                    {producer.avgRating !== undefined && producer.avgRating > 0 && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <StarRating rating={producer.avgRating} size="sm" />
                        <span className="text-xs text-muted-foreground">
                          {producer.avgRating.toFixed(1)} ({producer.totalReviews || 0})
                        </span>
                      </div>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            )}

            {/* 7. Reviews Section */}
            <div className="glass-card p-5 space-y-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                Reviews
                {reviews.length > 0 && (
                  <span className="text-xs text-muted-foreground font-normal">
                    {avgRating.toFixed(1)} avg · {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                  </span>
                )}
              </h3>

              {/* Review Form */}
              {user && user.role === 'buyer' && (
                <div className="glass-card p-4 space-y-3 border border-white/10">
                  <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Write a Review</h4>
                  <InteractiveStarRating value={reviewRating} onChange={setReviewRating} />
                  <Textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share your experience with this product..."
                    className="min-h-[80px] bg-white/5 border-white/10 text-sm resize-none"
                  />
                  <Button
                    size="sm"
                    className="bg-emerald-500 hover:bg-emerald-400 text-white"
                    onClick={handleSubmitReview}
                    disabled={submittingReview || reviewRating === 0}
                  >
                    {submittingReview ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5 mr-1.5" />
                        Submit Review
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Reviews List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {reviews.length === 0 ? (
                  <div className="text-center py-6">
                    <Star className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No reviews yet</p>
                    <p className="text-xs text-muted-foreground/60">Be the first to review this product</p>
                  </div>
                ) : (
                  reviews.map((review) => (
                    <div key={review.id} className="glass-card p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-emerald-500/15 flex items-center justify-center text-xs font-bold text-emerald-400">
                            {(review.reviewer?.name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-foreground">{review.reviewer?.name || 'Anonymous'}</p>
                            {review.reviewer?.companyName && (
                              <p className="text-[10px] text-muted-foreground">{review.reviewer.companyName}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <StarRating rating={review.rating} size="sm" />
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(review.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-xs text-muted-foreground leading-relaxed">{review.comment}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* ─── Similar Products Section ─────────────────────────────────────────── */}
        {similarProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="px-4 sm:px-6 mt-10"
          >
            <div className="bg-white/[0.03] border border-white/10 backdrop-blur-sm rounded-2xl p-5 sm:p-6">
              {/* Section Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                    <Package className="w-4.5 h-4.5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-foreground">Similar Products</h3>
                    <p className="text-xs text-muted-foreground">From other producers in the same category</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] border-white/10 text-muted-foreground">
                  {similarProducts.length} product{similarProducts.length !== 1 ? 's' : ''}
                </Badge>
              </div>

              {/* Mobile: Horizontal scroll | Desktop: Grid */}
              <div className="flex gap-4 overflow-x-auto pb-2 sm:pb-0 lg:grid lg:grid-cols-4 sm:grid-cols-3 sm:overflow-visible scrollbar-thin">
                {similarProducts.map((sp, idx) => (
                  <motion.div
                    key={sp.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: idx * 0.05 }}
                    className="min-w-[220px] sm:min-w-0 flex-shrink-0 lg:flex-shrink"
                  >
                    <SimilarProductCard
                      product={sp}
                      onClick={() => {
                        setSelectedProductId(sp.id)
                        setSelectedImageIdx(0)
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                      onAddToCart={() => handleQuickAddToCart(sp)}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── Other Products From This Producer ─────────────────────────────── */}
        {sellerProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="px-4 sm:px-6 mt-6 mb-10"
          >
            <div className="bg-white/[0.03] border border-white/10 backdrop-blur-sm rounded-2xl p-5 sm:p-6">
              {/* Section Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
                    <Award className="w-4.5 h-4.5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-foreground">Other Products From This Producer</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      {producer?.companyName || product.seller.companyName || product.seller.name}
                      {(producer?.verificationStatus === 'verified' || product.seller.verificationStatus === 'verified') && (
                        <BadgeCheck className="w-3 h-3 text-emerald-400" />
                      )}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] border-white/10 text-muted-foreground">
                  {sellerProducts.length} product{sellerProducts.length !== 1 ? 's' : ''}
                </Badge>
              </div>

              {/* Mobile: Horizontal scroll | Desktop: Grid */}
              <div className="flex gap-4 overflow-x-auto pb-2 sm:pb-0 lg:grid lg:grid-cols-4 sm:grid-cols-3 sm:overflow-visible scrollbar-thin">
                {sellerProducts.map((sp, idx) => (
                  <motion.div
                    key={sp.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: idx * 0.05 }}
                    className="min-w-[220px] sm:min-w-0 flex-shrink-0 lg:flex-shrink"
                  >
                    <ProducerProductCard
                      product={sp}
                      onClick={() => {
                        setSelectedProductId(sp.id)
                        setSelectedImageIdx(0)
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                      onAddToCart={() => handleQuickAddToCart(sp)}
                      producerName={producer?.companyName || product.seller.companyName || product.seller.name}
                      isVerified={producer?.verificationStatus === 'verified' || product.seller.verificationStatus === 'verified'}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
