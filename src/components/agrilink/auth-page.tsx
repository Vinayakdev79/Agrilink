'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  Leaf,
  Mail,
  Lock,
  User,
  Phone,
  Building2,
  ArrowLeft,
  Loader2,
  Sparkles,
  Sprout,
  ShoppingBag,
  Truck,
  Shield,
} from 'lucide-react'
import type { AppUser, UserRole } from '@/lib/store'

// ─── Animation Variants ──────────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
}

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  },
}

// ─── Auth Page ───────────────────────────────────────────────────────────────
export function AuthPage() {
  const { setView, setUser } = useAppStore()
  const [activeTab, setActiveTab] = useState<'signin' | 'register'>('signin')
  const [isLoading, setIsLoading] = useState(false)

  // Sign In form state
  const [signInEmail, setSignInEmail] = useState('')
  const [signInPassword, setSignInPassword] = useState('')

  // Register form state
  const [registerName, setRegisterName] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPhone, setRegisterPhone] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerCompany, setRegisterCompany] = useState('')

  const handleSignIn = async () => {
    if (!signInEmail.trim()) {
      toast.error('Please enter your email address')
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch(`/api/auth?email=${encodeURIComponent(signInEmail.trim())}`)
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Account not found. Please register first.')
        return
      }

      const user: AppUser = {
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

      setUser(user)
      toast.success(`Welcome back, ${user.name || user.email}!`)
      setView('dashboard')
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async () => {
    if (!registerName.trim()) {
      toast.error('Please enter your name')
      return
    }
    if (!registerEmail.trim()) {
      toast.error('Please enter your email address')
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: registerEmail.trim(),
          name: registerName.trim(),
          role: 'buyer', // Default role, can be changed in role-select
          phone: registerPhone.trim() || undefined,
          companyName: registerCompany.trim() || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Registration failed. Please try again.')
        return
      }

      const user: AppUser = {
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

      setUser(user)
      toast.success('Account created successfully! Choose your role to get started.')
      setView('role-select')
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRoleDemo = async (email: string, roleName: string) => {
    setIsLoading(true)
    try {
      // Try to get existing user
      const getRes = await fetch(`/api/auth?email=${encodeURIComponent(email)}`)
      if (getRes.ok) {
        const data = await getRes.json()
        const user: AppUser = {
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
        setUser(user)
        toast.success(`Welcome! You're now signed in as a ${roleName}.`)
        setView('dashboard')
        return
      }

      // If not found, create user
      const roleMap: Record<string, { name: string; company: string; phone: string; state: string; city: string }> = {
        'producer1@agrilink.in': { name: 'Rajesh Farmer', company: 'Green Harvest Farms', phone: '+91-9876500001', state: 'Punjab', city: 'Ludhiana' },
        'buyer1@agrilink.in': { name: 'Priya Buyer', company: 'Spice Route Trading', phone: '+91-9876500002', state: 'Maharashtra', city: 'Mumbai' },
        'transport1@agrilink.in': { name: 'Amit Transporter', company: 'Swift Cargo Movers', phone: '+91-9876500003', state: 'Gujarat', city: 'Ahmedabad' },
        'admin@agrilink.in': { name: 'Admin User', company: 'AgriLink Platform', phone: '+91-9876500000', state: 'Delhi', city: 'New Delhi' },
      }
      const roleToType: Record<string, string> = {
        'producer1@agrilink.in': 'producer',
        'buyer1@agrilink.in': 'buyer',
        'transport1@agrilink.in': 'transporter',
        'admin@agrilink.in': 'admin',
      }
      const info = roleMap[email] || { name: roleName, company: '', phone: '', state: '', city: '' }
      const createRes = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: info.name,
          role: roleToType[email] || 'buyer',
          companyName: info.company,
          phone: info.phone,
          state: info.state,
          city: info.city,
        }),
      })

      const data = await createRes.json()

      if (!createRes.ok) {
        toast.error(data.error || `Failed to sign in as ${roleName}`)
        return
      }

      const user: AppUser = {
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

      setUser(user)
      toast.success(`Welcome! You're now signed in as a ${roleName}.`)
      setView('dashboard')
    } catch {
      toast.error(`Failed to sign in as ${roleName}. Please try again.`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoLogin = async () => {
    setIsLoading(true)
    try {
      // First try to get existing demo user
      const getRes = await fetch(`/api/auth?email=${encodeURIComponent('demo@agrilink.in')}`)
      if (getRes.ok) {
        const data = await getRes.json()
        const user: AppUser = {
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
        setUser(user)
        toast.success('Welcome to the AgriLink Demo!')
        setView('dashboard')
        return
      }

      // If not found, create demo user
      const createRes = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'demo@agrilink.in',
          name: 'Demo User',
          role: 'buyer',
          companyName: 'AgriLink Demo Corp',
          phone: '+91-9876543210',
          state: 'Maharashtra',
          city: 'Mumbai',
        }),
      })

      const data = await createRes.json()

      if (!createRes.ok) {
        toast.error(data.error || 'Demo login failed')
        return
      }

      const user: AppUser = {
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

      setUser(user)
      toast.success('Welcome to the AgriLink Demo!')
      setView('dashboard')
    } catch {
      toast.error('Demo login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent, action: 'signin' | 'register') => {
    if (e.key === 'Enter' && !isLoading) {
      if (action === 'signin') handleSignIn()
      else handleRegister()
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden px-4 py-8">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] animate-float" />
      <div
        className="absolute bottom-1/4 -left-20 w-72 h-72 bg-amber-500/8 rounded-full blur-[100px]"
        style={{ animationDelay: '1s', animation: 'float 4s ease-in-out infinite' }}
      />
      <div
        className="absolute top-1/3 right-1/4 w-64 h-64 bg-emerald-400/5 rounded-full blur-[80px]"
        style={{ animationDelay: '2s', animation: 'float 3.5s ease-in-out infinite' }}
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

      {/* Auth Card */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-md"
      >
        <div className="glass-card-strong p-8 sm:p-10">
          {/* Logo */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center mb-8"
          >
            <motion.div variants={itemVariants} className="flex items-center gap-3 mb-4">
              <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30">
                <Leaf className="w-6 h-6 text-emerald-400" />
              </div>
              <span className="text-2xl font-bold tracking-tight">
                <span className="text-emerald-400">Agri</span>
                <span className="text-foreground">Link</span>
              </span>
            </motion.div>
            <motion.p variants={itemVariants} className="text-sm text-muted-foreground text-center">
              Sign in to your account or create a new one
            </motion.p>
          </motion.div>

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as 'signin' | 'register')}
            className="w-full"
          >
            <TabsList className="w-full bg-white/5 border border-white/10 h-11 rounded-xl p-1 mb-6">
              <TabsTrigger
                value="signin"
                className="flex-1 rounded-lg data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 data-[state=active]:border-emerald-500/30 data-[state=active]:border data-[state=active]:shadow-none text-muted-foreground font-medium h-9 transition-all"
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger
                value="register"
                className="flex-1 rounded-lg data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 data-[state=active]:border-emerald-500/30 data-[state=active]:border data-[state=active]:shadow-none text-muted-foreground font-medium h-9 transition-all"
              >
                Register
              </TabsTrigger>
            </TabsList>

            {/* Sign In Form */}
            <TabsContent value="signin">
              <AnimatePresence mode="wait">
                <motion.div
                  key="signin"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-5"
                >
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-muted-foreground text-xs">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="you@example.com"
                        value={signInEmail}
                        onChange={(e) => setSignInEmail(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, 'signin')}
                        className="pl-10 h-11 bg-white/5 border-white/10 focus-visible:border-emerald-500/50 focus-visible:ring-emerald-500/20 placeholder:text-muted-foreground/40 rounded-xl"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="text-muted-foreground text-xs">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                      <Input
                        id="signin-password"
                        type="password"
                        placeholder="Enter your password"
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, 'signin')}
                        className="pl-10 h-11 bg-white/5 border-white/10 focus-visible:border-emerald-500/50 focus-visible:ring-emerald-500/20 placeholder:text-muted-foreground/40 rounded-xl"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleSignIn}
                    disabled={isLoading}
                    className="w-full h-11 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-400/30 transition-all"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Sign In'
                    )}
                  </Button>

                  {/* Demo Login */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-3 bg-card text-muted-foreground">or</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleDemoLogin}
                    disabled={isLoading}
                    variant="outline"
                    className="w-full h-11 border-amber-500/30 bg-amber-500/5 text-amber-400 hover:bg-amber-500/15 hover:border-amber-500/40 font-semibold rounded-xl transition-all"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Try Demo Account
                  </Button>

                  {/* Quick Role Demo */}
                  <div className="space-y-3 mt-4">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/10" />
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="px-3 bg-card text-muted-foreground">Quick Role Demo</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={() => handleRoleDemo('producer1@agrilink.in', 'Producer')}
                        disabled={isLoading}
                        variant="outline"
                        className="h-auto py-3 flex-col gap-1.5 border-emerald-500/30 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/15 hover:border-emerald-500/40 font-medium rounded-xl transition-all"
                      >
                        <Sprout className="w-5 h-5" />
                        <span className="text-xs">Producer</span>
                      </Button>
                      <Button
                        onClick={() => handleRoleDemo('buyer1@agrilink.in', 'Buyer')}
                        disabled={isLoading}
                        variant="outline"
                        className="h-auto py-3 flex-col gap-1.5 border-amber-500/30 bg-amber-500/5 text-amber-400 hover:bg-amber-500/15 hover:border-amber-500/40 font-medium rounded-xl transition-all"
                      >
                        <ShoppingBag className="w-5 h-5" />
                        <span className="text-xs">Buyer</span>
                      </Button>
                      <Button
                        onClick={() => handleRoleDemo('transport1@agrilink.in', 'Transporter')}
                        disabled={isLoading}
                        variant="outline"
                        className="h-auto py-3 flex-col gap-1.5 border-teal-500/30 bg-teal-500/5 text-teal-400 hover:bg-teal-500/15 hover:border-teal-500/40 font-medium rounded-xl transition-all"
                      >
                        <Truck className="w-5 h-5" />
                        <span className="text-xs">Transporter</span>
                      </Button>
                      <Button
                        onClick={() => handleRoleDemo('admin@agrilink.in', 'Admin')}
                        disabled={isLoading}
                        variant="outline"
                        className="h-auto py-3 flex-col gap-1.5 border-purple-500/30 bg-purple-500/5 text-purple-400 hover:bg-purple-500/15 hover:border-purple-500/40 font-medium rounded-xl transition-all"
                      >
                        <Shield className="w-5 h-5" />
                        <span className="text-xs">Admin</span>
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </TabsContent>

            {/* Register Form */}
            <TabsContent value="register">
              <AnimatePresence mode="wait">
                <motion.div
                  key="register"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="register-name" className="text-muted-foreground text-xs">
                      Full Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                      <Input
                        id="register-name"
                        type="text"
                        placeholder="Rajesh Kumar"
                        value={registerName}
                        onChange={(e) => setRegisterName(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, 'register')}
                        className="pl-10 h-11 bg-white/5 border-white/10 focus-visible:border-emerald-500/50 focus-visible:ring-emerald-500/20 placeholder:text-muted-foreground/40 rounded-xl"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email" className="text-muted-foreground text-xs">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="you@example.com"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, 'register')}
                        className="pl-10 h-11 bg-white/5 border-white/10 focus-visible:border-emerald-500/50 focus-visible:ring-emerald-500/20 placeholder:text-muted-foreground/40 rounded-xl"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="register-phone" className="text-muted-foreground text-xs">
                        Phone
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                        <Input
                          id="register-phone"
                          type="tel"
                          placeholder="+91-9876543210"
                          value={registerPhone}
                          onChange={(e) => setRegisterPhone(e.target.value)}
                          className="pl-10 h-11 bg-white/5 border-white/10 focus-visible:border-emerald-500/50 focus-visible:ring-emerald-500/20 placeholder:text-muted-foreground/40 rounded-xl"
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-company" className="text-muted-foreground text-xs">
                        Company
                      </Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                        <Input
                          id="register-company"
                          type="text"
                          placeholder="Your Company"
                          value={registerCompany}
                          onChange={(e) => setRegisterCompany(e.target.value)}
                          className="pl-10 h-11 bg-white/5 border-white/10 focus-visible:border-emerald-500/50 focus-visible:ring-emerald-500/20 placeholder:text-muted-foreground/40 rounded-xl"
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password" className="text-muted-foreground text-xs">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="Create a strong password"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, 'register')}
                        className="pl-10 h-11 bg-white/5 border-white/10 focus-visible:border-emerald-500/50 focus-visible:ring-emerald-500/20 placeholder:text-muted-foreground/40 rounded-xl"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleRegister}
                    disabled={isLoading}
                    className="w-full h-11 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-400/30 transition-all mt-2"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </motion.div>
              </AnimatePresence>
            </TabsContent>
          </Tabs>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-white/5 text-center">
            <p className="text-xs text-muted-foreground">
              By continuing, you agree to AgriLink&apos;s{' '}
              <button className="text-emerald-400 hover:underline">Terms of Service</button>
              {' '}and{' '}
              <button className="text-emerald-400 hover:underline">Privacy Policy</button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
