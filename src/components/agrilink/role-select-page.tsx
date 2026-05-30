'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  Leaf,
  Sprout,
  ShoppingBag,
  Truck,
  Shield,
  ArrowLeft,
  Loader2,
  CheckCircle2,
} from 'lucide-react'
import type { AppUser, UserRole } from '@/lib/store'

// ─── Role Data ───────────────────────────────────────────────────────────────
const roles = [
  {
    id: 'producer' as UserRole,
    title: 'Producer',
    description: 'List your produce, find buyers nationwide',
    icon: Sprout,
    accentColor: 'emerald',
    bgClass: 'bg-emerald-500/15',
    borderClass: 'border-emerald-500/20',
    iconColor: 'text-emerald-400',
    hoverGlow: 'hover:shadow-emerald-500/20',
    selectedBg: 'bg-emerald-500/20',
    selectedBorder: 'border-emerald-500/50',
    glowClass: 'group-hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]',
  },
  {
    id: 'buyer' as UserRole,
    title: 'Buyer',
    description: 'Source verified agricultural products at best prices',
    icon: ShoppingBag,
    accentColor: 'amber',
    bgClass: 'bg-amber-500/15',
    borderClass: 'border-amber-500/20',
    iconColor: 'text-amber-400',
    hoverGlow: 'hover:shadow-amber-500/20',
    selectedBg: 'bg-amber-500/20',
    selectedBorder: 'border-amber-500/50',
    glowClass: 'group-hover:shadow-[0_0_30px_rgba(245,158,11,0.15)]',
  },
  {
    id: 'transporter' as UserRole,
    title: 'Transporter',
    description: 'Find loads, bid on shipments, grow your fleet',
    icon: Truck,
    accentColor: 'teal',
    bgClass: 'bg-teal-500/15',
    borderClass: 'border-teal-500/20',
    iconColor: 'text-teal-400',
    hoverGlow: 'hover:shadow-teal-500/20',
    selectedBg: 'bg-teal-500/20',
    selectedBorder: 'border-teal-500/50',
    glowClass: 'group-hover:shadow-[0_0_30px_rgba(20,184,166,0.15)]',
  },
  {
    id: 'admin' as UserRole,
    title: 'Administrator',
    description: 'Manage platform operations and verification',
    icon: Shield,
    accentColor: 'purple',
    bgClass: 'bg-purple-500/15',
    borderClass: 'border-purple-500/20',
    iconColor: 'text-purple-400',
    hoverGlow: 'hover:shadow-purple-500/20',
    selectedBg: 'bg-purple-500/20',
    selectedBorder: 'border-purple-500/50',
    glowClass: 'group-hover:shadow-[0_0_30px_rgba(168,85,247,0.15)]',
  },
]

// ─── Animation Variants ──────────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.2,
    },
  },
}

const headerVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
}

const buttonVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.6 },
  },
}

// ─── Role Select Page ────────────────────────────────────────────────────────
export function RoleSelectPage() {
  const { setView, setUser, user } = useAppStore()
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleRoleSelect = async (role: UserRole) => {
    setSelectedRole(role)
    setIsLoading(true)

    try {
      // If user already exists, update with role; otherwise create
      const email = user?.email || `${role}@agrilink.in`
      const name = user?.name || role.charAt(0).toUpperCase() + role.slice(1)

      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name,
          role,
          companyName: user?.companyName || undefined,
          phone: user?.phone || undefined,
          state: user?.state || undefined,
          city: user?.city || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to set role. Please try again.')
        setIsLoading(false)
        return
      }

      const updatedUser: AppUser = {
        id: data.user.id,
        name: data.user.name || '',
        email: data.user.email,
        role: data.user.role as UserRole,
        companyName: data.user.companyName || undefined,
        phone: data.user.phone || undefined,
        state: data.user.state || undefined,
        city: data.user.city || undefined,
        verificationStatus: data.user.verificationStatus,
        avatar: data.user.avatar || undefined,
      }

      setUser(updatedUser)

      const roleName = role.charAt(0).toUpperCase() + role.slice(1)
      toast.success(`Welcome! You're now signed in as a ${roleName}.`)

      // Brief delay for visual feedback
      setTimeout(() => {
        setView('dashboard')
      }, 600)
    } catch {
      toast.error('Something went wrong. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden px-4 py-8">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] animate-float" />
      <div
        className="absolute bottom-1/4 -right-20 w-80 h-80 bg-amber-500/8 rounded-full blur-[100px]"
        style={{ animationDelay: '1.5s', animation: 'float 4.5s ease-in-out infinite' }}
      />
      <div
        className="absolute top-1/2 left-1/3 w-64 h-64 bg-purple-500/5 rounded-full blur-[80px]"
        style={{ animationDelay: '0.8s', animation: 'float 3.5s ease-in-out infinite' }}
      />

      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        onClick={() => setView('landing')}
        className="absolute top-6 left-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group z-10"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        <span>Back to Home</span>
      </motion.button>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-2xl"
      >
        {/* Header */}
        <motion.div variants={headerVariants} className="text-center mb-10">
          <div className="flex items-center justify-center gap-2.5 mb-6">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30">
              <Leaf className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              <span className="text-emerald-400">Agri</span>
              <span className="text-foreground">Link</span>
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-3">
            How would you like to use{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-amber-400 bg-clip-text text-transparent">
              AgriLink
            </span>
            ?
          </h1>
          <p className="text-muted-foreground text-lg">
            Choose your role to get started
          </p>
        </motion.div>

        {/* Role Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {roles.map((role) => {
            const Icon = role.icon
            const isSelected = selectedRole === role.id
            const isLoadingThis = isLoading && isSelected

            return (
              <motion.div
                key={role.id}
                variants={cardVariants}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => !isLoading && handleRoleSelect(role.id)}
                className={`
                  group relative cursor-pointer rounded-2xl p-6 transition-all duration-300
                  border
                  ${isSelected
                    ? `${role.selectedBg} ${role.selectedBorder} shadow-lg ${role.hoverGlow}`
                    : `glass-card hover:bg-white/[0.07] ${role.glowClass}`
                  }
                  ${isLoadingThis ? 'opacity-80' : ''}
                `}
              >
                {/* Selected Check */}
                {isSelected && !isLoadingThis && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-4 right-4"
                  >
                    <CheckCircle2 className={`w-5 h-5 ${role.iconColor}`} />
                  </motion.div>
                )}

                {/* Loading Spinner */}
                {isLoadingThis && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-4 right-4"
                  >
                    <Loader2 className={`w-5 h-5 animate-spin ${role.iconColor}`} />
                  </motion.div>
                )}

                {/* Icon */}
                <div
                  className={`w-14 h-14 rounded-2xl ${role.bgClass} border ${role.borderClass} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  <Icon className={`w-7 h-7 ${role.iconColor}`} />
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-foreground mb-1.5">
                  {role.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {role.description}
                </p>
              </motion.div>
            )
          })}
        </div>

        {/* Footer Note */}
        <motion.div variants={buttonVariants} className="text-center mt-8">
          <p className="text-xs text-muted-foreground">
            You can change your role later from your profile settings
          </p>
          <Button
            onClick={() => setView('auth')}
            variant="ghost"
            className="mt-3 text-muted-foreground hover:text-foreground text-sm"
          >
            Already have an account? Sign In
          </Button>
        </motion.div>
      </motion.div>
    </div>
  )
}
