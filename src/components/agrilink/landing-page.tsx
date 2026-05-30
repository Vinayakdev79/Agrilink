'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useInView, useAnimation } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import {
  Leaf,
  TrendingUp,
  Shield,
  Truck,
  MapPin,
  CheckCircle2,
  ArrowRight,
  Menu,
  X,
  ChevronRight,
  Package,
  Clock,
  Route,
  Globe,
  Twitter,
  Github,
  Linkedin,
  Mail,
  BadgeCheck,
  Star,
  Zap,
  BarChart3,
} from 'lucide-react'

// ─── Animated Counter Hook ───────────────────────────────────────────────────
function useCountUp(end: number, duration = 2000, startOnView = true) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })
  const hasStarted = useRef(false)

  useEffect(() => {
    if (!startOnView || !isInView) return
    if (hasStarted.current) return
    hasStarted.current = true

    let startTime: number
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      setCount(Math.floor(eased * end))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [isInView, end, duration, startOnView])

  return { count, ref }
}

// ─── Data ────────────────────────────────────────────────────────────────────
const marketplaceProducts = [
  {
    id: 1,
    name: 'Basmati Rice (1121)',
    price: '₹4,200',
    unit: '/quintal',
    location: 'Patiala, Punjab',
    quality: 'A+',
    seller: 'Guru Granth Foods',
    verified: true,
    trend: '+3.2%',
    category: 'Grains',
  },
  {
    id: 2,
    name: 'Alphonso Mango',
    price: '₹8,500',
    unit: '/quintal',
    location: 'Ratnagiri, Maharashtra',
    quality: 'Premium',
    seller: 'Konkan Harvests',
    verified: true,
    trend: '+5.1%',
    category: 'Fruits',
  },
  {
    id: 3,
    name: 'Turmeric (Sangli)',
    price: '₹6,800',
    unit: '/quintal',
    location: 'Sangli, Maharashtra',
    quality: 'A',
    seller: 'Sahyadri Spices',
    verified: true,
    trend: '-1.4%',
    category: 'Spices',
  },
  {
    id: 4,
    name: 'Cotton (Shankar-6)',
    price: '₹7,100',
    unit: '/quintal',
    location: 'Rajkot, Gujarat',
    quality: 'A+',
    seller: 'Saurashtra Cotton Co.',
    verified: true,
    trend: '+2.8%',
    category: 'Fiber',
  },
  {
    id: 5,
    name: 'Assam Tea (CTC)',
    price: '₹2,900',
    unit: '/quintal',
    location: 'Jorhat, Assam',
    quality: 'BOPSM',
    seller: 'Brahmaputra Estates',
    verified: false,
    trend: '+0.9%',
    category: 'Beverages',
  },
  {
    id: 6,
    name: 'Onion (Nashik Red)',
    price: '₹1,400',
    unit: '/quintal',
    location: 'Nashik, Maharashtra',
    quality: 'A',
    seller: 'Khandesh Produce',
    verified: true,
    trend: '-3.7%',
    category: 'Vegetables',
  },
]

const logisticsCities = [
  { name: 'Delhi', x: 52, y: 22 },
  { name: 'Jaipur', x: 40, y: 36 },
  { name: 'Lucknow', x: 58, y: 30 },
  { name: 'Mumbai', x: 22, y: 58 },
  { name: 'Hyderabad', x: 48, y: 62 },
  { name: 'Bengaluru', x: 42, y: 78 },
  { name: 'Chennai', x: 62, y: 74 },
  { name: 'Kolkata', x: 78, y: 34 },
]

const logisticsRoutes = [
  [0, 1], // Delhi - Jaipur
  [0, 2], // Delhi - Lucknow
  [1, 3], // Jaipur - Mumbai
  [3, 4], // Mumbai - Hyderabad
  [4, 5], // Hyderabad - Bengaluru
  [5, 6], // Bengaluru - Chennai
  [2, 7], // Lucknow - Kolkata
  [4, 6], // Hyderabad - Chennai
  [0, 3], // Delhi - Mumbai
  [2, 4], // Lucknow - Hyderabad
]

