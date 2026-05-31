'use client'

import { useAppStore } from '@/lib/store'
import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft, MapPin, Star, MessageSquare, Share2, CheckCircle, Shield,
  Sprout, TrendingUp, Package, Clock, Award, Phone, Mail, Building2,
  ChevronRight, Image as ImageIcon, BadgeCheck, Calendar, IndianRupee
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'

interface ProducerData {
  id: string
  name: string
  email: string
  role: string
  companyName?: string
  phone?: string
  state?: string
  city?: string
  verificationStatus: string
  avatar?: string
  farmName?: string
  farmSize?: string
  farmLocation?: string
  farmImages?: string
  yearsExperience?: number
  certifications?: string
  totalTransactions: number
  latitude?: string
  longitude?: string
  avgRating: number
  totalReviews: number
  createdAt: string
  _count?: {
    products: number
    ordersAsBuyer: number
    ordersAsSeller: number
  }
}

interface ProductData {
  id: string
  name: string
  category: string
  pricePerUnit: number
  unit: string
  quantity: number
  qualityGrade?: string
  location: string
  imageUrl?: string
  isActive: boolean
  isOrganic: boolean
}

interface ReviewData {
  id: string
  rating: number
  comment?: string
  createdAt: string
  reviewer: {
    id: string
    name: string
    companyName?: string
    role: string
  }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

const categoryColors: Record<string, string> = {
  grains: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  vegetables: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  fruits: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  spices: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  dairy: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
  poultry: 'bg-lime-500/20 text-lime-400 border-lime-500/30',
  pulses: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  oilseeds: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
}

const certColors: Record<string, string> = {
  'Organic': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  'Organic India': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  'FSSAI': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  'APEDA': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  'Spice Board': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  'Spice Board of India': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  'AGMARK': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  'GI Tag': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
}

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
  const starSize = size === 'lg' ? 'h-5 w-5' : 'h-3.5 w-3.5'
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`${starSize} ${s <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}`}
        />
      ))}
    </div>
  )
}

function RatingDistribution({ reviews }: { reviews: ReviewData[] }) {
  const distribution = [5, 4, 3, 2, 1].map(star => {
    const count = reviews.filter(r => r.rating === star).length
    const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0
    return { star, count, percentage }
  })

  return (
    <div className="space-y-2">
      {distribution.map(({ star, count, percentage }) => (
        <div key={star} className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground w-6 text-right">{star}★</span>
          <div className="flex-1 h-2.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.6, delay: (5 - star) * 0.1 }}
              className="h-full bg-amber-400 rounded-full"
            />
          </div>
          <span className="text-xs text-muted-foreground w-8">{count}</span>
        </div>
      ))}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 glass-card-strong rounded-none border-b border-glass-border px-4 py-3">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-5 w-48" />
        </div>
      </div>
      <div className="max-w-5xl mx-auto p-4 lg:p-8 space-y-6">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <div className="flex gap-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-10 w-80" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      </div>
    </div>
  )
}

