'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import {
  ArrowLeft,
  MapPin,
  IndianRupee,
  MessageSquare,
  Share2,
  TrendingUp,
  Star,
  Shield,
  BadgeCheck,
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
  User,
  ChevronRight,
  Sprout,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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

const TRANSPORT_PARTNERS = [
  'AgriLogistics Express',
  'FarmFreight India',
  'GreenRoute Transport',
]

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
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}

// ─── Related Product Card ─────────────────────────────────────────────────────
function RelatedProductCard({ product, onClick }: { product: Product; onClick: () => void }) {
  const catColor = CATEGORY_COLORS[product.category] || 'bg-gray-500/15 text-gray-400 border-gray-500/25'
  const gradient = CATEGORY_GRADIENTS[product.category] || 'from-gray-900/40 to-gray-700/20'
  const emoji = CATEGORY_ICONS[product.category] || '📦'

  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="glass-card p-4 cursor-pointer hover:bg-white/[0.07] transition-all min-w-[220px] shrink-0"
      onClick={onClick}
    >
      {/* Image placeholder */}
      <div className={`aspect-[4/3] rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3 relative overflow-hidden`}>
        <span className="text-4xl">{emoji}</span>
        {product.qualityGrade && (
          <span className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-md border ${GRADE_COLORS[product.qualityGrade] || ''}`}>
            {product.qualityGrade}
          </span>
        )}
      </div>
      <h4 className="text-sm font-semibold text-foreground truncate mb-1">{product.name}</h4>
      <div className="flex items-center gap-1 mb-1">
        <IndianRupee className="w-3 h-3 text-emerald-400" />
        <span className="text-sm font-bold text-foreground">{product.pricePerUnit.toLocaleString('en-IN')}</span>
        <span className="text-[10px] text-muted-foreground">/ {product.unit}</span>
      </div>
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <MapPin className="w-3 h-3 text-emerald-400" />
        <span className="truncate">{product.location}</span>
      </div>
      <span className={`inline-block mt-2 text-[10px] font-semibold px-2 py-0.5 rounded-md border ${catColor}`}>
        {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
      </span>
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
  } = useAppStore()

  const [product, setProduct] = useState<Product | null>(null)
  const [producer, setProducer] = useState<ProducerInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [orderQty, setOrderQty] = useState(1)
  const [ordering, setOrdering] = useState(false)
  const [selectedImageIdx, setSelectedImageIdx] = useState(0)
  const [sellerProducts, setSellerProducts] = useState<Product[]>([])
  const [similarProducts, setSimilarProducts] = useState<Product[]>([])
  const [reviews, setReviews] = useState<Review[]>([])

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

  // Fetch reviews (mock if no API)
  useEffect(() => {
    if (!product?.sellerId) return
    const fetchReviews = async () => {
      try {
        const res = await fetch(`/api/reviews?targetId=${product.sellerId}`)
        if (res.ok) {
          const data = await res.json()
          setReviews(data.reviews || [])
        } else {
          // Mock reviews
          setReviews([
            { id: '1', reviewerId: 'r1', targetId: product.sellerId, rating: 5, comment: 'Excellent quality produce. Very fresh and well-packaged. Will order again!', createdAt: new Date().toISOString(), reviewer: { name: 'Rajesh Kumar', companyName: 'RK Traders' } },
            { id: '2', reviewerId: 'r2', targetId: product.sellerId, rating: 4, comment: 'Good quality and timely delivery. Slight delay in communication but overall satisfied.', createdAt: new Date(Date.now() - 86400000 * 3).toISOString(), reviewer: { name: 'Priya Sharma', companyName: 'Sharma Enterprises' } },
            { id: '3', reviewerId: 'r3', targetId: product.sellerId, rating: 5, comment: 'Best supplier we have worked with. Consistent quality every time.', createdAt: new Date(Date.now() - 86400000 * 7).toISOString(), reviewer: { name: 'Amit Patel' } },
          ])
        }
      } catch {
        setReviews([
          { id: '1', reviewerId: 'r1', targetId: product.sellerId, rating: 5, comment: 'Excellent quality produce. Very fresh and well-packaged!', createdAt: new Date().toISOString(), reviewer: { name: 'Rajesh Kumar' } },
          { id: '2', reviewerId: 'r2', targetId: product.sellerId, rating: 4, comment: 'Good quality and timely delivery. Recommended.', createdAt: new Date(Date.now() - 86400000 * 5).toISOString(), reviewer: { name: 'Priya Sharma' } },
        ])
      }
    }
    fetchReviews()
  }, [product?.sellerId])

  // Handle place order
  const handlePlaceOrder = async () => {
    if (!user) {
      toast.error('Please sign in to place an order')
      setView('auth')
      return
    }
    if (user.role !== 'buyer' && user.role !== 'admin') {
      toast.error('Only buyers can place orders')
      return
    }
    if (!product) return

    setOrdering(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerId: user.id,
          sellerId: product.sellerId,
          productId: product.id,
          quantity: orderQty,
          unitPrice: product.pricePerUnit,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Order placed for ${orderQty} ${product.unit} of ${product.name}`)
      } else {
        toast.error(data.error || 'Failed to place order')
      }
    } catch {
      toast.error('Failed to place order')
    } finally {
      setOrdering(false)
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

  // Category helpers
  const catColor = CATEGORY_COLORS[product?.category || ''] || 'bg-gray-500/15 text-gray-400 border-gray-500/25'
  const gradient = CATEGORY_GRADIENTS[product?.category || ''] || 'from-gray-900/40 to-gray-700/20'
  const emoji = CATEGORY_ICONS[product?.category || ''] || '📦'
  const gradeColor = GRADE_COLORS[product?.qualityGrade || ''] || ''

  // Certifications
  const productCerts = product?.certifications ? product.certifications.split(',').map((c) => c.trim()).filter(Boolean) : []
  const producerCerts = producer?.certifications ? producer.certifications.split(',').map((c) => c.trim()).filter(Boolean) : []

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

              {/* Price */}
              <div className="flex items-end gap-2">
                <div className="flex items-baseline gap-1">
                  <IndianRupee className="w-6 h-6 text-emerald-400" />
                  <span className="text-3xl sm:text-4xl font-bold text-foreground">
                    {product.pricePerUnit.toLocaleString('en-IN')}
                  </span>
                </div>
                <span className="text-base text-muted-foreground mb-1">/ {product.unit}</span>
              </div>

              {/* Price Trend */}
              <div className="flex items-center gap-1.5 text-sm">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-medium">+3.2% this week</span>
                <span className="text-muted-foreground">· Market trend</span>
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
                {/* Quality Grade */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Quality Grade</span>
                  <span className={`text-sm font-bold px-3 py-1 rounded-lg border ${gradeColor}`}>
                    {product.qualityGrade || 'N/A'}
                  </span>
                </div>

                {/* Organic Status */}
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

                {/* Pesticides */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Pesticides Used</span>
                  <span className="text-sm font-medium text-foreground">{product.pesticidesUsed || 'Not specified'}</span>
                </div>

                {/* Certifications */}
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
                <div className="glass-card p-3 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Available</p>
                  <p className="text-base font-bold text-foreground">{product.quantity.toLocaleString('en-IN')}</p>
                  <p className="text-[10px] text-muted-foreground">{product.unit}</p>
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

            {/* 5. Order Section */}
            <div className="glass-card-strong p-5 space-y-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-emerald-400" />
                Place Order
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

                <span className="text-sm text-muted-foreground">{product.unit}</span>

                {/* Live Total */}
                <div className="flex-1 text-right">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold text-emerald-400">₹{totalPrice.toLocaleString('en-IN')}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  className="flex-1 h-12 text-base font-semibold bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20"
                  onClick={handlePlaceOrder}
                  disabled={ordering}
                >
                  {ordering ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      Place Order
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="h-12 px-6 border-white/10 hover:bg-white/5 hover:border-white/20"
                  onClick={() => {
                    setActiveChatUser(product.sellerId)
                    setChatOpen(true)
                  }}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Message Seller
                </Button>
              </div>
            </div>

            {/* 6. Delivery Information Card */}
            <div className="glass-card p-5 space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-400" />
                Delivery Information
              </h3>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> Pickup Location
                  </span>
                  <span className="font-medium text-foreground">{product.location}{product.state ? `, ${product.state}` : ''}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Est. Delivery
                  </span>
                  <span className="font-medium text-foreground">2-4 business days</span>
                </div>
                <Separator className="bg-white/5" />
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Transport Partners</p>
                  <div className="flex flex-wrap gap-2">
                    {TRANSPORT_PARTNERS.map((partner, idx) => (
                      <span
                        key={idx}
                        className="text-xs font-medium px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-foreground"
                      >
                        {partner}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* ─── Full Width Sections Below ────────────────────────────────────── */}

        {/* 7. Producer Information Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="px-4 sm:px-6 mt-8"
        >
          <div className="glass-card p-6">
            <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-400" />
              Producer Information
            </h3>

            <div className="flex flex-col sm:flex-row gap-5">
              {/* Avatar & basic info */}
              <div className="flex items-start gap-4 flex-1">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                  <span className="text-2xl font-bold text-emerald-400">
                    {(producer?.name || product.seller.name || product.seller.companyName || '?')[0].toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-lg font-bold text-foreground">
                      {producer?.name || product.seller.name || 'Unknown'}
                    </h4>
                    {product.seller.verificationStatus === 'verified' && (
                      <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/25 text-xs">
                        <BadgeCheck className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  {producer?.companyName && (
                    <p className="text-sm text-amber-400 font-medium">{producer.companyName}</p>
                  )}
                  {producer?.farmName && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <Sprout className="w-3.5 h-3.5 text-emerald-400" />
                      {producer.farmName}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    {(producer?.city || producer?.state) && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {[producer?.city, producer?.state].filter(Boolean).join(', ')}
                      </span>
                    )}
                    {producer?.yearsExperience != null && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {producer.yearsExperience} yrs experience
                      </span>
                    )}
                  </div>

                  {/* Rating */}
                  {producer && (producer.avgRating > 0 || producer.totalReviews > 0) && (
                    <div className="flex items-center gap-2 mt-2">
                      <StarRating rating={producer.avgRating} size="sm" />
                      <span className="text-sm font-semibold text-foreground">{producer.avgRating.toFixed(1)}</span>
                      <span className="text-xs text-muted-foreground">({producer.totalReviews} reviews)</span>
                    </div>
                  )}

                  {/* Certifications */}
                  {producerCerts.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {producerCerts.map((cert, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-medium px-2 py-0.5 rounded-md border bg-amber-500/10 text-amber-400 border-amber-500/20"
                        >
                          {cert}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex sm:flex-col gap-2 sm:items-end shrink-0">
                <Button
                  variant="outline"
                  className="border-white/10 hover:bg-white/5 hover:border-white/20 text-sm"
                  onClick={() => {
                    setSelectedProducerId(product.sellerId)
                    setView('producer-profile')
                  }}
                >
                  View Full Profile
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
                <Button
                  variant="outline"
                  className="border-white/10 hover:bg-white/5 hover:border-white/20 text-sm"
                  onClick={() => {
                    setActiveChatUser(product.sellerId)
                    setChatOpen(true)
                  }}
                >
                  <MessageSquare className="w-4 h-4 mr-1.5" />
                  Contact Producer
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 8. Product Description */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="px-4 sm:px-6 mt-6"
        >
          <div className="glass-card p-6">
            <h3 className="text-base font-semibold text-foreground mb-4">Product Description</h3>

            {product.description ? (
              <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">No description provided for this product.</p>
            )}

            {/* Detailed Crop Information Table */}
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-foreground mb-3">Detailed Information</h4>
              <div className="rounded-xl overflow-hidden border border-white/10">
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b border-white/5">
                      <td className="px-4 py-2.5 text-muted-foreground bg-white/[0.02] w-1/3">Category</td>
                      <td className="px-4 py-2.5 font-medium text-foreground capitalize">{product.category}</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="px-4 py-2.5 text-muted-foreground bg-white/[0.02]">Crop Variety</td>
                      <td className="px-4 py-2.5 font-medium text-foreground">{product.cropVariety || 'Standard'}</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="px-4 py-2.5 text-muted-foreground bg-white/[0.02]">Quality Grade</td>
                      <td className="px-4 py-2.5 font-medium text-foreground">{product.qualityGrade || 'N/A'}</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="px-4 py-2.5 text-muted-foreground bg-white/[0.02]">Organic</td>
                      <td className="px-4 py-2.5 font-medium text-foreground">{product.isOrganic ? 'Yes' : 'No'}</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="px-4 py-2.5 text-muted-foreground bg-white/[0.02]">Harvest Date</td>
                      <td className="px-4 py-2.5 font-medium text-foreground">{formatDate(product.harvestDate)}</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="px-4 py-2.5 text-muted-foreground bg-white/[0.02]">Freshness</td>
                      <td className="px-4 py-2.5 font-medium text-foreground">{product.freshness || 'N/A'}</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="px-4 py-2.5 text-muted-foreground bg-white/[0.02]">Moisture Content</td>
                      <td className="px-4 py-2.5 font-medium text-foreground">{product.moistureContent || 'N/A'}</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="px-4 py-2.5 text-muted-foreground bg-white/[0.02]">Shelf Life</td>
                      <td className="px-4 py-2.5 font-medium text-foreground">{product.shelfLife || 'N/A'}</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="px-4 py-2.5 text-muted-foreground bg-white/[0.02]">Storage Condition</td>
                      <td className="px-4 py-2.5 font-medium text-foreground">{product.storageCondition || 'N/A'}</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="px-4 py-2.5 text-muted-foreground bg-white/[0.02]">Pesticides Used</td>
                      <td className="px-4 py-2.5 font-medium text-foreground">{product.pesticidesUsed || 'Not specified'}</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="px-4 py-2.5 text-muted-foreground bg-white/[0.02]">Available Quantity</td>
                      <td className="px-4 py-2.5 font-medium text-foreground">{product.quantity.toLocaleString('en-IN')} {product.unit}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5 text-muted-foreground bg-white/[0.02]">Min. Order Qty</td>
                      <td className="px-4 py-2.5 font-medium text-foreground">{product.minOrderQty || 1} {product.unit}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 9. Related Products */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="px-4 sm:px-6 mt-6 space-y-6"
        >
          {/* Other Products from This Producer */}
          {sellerProducts.length > 0 && (
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-foreground">Other Products from This Producer</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setSelectedProducerId(product.sellerId)
                    setView('producer-profile')
                  }}
                >
                  View All
                  <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
                {sellerProducts.map((p) => (
                  <RelatedProductCard
                    key={p.id}
                    product={p}
                    onClick={() => {
                      setSelectedProductId(p.id)
                      setView('product')
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Similar Products */}
          {similarProducts.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="text-base font-semibold text-foreground mb-4">Similar Products</h3>
              <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
                {similarProducts.map((p) => (
                  <RelatedProductCard
                    key={p.id}
                    product={p}
                    onClick={() => {
                      setSelectedProductId(p.id)
                      setView('product')
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* 10. Reviews Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="px-4 sm:px-6 mt-6"
        >
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400" />
                Reviews
              </h3>
              {producer && producer.totalReviews > 0 && (
                <div className="flex items-center gap-2">
                  <StarRating rating={producer.avgRating} size="md" />
                  <span className="text-lg font-bold text-foreground">{producer.avgRating.toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground">({producer.totalReviews})</span>
                </div>
              )}
            </div>

            {reviews.length === 0 ? (
              <div className="text-center py-8">
                <Star className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No reviews yet for this producer.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {reviews.map((review) => (
                  <div key={review.id} className="glass-card p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-emerald-400">
                            {(review.reviewer?.name || 'U')[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {review.reviewer?.name || 'Anonymous'}
                          </p>
                          {review.reviewer?.companyName && (
                            <p className="text-xs text-amber-400">{review.reviewer.companyName}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <StarRating rating={review.rating} size="sm" />
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-muted-foreground leading-relaxed mt-1">{review.comment}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-2">{formatDate(review.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Bottom spacing */}
        <div className="h-16" />
      </div>
    </div>
  )
}