// ─── Animation Variants ──────────────────────────────────────────────────────
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  },
}

const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.5 },
  },
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
}

// ─── Glowing Orbs Background ────────────────────────────────────────────────
function GlowingOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] animate-float" />
      <div
        className="absolute top-1/3 -left-20 w-72 h-72 bg-emerald-600/8 rounded-full blur-[100px]"
        style={{ animationDelay: '1s', animation: 'float 4s ease-in-out infinite' }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-amber-500/6 rounded-full blur-[100px]"
        style={{ animationDelay: '2s', animation: 'float 5s ease-in-out infinite' }}
      />
      <div
        className="absolute bottom-0 left-1/3 w-64 h-64 bg-emerald-400/5 rounded-full blur-[80px]"
        style={{ animationDelay: '0.5s', animation: 'float 3.5s ease-in-out infinite' }}
      />
    </div>
  )
}

// ─── Navbar ──────────────────────────────────────────────────────────────────
function Navbar() {
  const setView = useAppStore((s) => s.setView)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="sticky top-0 z-50 w-full"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="glass-card-strong mt-3 px-4 sm:px-6 py-3 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30">
              <Leaf className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              <span className="text-emerald-400">Agri</span>
              <span className="text-foreground">Link</span>
            </span>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {['Marketplace', 'Logistics', 'About'].map((item) => (
              <button
                key={item}
                onClick={() => {
                  if (item === 'Marketplace') setView('marketplace')
                  else if (item === 'Logistics') setView('logistics')
                }}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-white/5"
              >
                {item}
              </button>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => setView('auth')}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-white/5"
            >
              Sign In
            </button>
            <button
              onClick={() => setView('role-select')}
              className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-emerald-500 text-white hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-400/30"
            >
              Get Started
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-white/5 text-muted-foreground"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-card-strong mt-2 p-4 md:hidden"
          >
            <div className="flex flex-col gap-2">
              {['Marketplace', 'Logistics', 'About'].map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    if (item === 'Marketplace') setView('marketplace')
                    else if (item === 'Logistics') setView('logistics')
                    setMobileOpen(false)
                  }}
                  className="px-4 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-white/5 text-left"
                >
                  {item}
                </button>
              ))}
              <div className="border-t border-white/10 my-2" />
              <button
                onClick={() => {
                  setView('auth')
                  setMobileOpen(false)
                }}
                className="px-4 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-white/5 text-left"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setView('role-select')
                  setMobileOpen(false)
                }}
                className="px-5 py-3 text-sm font-semibold rounded-xl bg-emerald-500 text-white hover:bg-emerald-400 transition-all text-center"
              >
                Get Started
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.nav>
  )
}