export function ProducerProfilePage() {
  const { selectedProducerId, setSelectedProducerId, setSelectedProductId, setView, setActiveChatUser, setChatOpen } = useAppStore()
  const [producer, setProducer] = useState<ProducerData | null>(null)
  const [products, setProducts] = useState<ProductData[]>([])
  const [reviews, setReviews] = useState<ReviewData[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  const fetchProducerData = useCallback(async () => {
    if (!selectedProducerId) return
    setLoading(true)
    try {
      const [userRes, productsRes, reviewsRes] = await Promise.all([
        fetch(`/api/users?id=${selectedProducerId}`),
        fetch(`/api/products?sellerId=${selectedProducerId}`),
        fetch(`/api/reviews?targetId=${selectedProducerId}`),
      ])

      const userData = await userRes.json()
      if (userData.user) setProducer(userData.user)

      const productsData = await productsRes.json()
      if (productsData.products) setProducts(productsData.products)

      const reviewsData = await reviewsRes.json()
      if (reviewsData.reviews) setReviews(reviewsData.reviews)
    } catch {
      toast.error('Failed to load producer profile')
    } finally {
      setLoading(false)
    }
  }, [selectedProducerId])

  useEffect(() => {
    fetchProducerData()
  }, [fetchProducerData])

  const handleBack = () => {
    setView('marketplace')
  }

  const handleMessage = () => {
    if (selectedProducerId) {
      setActiveChatUser(selectedProducerId)
      setChatOpen(true)
    }
  }

  const handleShare = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Profile link copied to clipboard!')
    }).catch(() => {
      toast.success('Share this producer profile!')
    })
  }

  const handleProductClick = (productId: string) => {
    setSelectedProductId(productId)
    setView('product')
  }

  if (loading || !producer) {
    return <LoadingSkeleton />
  }

  const initials = (producer.name || producer.email || 'P').slice(0, 2).toUpperCase()
  const isVerified = producer.verificationStatus === 'verified'
  const isPending = producer.verificationStatus === 'pending'
  const certificationList = producer.certifications
    ? producer.certifications.split(',').map(c => c.trim()).filter(Boolean)
    : []
  const farmImageList = producer.farmImages
    ? producer.farmImages.split(',').map(u => u.trim()).filter(Boolean)
    : []
  const productCategories = [...new Set(products.map(p => p.category))]

  const gradientClass = isVerified
    ? 'from-emerald-900/60 via-emerald-800/40 to-amber-900/30'
    : 'from-amber-900/40 via-amber-800/30 to-emerald-900/20'

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 glass-card-strong rounded-none border-b border-glass-border px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground shrink-0"
            onClick={handleBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-semibold text-foreground truncate">{producer.name}</h1>
            <p className="text-xs text-muted-foreground truncate">{producer.companyName || 'Producer'}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-glass-border gap-1.5 text-sm"
              onClick={handleMessage}
            >
              <MessageSquare className="h-4 w-4" /> Message
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-glass-border gap-1.5 text-sm"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4" /> Share
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 lg:p-8">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* Profile Header */}
          <motion.div variants={fadeUp} className="relative">
            {/* Cover */}
            <div className={`h-40 sm:h-52 rounded-2xl bg-gradient-to-r ${gradientClass} relative overflow-hidden`}>
              <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
              {/* Decorative circles */}
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl" />
              <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl" />
            </div>

            {/* Avatar + Info */}
            <div className="px-4 sm:px-6 -mt-14 sm:-mt-16 relative z-10">
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                <Avatar className="h-24 w-24 sm:h-28 sm:w-28 border-4 border-background shadow-lg">
                  <AvatarFallback className="bg-emerald-500/20 text-emerald-400 text-2xl sm:text-3xl font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 pt-2 sm:pb-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-bold text-foreground">{producer.name}</h2>
                    {isVerified && (
                      <BadgeCheck className="h-6 w-6 text-emerald-400" />
                    )}
                  </div>
                  {producer.companyName && (
                    <p className="text-amber-400 font-medium">{producer.companyName}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 mt-1.5">
                    {(producer.city || producer.state) && (
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                        {[producer.city, producer.state].filter(Boolean).join(', ')}
                      </span>
                    )}
                    <Badge className={`border text-xs ${
                      isVerified
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : isPending
                          ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                          : 'bg-red-500/20 text-red-400 border-red-500/30'
                    }`}>
                      {isVerified ? (
                        <><CheckCircle className="h-3 w-3 mr-1" /> Verified</>
                      ) : isPending ? (
                        <><Clock className="h-3 w-3 mr-1" /> Pending</>
                      ) : (
                        <><Shield className="h-3 w-3 mr-1" /> Rejected</>
                      )}
                    </Badge>
                  </div>
                  {/* Rating */}
                  <div className="flex items-center gap-2 mt-2">
                    <StarRating rating={producer.avgRating} size="sm" />
                    <span className="text-sm font-semibold text-amber-400">{producer.avgRating.toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground">({producer.totalReviews} reviews)</span>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-3 mt-5">
                <div className="glass-card p-3 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <Clock className="h-4 w-4 text-emerald-400" />
                  </div>
                  <p className="text-lg font-bold text-foreground">{producer.yearsExperience || 0}</p>
                  <p className="text-[11px] text-muted-foreground">Years Exp.</p>
                </div>
                <div className="glass-card p-3 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <Package className="h-4 w-4 text-amber-400" />
                  </div>
                  <p className="text-lg font-bold text-foreground">{producer.totalTransactions}</p>
                  <p className="text-[11px] text-muted-foreground">Transactions</p>
                </div>
                <div className="glass-card p-3 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <Sprout className="h-4 w-4 text-emerald-400" />
                  </div>
                  <p className="text-lg font-bold text-foreground">{producer.farmSize || 'N/A'}</p>
                  <p className="text-[11px] text-muted-foreground">Farm Size</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Main Content Tabs */}
          <motion.div variants={fadeUp}>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-white/5 border border-glass-border rounded-xl p-1 h-auto w-full sm:w-auto">
                {['overview', 'products', 'reviews', 'contact'].map((tab) => (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    className="capitalize data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 rounded-lg text-sm px-4 py-2"
                  >
                    {tab === 'reviews' ? `Reviews (${producer.totalReviews})` : tab === 'products' ? `Products (${products.length})` : tab}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-6 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* About the Farm */}
                  <motion.div variants={fadeUp} className="glass-card p-5 space-y-4">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <Sprout className="h-5 w-5 text-emerald-400" /> About the Farm
                    </h3>
                    <div className="space-y-3">
                      {producer.farmName && (
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Farm Name</p>
                            <p className="text-sm font-medium text-foreground">{producer.farmName}</p>
                          </div>
                        </div>
                      )}
                      {producer.farmSize && (
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
                            <MapPin className="h-4 w-4 text-amber-400" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Farm Size</p>
                            <p className="text-sm font-medium text-foreground">{producer.farmSize}</p>
                          </div>
                        </div>
                      )}
                      {producer.farmLocation && (
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                            <MapPin className="h-4 w-4 text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Farm Location</p>
                            <p className="text-sm font-medium text-foreground">{producer.farmLocation}</p>
                          </div>
                        </div>
                      )}
                      {(producer.yearsExperience ?? 0) > 0 && (
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
                            <Clock className="h-4 w-4 text-amber-400" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Years of Experience</p>
                            <p className="text-sm font-medium text-foreground">{producer.yearsExperience} years</p>
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Bio/description */}
                    <div className="pt-2 border-t border-glass-border">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {producer.name}{producer.companyName ? `, operating as ${producer.companyName}` : ''}, is a{isVerified ? ' verified' : ''} agricultural producer
                        {producer.farmName ? ` running ${producer.farmName}` : ''}
                        {producer.state ? ` based in ${producer.state}` : ''}
                        {producer.yearsExperience ? ` with ${producer.yearsExperience} years of farming experience` : ''}.
                        {producer.farmSize ? ` The farm spans ${producer.farmSize}.` : ''}
                        {certificationList.length > 0 ? ` Holds certifications in ${certificationList.join(', ')}.` : ''}
                      </p>
                    </div>
                  </motion.div>

                  {/* Certifications Card */}
                  <motion.div variants={fadeUp} className="glass-card p-5 space-y-4">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <Award className="h-5 w-5 text-amber-400" /> Certifications
                    </h3>
                    {certificationList.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {certificationList.map((cert, i) => (
                          <Badge
                            key={i}
                            className={`${certColors[cert] || 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'} border gap-1.5 px-3 py-1.5`}
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            {cert}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground py-4 text-center">No certifications listed</p>
                    )}
                  </motion.div>
                </div>

                {/* Farm Gallery */}
                <motion.div variants={fadeUp} className="glass-card p-5 space-y-4">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-emerald-400" /> Farm Gallery
                  </h3>
                  {farmImageList.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {farmImageList.map((img, i) => (
                        <div key={i} className="aspect-square rounded-xl overflow-hidden border border-glass-border">
                          <img src={img} alt={`Farm image ${i + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {['from-emerald-900/40 to-emerald-800/20', 'from-amber-900/40 to-amber-800/20', 'from-emerald-900/30 to-amber-900/20', 'from-amber-900/30 to-emerald-900/20'].map((gradient, i) => (
                        <div key={i} className={`aspect-square rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center border border-glass-border`}>
                          <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>

                {/* Key Statistics */}
                <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[
                    { label: 'Active Listings', value: products.filter(p => p.isActive).length, icon: <Package className="h-4 w-4 text-emerald-400" /> },
                    { label: 'Total Transactions', value: producer.totalTransactions, icon: <TrendingUp className="h-4 w-4 text-amber-400" /> },
                    { label: 'Average Rating', value: producer.avgRating.toFixed(1), icon: <Star className="h-4 w-4 text-amber-400 fill-amber-400" /> },
                    { label: 'Years of Experience', value: producer.yearsExperience || 0, icon: <Clock className="h-4 w-4 text-emerald-400" /> },
                    { label: 'Repeat Buyer Rate', value: '78%', icon: <Award className="h-4 w-4 text-amber-400" /> },
                  ].map((stat, i) => (
                    <div key={i} className="glass-card p-4 text-center">
                      <div className="flex items-center justify-center mb-2">{stat.icon}</div>
                      <p className="text-lg font-bold text-foreground">{stat.value}</p>
                      <p className="text-[11px] text-muted-foreground">{stat.label}</p>
                    </div>
                  ))}
                </motion.div>
              </TabsContent>

              {/* Products Tab */}
              <TabsContent value="products" className="mt-6 space-y-6">
                {/* Product Categories */}
                {productCategories.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 border cursor-pointer"
                    >
                      All
                    </Badge>
                    {productCategories.map(cat => (
                      <Badge
                        key={cat}
                        className={`${categoryColors[cat] || 'bg-white/10 text-muted-foreground border-glass-border'} border capitalize cursor-pointer`}
                      >
                        {cat}
                      </Badge>
                    ))}
                  </div>
                )}

                {products.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.map((product, i) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        whileHover={{ y: -4 }}
                        className="glass-card p-4 cursor-pointer hover:border-emerald-500/30 transition-all"
                        onClick={() => handleProductClick(product.id)}
                      >
                        {/* Image placeholder */}
                        <div className="aspect-[4/3] rounded-lg bg-gradient-to-br from-emerald-900/30 to-amber-900/20 mb-3 flex items-center justify-center relative overflow-hidden">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <Package className="h-8 w-8 text-muted-foreground/20" />
                          )}
                          {/* Category badge */}
                          <Badge className={`absolute top-2 left-2 ${categoryColors[product.category] || 'bg-white/10 text-muted-foreground border-glass-border'} border text-[10px] capitalize`}>
                            {product.category}
                          </Badge>
                          {product.qualityGrade && (
                            <Badge className={`absolute top-2 right-2 border text-[10px] ${
                              product.qualityGrade === 'A' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                              product.qualityGrade === 'B' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                              'bg-red-500/20 text-red-400 border-red-500/30'
                            }`}>
                              Grade {product.qualityGrade}
                            </Badge>
                          )}
                          {product.isOrganic && (
                            <Badge className="absolute bottom-2 left-2 bg-emerald-500/20 text-emerald-400 border-emerald-500/30 border text-[10px]">
                              Organic
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-semibold text-foreground text-sm mb-1">{product.name}</h4>
                        <div className="flex items-center justify-between">
                          <span className="text-amber-400 font-bold flex items-center gap-0.5 text-sm">
                            <IndianRupee className="h-3.5 w-3.5" />{product.pricePerUnit.toLocaleString()}/{product.unit}
                          </span>
                          <span className="text-xs text-muted-foreground">{product.quantity} {product.unit} available</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3 text-emerald-400" />
                          {product.location}
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto mt-1" />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="glass-card p-12 text-center">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No active product listings</p>
                  </div>
                )}
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews" className="mt-6 space-y-6">
                {/* Rating Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <motion.div variants={fadeUp} className="glass-card p-5 text-center">
                    <p className="text-5xl font-bold text-foreground">{producer.avgRating.toFixed(1)}</p>
                    <StarRating rating={producer.avgRating} size="lg" />
                    <p className="text-sm text-muted-foreground mt-2">{producer.totalReviews} total reviews</p>
                  </motion.div>
                  <motion.div variants={fadeUp} className="glass-card p-5">
                    <h4 className="text-sm font-medium text-foreground mb-3">Rating Distribution</h4>
                    <RatingDistribution reviews={reviews} />
                  </motion.div>
                </div>

                {/* Individual Reviews */}
                {reviews.length > 0 ? (
                  <div className="space-y-3">
                    {reviews.map((review, i) => (
                      <motion.div
                        key={review.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="glass-card p-4 space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 border border-glass-border">
                              <AvatarFallback className="bg-amber-500/20 text-amber-400 text-xs font-semibold">
                                {(review.reviewer.name || 'U').slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium text-foreground">{review.reviewer.name || 'Anonymous'}</p>
                              {review.reviewer.companyName && (
                                <p className="text-xs text-muted-foreground">{review.reviewer.companyName}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 border text-[10px]">
                              <CheckCircle className="h-2.5 w-2.5 mr-1" /> Verified Buyer
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <StarRating rating={review.rating} size="sm" />
                          <span className="text-xs text-muted-foreground">
                            {new Date(review.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
                        )}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="glass-card p-12 text-center">
                    <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No reviews yet</p>
                  </div>
                )}
              </TabsContent>

              {/* Contact & Location Tab */}
              <TabsContent value="contact" className="mt-6 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Contact Information */}
                  <motion.div variants={fadeUp} className="glass-card p-5 space-y-4">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <Phone className="h-5 w-5 text-emerald-400" /> Contact Information
                    </h3>
                    <div className="space-y-3">
                      {producer.phone && (
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                            <Phone className="h-4 w-4 text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Phone</p>
                            <p className="text-sm font-medium text-foreground">{producer.phone}</p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-amber-500/15 flex items-center justify-center">
                          <Mail className="h-4 w-4 text-amber-400" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Email</p>
                          <p className="text-sm font-medium text-foreground">{producer.email}</p>
                        </div>
                      </div>
                      {producer.companyName && (
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Company</p>
                            <p className="text-sm font-medium text-foreground">{producer.companyName}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <Button
                      className="w-full bg-emerald-600 hover:bg-emerald-500 gap-2 mt-2"
                      onClick={handleMessage}
                    >
                      <MessageSquare className="h-4 w-4" /> Send Message
                    </Button>
                  </motion.div>

                  {/* Location Map */}
                  <motion.div variants={fadeUp} className="glass-card p-5 space-y-4">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-amber-400" /> Location
                    </h3>
                    {/* SVG Map Representation */}
                    <div className="aspect-[4/3] rounded-xl bg-gradient-to-br from-emerald-900/20 to-amber-900/10 border border-glass-border relative overflow-hidden flex items-center justify-center">
                      <svg viewBox="0 0 400 300" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                        {/* Background grid */}
                        <defs>
                          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                          </pattern>
                        </defs>
                        <rect width="400" height="300" fill="url(#grid)" />
                        {/* Route lines */}
                        <path d="M 80 100 Q 200 80 320 180" fill="none" stroke="rgba(16,185,129,0.2)" strokeWidth="1.5" strokeDasharray="4 4" />
                        {/* Location pin */}
                        <g transform={`translate(${producer.longitude ? Math.min(350, Math.max(50, parseFloat(producer.longitude) * 3 + 200)) : 200}, ${producer.latitude ? Math.min(250, Math.max(50, 300 - parseFloat(producer.latitude) * 3)) : 150})`}>
                          <circle r="16" fill="rgba(16,185,129,0.15)" />
                          <circle r="8" fill="rgba(16,185,129,0.3)" />
                          <circle r="4" fill="#10b981" />
                          {/* Pin triangle */}
                          <path d="M 0 -24 L -8 -12 L 8 -12 Z" fill="#10b981" />
                          <circle cy="-28" r="6" fill="#10b981" stroke="rgba(0,0,0,0.3)" strokeWidth="1" />
                          <circle cy="-28" r="2" fill="white" />
                        </g>
                        {/* Label */}
                        <text x="200" y="270" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="11" fontFamily="system-ui">
                          {[producer.city, producer.state].filter(Boolean).join(', ') || 'Location'}
                          {producer.latitude && producer.longitude ? ` (${parseFloat(producer.latitude).toFixed(2)}°, ${parseFloat(producer.longitude).toFixed(2)}°)` : ''}
                        </text>
                      </svg>
                    </div>
                    {/* Full Address */}
                    <div className="space-y-1.5">
                      {producer.farmLocation && (
                        <p className="text-sm text-foreground">{producer.farmLocation}</p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {[producer.city, producer.state].filter(Boolean).join(', ')}
                      </p>
                      {producer.latitude && producer.longitude && (
                        <p className="text-xs text-muted-foreground">
                          Coordinates: {parseFloat(producer.latitude).toFixed(4)}°N, {parseFloat(producer.longitude).toFixed(4)}°E
                        </p>
                      )}
                    </div>
                  </motion.div>
                </div>

                {/* Business Hours */}
                <motion.div variants={fadeUp} className="glass-card p-5 space-y-4">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-emerald-400" /> Business Hours
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { day: 'Monday - Friday', hours: '9:00 AM - 6:00 PM', open: true },
                      { day: 'Saturday', hours: '9:00 AM - 2:00 PM', open: true },
                      { day: 'Sunday', hours: 'Closed', open: false },
                    ].map((schedule) => (
                      <div key={schedule.day} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-glass-border">
                        <span className="text-sm text-foreground">{schedule.day}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm ${schedule.open ? 'text-emerald-400' : 'text-muted-foreground'}`}>{schedule.hours}</span>
                          <div className={`h-2 w-2 rounded-full ${schedule.open ? 'bg-emerald-400' : 'bg-muted-foreground/30'}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
