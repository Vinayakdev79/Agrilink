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
  Zap,
  Send,
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
  const productImage = product.imageUrl || (product.images ? product.images.split(',')[0] : null)

  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="glass-card overflow-hidden cursor-pointer hover:bg-white/[0.07] transition-all min-w-[200px] shrink-0"
      onClick={onClick}
    >
      <div className="aspect-[4/3] relative overflow-hidden">
        {productImage ? (
          <img
            src={productImage}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
            <span className="text-4xl">{emoji}</span>
          </div>
        )}
        {product.qualityGrade && (
          <span className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-md border backdrop-blur-sm ${GRADE_COLORS[product.qualityGrade] || ''}`}>
            {product.qualityGrade}
          </span>
        )}
      </div>
      <div className="p-3">
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

  // Fetch reviews (reviews are per-seller since Review table doesn't have productId)
  useEffect(() => {
    if (!product?.id) return
    const fetchReviews = async () => {
      try {
        // Fetch seller reviews
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
          { id: '1', reviewerId: 'r1', targetId: product.sellerId, rating: 5, comment: 'Excellent quality produce. Very fresh and well-packaged. Will order again!', createdAt: new Date().toISOString(), reviewer: { name: 'Rajesh Kumar', companyName: 'RK Traders' } },
          { id: '2', reviewerId: 'r2', targetId: product.sellerId, rating: 4, comment: 'Good quality and timely delivery. Slight delay in communication but overall satisfied.', createdAt: new Date(Date.now() - 86400000 * 3).toISOString(), reviewer: { name: 'Priya Sharma', companyName: 'Sharma Enterprises' } },
          { id: '3', reviewerId: 'r3', targetId: product.sellerId, rating: 5, comment: 'Best supplier we have worked with. Consistent quality every time.', createdAt: new Date(Date.now() - 86400000 * 7).toISOString(), reviewer: { name: 'Amit Patel' } },
        ])
      } catch {
        setReviews([
          { id: '1', reviewerId: 'r1', targetId: product.sellerId, rating: 5, comment: 'Excellent quality produce. Very fresh and well-packaged!', createdAt: new Date().toISOString(), reviewer: { name: 'Rajesh Kumar' } },
          { id: '2', reviewerId: 'r2', targetId: product.sellerId, rating: 4, comment: 'Good quality and timely delivery. Recommended.', createdAt: new Date(Date.now() - 86400000 * 5).toISOString(), reviewer: { name: 'Priya Sharma' } },
        ])
      }
    }
    fetchReviews()
  }, [product?.id, product?.sellerId])

  // Handle Add to Cart
  const handleAddToCart = () => {
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
    })
    toast.success(`${product.name} added to cart`)
  }

  // Handle Buy Now (add to cart + open cart)
  const handleBuyNow = () => {
    handleAddToCart()
    setCartOpen(true)
  }

  // Handle submit review
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

  // Category helpers
  const catColor = CATEGORY_COLORS[product?.category || ''] || 'bg-gray-500/15 text-gray-400 border-gray-500/25'
  const gradient = CATEGORY_GRADIENTS[product?.category || ''] || 'from-gray-900/40 to-gray-700/20'
  const emoji = CATEGORY_ICONS[product?.category || ''] || '📦'
  const gradeColor = GRADE_COLORS[product?.qualityGrade || ''] || ''

  // Certifications
  const productCerts = product?.certifications ? product.certifications.split(',').map((c) => c.trim()).filter(Boolean) : []
  const producerCerts = producer?.certifications ? producer.certifications.split(',').map((c) => c.trim()).filter(Boolean) : []

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
          {/* ─── Left Column: Product Images + Seller's Other Products ───────── */}
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

            {/* Delivery Estimation Card - Below Image */}
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
                    <span className="text-amber-400 font-semibold">₹{Math.round(totalPrice * 0.035).toLocaleString('en-IN')}</span>
                    <p className="text-[10px] text-muted-foreground">2-5% of order value</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Est. GST (18%)</span>
                  <span className="text-foreground font-medium">₹{Math.round(totalPrice * 0.18).toLocaleString('en-IN')}</span>
                </div>
                <Separator className="bg-white/5" />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Est. Total</span>
                  <span className="text-base font-bold text-emerald-400">₹{Math.round(totalPrice + totalPrice * 0.035 + totalPrice * 0.18).toLocaleString('en-IN')}</span>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground/60">Final cost calculated at checkout based on delivery location</p>
            </div>

            {/* Seller's Other Products */}
            {sellerProducts.length > 0 && (
              <div className="glass-card p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4 text-emerald-400" />
                  Seller&apos;s Other Products
                </h3>
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                  {sellerProducts.map((sp) => (
                    <RelatedProductCard
                      key={sp.id}
                      product={sp}
                      onClick={() => {
                        setSelectedProductId(sp.id)
                        setSelectedImageIdx(0)
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
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
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Add to Cart
                </Button>
                <Button
                  className="h-12 px-5 text-base font-semibold bg-amber-500 hover:bg-amber-400 text-white shadow-lg shadow-amber-500/20"
                  onClick={handleBuyNow}
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Buy Now
                </Button>
              </div>

              <Button
                variant="outline"
                className="w-full h-10 border-white/10 hover:bg-white/5 hover:border-white/20"
                onClick={() => {
                  setActiveChatUser(product.sellerId)
                  setChatOpen(true)
                }}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Message Seller
              </Button>
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
                    <div className="flex flex-wrap gap-2 mt-3">
                      {producerCerts.map((cert, idx) => (
                        <span
                          key={idx}
                          className="text-xs font-medium px-2.5 py-1 rounded-lg border bg-amber-500/10 text-amber-400 border-amber-500/20"
                        >
                          {cert}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex sm:flex-col gap-2 sm:w-48 shrink-0">
                <Button
                  variant="outline"
                  className="flex-1 sm:flex-none border-white/10 hover:bg-white/5 hover:border-white/20"
                  onClick={() => {
                    setSelectedProducerId(product.sellerId)
                    setView('producer-profile')
                  }}
                >
                  <User className="w-4 h-4 mr-2" />
                  View Profile
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 sm:flex-none border-white/10 hover:bg-white/5 hover:border-white/20"
                  onClick={() => {
                    setActiveChatUser(product.sellerId)
                    setChatOpen(true)
                  }}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Message
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 8. Reviews Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="px-4 sm:px-6 mt-8"
        >
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400" />
                Reviews
                {reviews.length > 0 && (
                  <span className="text-sm font-normal text-muted-foreground">
                    ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
                  </span>
                )}
              </h3>
              {reviews.length > 0 && (
                <div className="flex items-center gap-2">
                  <StarRating rating={avgRating} size="sm" />
                  <span className="text-sm font-semibold text-foreground">{avgRating.toFixed(1)}</span>
                </div>
              )}
            </div>

            {/* Write a Review (for buyers) */}
            {user && user.role === 'buyer' && (
              <div className="glass-card p-4 mb-6 space-y-3">
                <h4 className="text-sm font-semibold text-foreground">Write a Review</h4>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Your Rating</Label>
                  <InteractiveStarRating value={reviewRating} onChange={setReviewRating} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Your Review</Label>
                  <Textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share your experience with this product and seller..."
                    className="min-h-[80px] bg-white/5 border-white/10 text-sm text-foreground placeholder:text-muted-foreground/50 resize-none"
                  />
                </div>
                <Button
                  className="bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20"
                  onClick={handleSubmitReview}
                  disabled={submittingReview || reviewRating === 0}
                >
                  {submittingReview ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Review
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Reviews List */}
            {reviews.length === 0 ? (
              <div className="text-center py-8">
                <Star className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No reviews yet. Be the first to review!</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                {reviews.map((review) => (
                  <div key={review.id} className="glass-card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-amber-500/15 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-amber-400">
                            {(review.reviewer?.name || '?')[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {review.reviewer?.name || 'Anonymous'}
                          </p>
                          {review.reviewer?.companyName && (
                            <p className="text-xs text-amber-400/70">{review.reviewer.companyName}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <StarRating rating={review.rating} size="sm" />
                        <span className="text-[10px] text-muted-foreground">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                        {review.comment}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* 9. Similar Products Section */}
        {similarProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="px-4 sm:px-6 mt-8"
          >
            <div className="glass-card p-6">
              <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-emerald-400" />
                Similar Products
              </h3>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                {similarProducts.map((sp) => (
                  <RelatedProductCard
                    key={sp.id}
                    product={sp}
                    onClick={() => {
                      setSelectedProductId(sp.id)
                      setSelectedImageIdx(0)
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Bottom spacing */}
        <div className="h-16" />
      </div>
    </div>
  )
}