// ─── Hero Section ────────────────────────────────────────────────────────────
function HeroSection() {
  const setView = useAppStore((s) => s.setView)

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      <GlowingOrbs />
      <div className="absolute inset-0 bg-grid-pattern opacity-40" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-28 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Copy */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            <motion.div variants={fadeUp}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-6">
                <Zap className="w-3.5 h-3.5" />
                <span>India&apos;s #1 Agricultural Trade Platform</span>
              </div>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.08] tracking-tight"
            >
              <span className="text-foreground">India&apos;s</span>
              <br />
              <span className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-amber-400 bg-clip-text text-transparent">
                Agricultural Trade
              </span>
              <br />
              <span className="text-foreground">Infrastructure</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-lg sm:text-xl text-muted-foreground max-w-xl leading-relaxed"
            >
              Connecting producers, buyers, and logistics across 28 states. Transparent pricing,
              verified suppliers, seamless trade.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-wrap gap-4 pt-2">
              <button
                onClick={() => setView('role-select')}
                className="group px-7 py-3.5 text-sm font-semibold rounded-xl bg-emerald-500 text-white hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-400/30 flex items-center gap-2"
              >
                Start Trading
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
              <button
                onClick={() => setView('marketplace')}
                className="group px-7 py-3.5 text-sm font-semibold rounded-xl bg-white/5 border border-white/10 text-foreground hover:bg-white/10 hover:border-white/20 transition-all flex items-center gap-2"
              >
                View Marketplace
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="flex items-center gap-6 pt-4 text-sm text-muted-foreground"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>No hidden fees</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>GST verified</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Escrow protected</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right: Floating Stats */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="relative hidden lg:block"
          >
            <div className="relative h-[500px]">
              {/* Decorative ring */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-80 h-80 rounded-full border border-emerald-500/10" />
                <div className="absolute w-96 h-96 rounded-full border border-emerald-500/5" />
              </div>

              {/* Stat Card 1 */}
              <motion.div
                variants={scaleIn}
                className="absolute top-4 right-8 glass-card p-5 min-w-[200px] animate-float"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      <CountUpNumber end={2.4} prefix="₹" suffix="Cr+" decimals={1} />
                    </p>
                    <p className="text-xs text-muted-foreground">Trade Volume</p>
                  </div>
                </div>
              </motion.div>

              {/* Stat Card 2 */}
              <motion.div
                variants={scaleIn}
                className="absolute top-36 left-4 glass-card p-5 min-w-[180px]"
                style={{ animation: 'float 3.5s ease-in-out infinite', animationDelay: '0.5s' }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      <CountUpNumber end={28} suffix=" States" />
                    </p>
                    <p className="text-xs text-muted-foreground">Covered</p>
                  </div>
                </div>
              </motion.div>

              {/* Stat Card 3 */}
              <motion.div
                variants={scaleIn}
                className="absolute bottom-28 right-4 glass-card p-5 min-w-[200px]"
                style={{ animation: 'float 4s ease-in-out infinite', animationDelay: '1s' }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                    <BadgeCheck className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      <CountUpNumber end={15000} suffix="+" formatNumber />
                    </p>
                    <p className="text-xs text-muted-foreground">Verified Suppliers</p>
                  </div>
                </div>
              </motion.div>

              {/* Stat Card 4 */}
              <motion.div
                variants={scaleIn}
                className="absolute bottom-4 left-16 glass-card p-5 min-w-[180px]"
                style={{ animation: 'float 3s ease-in-out infinite', animationDelay: '1.5s' }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      <CountUpNumber end={99.9} suffix="%" decimals={1} />
                    </p>
                    <p className="text-xs text-muted-foreground">Uptime</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// ─── Count Up Number ─────────────────────────────────────────────────────────
function CountUpNumber({
  end,
  prefix = '',
  suffix = '',
  decimals = 0,
  formatNumber = false,
}: {
  end: number
  prefix?: string
  suffix?: string
  decimals?: number
  formatNumber?: boolean
}) {
  const { count, ref } = useCountUp(end * Math.pow(10, decimals), 2000)
  const displayValue = count / Math.pow(10, decimals)
  const formatted = formatNumber
    ? displayValue.toLocaleString('en-IN')
    : displayValue.toFixed(decimals)

  return (
    <span ref={ref}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  )
}

// ─── Live Marketplace Preview ────────────────────────────────────────────────
function MarketplacePreview() {
  const setView = useAppStore((s) => s.setView)

  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          badge="Live Marketplace"
          title="Real-Time Commodity Prices"
          subtitle="Verified listings from across India. Updated every minute with mandi prices and quality grades."
        />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-12"
        >
          {marketplaceProducts.map((product) => (
            <motion.div key={product.id} variants={fadeUp}>
              <ProductCard product={product} />
            </motion.div>
          ))}
        </motion.div>

        <div className="flex justify-center mt-10">
          <button
            onClick={() => setView('marketplace')}
            className="group px-7 py-3.5 text-sm font-semibold rounded-xl bg-white/5 border border-white/10 text-foreground hover:bg-white/10 hover:border-white/20 transition-all flex items-center gap-2"
          >
            View All Listings
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </section>
  )
}

function ProductCard({
  product,
}: {
  product: (typeof marketplaceProducts)[number]
}) {
  const isPositive = product.trend.startsWith('+')

  return (
    <div className="glass-card p-5 hover:bg-white/[0.07] transition-all duration-300 group cursor-pointer">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-foreground text-sm leading-tight group-hover:text-emerald-400 transition-colors">
            {product.name}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {product.location}
          </p>
        </div>
        <span
          className={`text-xs font-semibold px-2 py-1 rounded-lg ${
            isPositive
              ? 'bg-emerald-500/10 text-emerald-400'
              : 'bg-red-500/10 text-red-400'
          }`}
        >
          {product.trend}
        </span>
      </div>

      <div className="flex items-end justify-between mt-4">
        <div>
          <span className="text-xl font-bold text-foreground">{product.price}</span>
          <span className="text-xs text-muted-foreground">{product.unit}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium px-2 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            {product.quality}
          </span>
          {product.verified && (
            <span className="text-xs font-medium px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Verified
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{product.seller}</span>
        <span className="text-xs text-muted-foreground">{product.category}</span>
      </div>
    </div>
  )
}

// ─── Logistics Visualization ─────────────────────────────────────────────────
function LogisticsSection() {
  const setView = useAppStore((s) => s.setView)

  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          badge="Logistics Network"
          title="Pan-India Supply Chain"
          subtitle="Real-time tracking across major trade routes. From farm gate to warehouse, every shipment accounted for."
        />

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="mt-12"
        >
          <div className="glass-card p-6 lg:p-8">
            <div className="grid lg:grid-cols-5 gap-8 items-center">
              {/* Map Visualization */}
              <div className="lg:col-span-3 relative">
                <svg viewBox="0 0 100 100" className="w-full h-auto max-h-[400px]" xmlns="http://www.w3.org/2000/svg">
                  {/* India outline (simplified) */}
                  <path
                    d="M 30 12 Q 35 8 45 10 Q 55 8 62 14 Q 70 18 75 22 Q 82 28 82 34 Q 84 42 80 46 Q 78 52 72 56 Q 68 60 64 62 Q 58 68 54 72 Q 50 78 46 82 Q 42 86 40 84 Q 36 80 34 74 Q 30 68 26 64 Q 22 58 18 54 Q 14 48 14 42 Q 12 36 16 30 Q 18 24 22 20 Q 26 16 30 12 Z"
                    fill="none"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="0.5"
                  />
                  <path
                    d="M 52 5 Q 54 2 56 4 Q 58 8 56 10 Q 54 12 52 10 Q 50 8 52 5 Z"
                    fill="none"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="0.3"
                  />

                  {/* Animated routes */}
                  {logisticsRoutes.map(([from, to], i) => {
                    const cityFrom = logisticsCities[from]
                    const cityTo = logisticsCities[to]
                    return (
                      <line
                        key={`route-${i}`}
                        x1={cityFrom.x}
                        y1={cityFrom.y}
                        x2={cityTo.x}
                        y2={cityTo.y}
                        stroke="url(#routeGradient)"
                        strokeWidth="0.3"
                        strokeDasharray="2 2"
                        className="animate-route"
                        style={{ animationDelay: `${i * 0.2}s` }}
                      />
                    )
                  })}

                  {/* Gradient definition */}
                  <defs>
                    <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.6" />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.4" />
                    </linearGradient>
                    <radialGradient id="cityGlow">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                    </radialGradient>
                  </defs>

                  {/* City dots */}
                  {logisticsCities.map((city, i) => (
                    <g key={`city-${i}`}>
                      <circle
                        cx={city.x}
                        cy={city.y}
                        r="3"
                        fill="url(#cityGlow)"
                        className="animate-pulse-green"
                        style={{ animationDelay: `${i * 0.3}s` }}
                      />
                      <circle cx={city.x} cy={city.y} r="1" fill="#10b981" />
                      <text
                        x={city.x}
                        y={city.y - 3.5}
                        textAnchor="middle"
                        fill="rgba(255,255,255,0.6)"
                        fontSize="2.5"
                        fontWeight="500"
                      >
                        {city.name}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>

              {/* Stats */}
              <div className="lg:col-span-2 space-y-4">
                <div className="glass-card p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                      <Clock className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">2.4 Days</p>
                      <p className="text-sm text-muted-foreground">Avg. Delivery Time</p>
                    </div>
                  </div>
                </div>

                <div className="glass-card p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                      <Truck className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">3,200+</p>
                      <p className="text-sm text-muted-foreground">Active Transporters</p>
                    </div>
                  </div>
                </div>

                <div className="glass-card p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                      <Route className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">840+</p>
                      <p className="text-sm text-muted-foreground">Routes Covered</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setView('logistics')}
                  className="w-full group px-5 py-3.5 text-sm font-semibold rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-2"
                >
                  Explore Logistics
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ─── Trust Section ───────────────────────────────────────────────────────────
function TrustSection() {
  const features = [
    {
      icon: Shield,
      title: 'GST Verified Suppliers',
      description: 'Every supplier is GST verified for transparent transactions. No unregistered traders.',
      color: 'emerald',
    },
    {
      icon: Package,
      title: 'Escrow Payments',
      description: 'Secure payments held in escrow until delivery confirmation. Your money, protected.',
      color: 'amber',
    },
    {
      icon: Star,
      title: 'Quality Grading',
      description: 'Standardized quality assessment for every listing. Know exactly what you are getting.',
      color: 'emerald',
    },
  ]

  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          badge="Built on Trust"
          title="Enterprise-Grade Security"
          subtitle="Every transaction is protected, every supplier is verified, every product is graded."
        />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12"
        >
          {features.map((feature, i) => {
            const Icon = feature.icon
            const isEmerald = feature.color === 'emerald'
            return (
              <motion.div
                key={i}
                variants={fadeUp}
                className="glass-card p-8 hover:bg-white/[0.07] transition-all duration-300 group"
              >
                <div
                  className={`w-14 h-14 rounded-2xl ${
                    isEmerald ? 'bg-emerald-500/15' : 'bg-amber-500/15'
                  } flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                >
                  <Icon
                    className={`w-7 h-7 ${isEmerald ? 'text-emerald-400' : 'text-amber-400'}`}
                  />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-3">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}

// ─── Footer ──────────────────────────────────────────────────────────────────
function Footer() {
  const setView = useAppStore((s) => s.setView)

  return (
    <footer className="relative border-t border-white/5 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Branding */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30">
                <Leaf className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-xl font-bold tracking-tight">
                <span className="text-emerald-400">Agri</span>
                <span className="text-foreground">Link</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              India&apos;s Agricultural Trade Infrastructure. Connecting producers, buyers, and
              logistics across 28 states with transparent, verified, and secure trading.
            </p>
            <div className="flex items-center gap-3 mt-6">
              {[Twitter, Linkedin, Github, Mail].map((Icon, i) => (
                <button
                  key={i}
                  className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all"
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">Platform</h4>
            <ul className="space-y-3">
              {[
                { label: 'Marketplace', view: 'marketplace' as const },
                { label: 'Logistics', view: 'logistics' as const },
                { label: 'About', view: 'landing' as const },
              ].map((item) => (
                <li key={item.label}>
                  <button
                    onClick={() => setView(item.view)}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">Legal</h4>
            <ul className="space-y-3">
              {['Terms of Service', 'Privacy Policy', 'Contact Us'].map((item) => (
                <li key={item}>
                  <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 mt-10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} AgriLink Technologies Pvt. Ltd. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            Made with <Leaf className="w-3 h-3 text-emerald-400" /> in India
          </p>
        </div>
      </div>
    </footer>
  )
}

// ─── Section Header ──────────────────────────────────────────────────────────
function SectionHeader({
  badge,
  title,
  subtitle,
}: {
  badge: string
  title: string
  subtitle: string
}) {
  return (
    <div className="text-center max-w-2xl mx-auto">
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-6">
        <Leaf className="w-3.5 h-3.5" />
        <span>{badge}</span>
      </div>
      <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">{title}</h2>
      <p className="text-muted-foreground mt-4 text-lg leading-relaxed">{subtitle}</p>
    </div>
  )
}

// ─── Main Landing Page ──────────────────────────────────────────────────────
export function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <MarketplacePreview />
        <LogisticsSection />
        <TrustSection />
      </main>
      <Footer />
    </div>
  )
}
