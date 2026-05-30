'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAppStore, type UserRole, type AppUser } from '@/lib/store'
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
import { toast } from 'sonner'
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  Shield,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
  Leaf,
  FileText,
} from 'lucide-react'

// ─── Role Config ──────────────────────────────────────────────────────────────
const roleConfig: Record<UserRole, { label: string; color: string; bgClass: string; borderClass: string; icon: typeof User }> = {
  producer: {
    label: 'Producer',
    color: 'text-emerald-400',
    bgClass: 'bg-emerald-500/20',
    borderClass: 'border-emerald-500/30',
    icon: Leaf,
  },
  buyer: {
    label: 'Buyer',
    color: 'text-amber-400',
    bgClass: 'bg-amber-500/20',
    borderClass: 'border-amber-500/30',
    icon: Building2,
  },
  transporter: {
    label: 'Transporter',
    color: 'text-teal-400',
    bgClass: 'bg-teal-500/20',
    borderClass: 'border-teal-500/30',
    icon: MapPin,
  },
  admin: {
    label: 'Admin',
    color: 'text-purple-400',
    bgClass: 'bg-purple-500/20',
    borderClass: 'border-purple-500/30',
    icon: Shield,
  },
}

const verificationConfig: Record<string, { label: string; icon: typeof Clock; color: string; bgClass: string; borderClass: string; description: string }> = {
  pending: {
    label: 'Pending Verification',
    icon: Clock,
    color: 'text-yellow-400',
    bgClass: 'bg-yellow-500/15',
    borderClass: 'border-yellow-500/30',
    description: 'Your profile is under review. This usually takes 24-48 hours. You can still browse the marketplace while waiting.',
  },
  verified: {
    label: 'Verified',
    icon: CheckCircle2,
    color: 'text-emerald-400',
    bgClass: 'bg-emerald-500/15',
    borderClass: 'border-emerald-500/30',
    description: 'Your account has been verified. You have full access to all platform features.',
  },
  rejected: {
    label: 'Verification Rejected',
    icon: XCircle,
    color: 'text-red-400',
    bgClass: 'bg-red-500/15',
    borderClass: 'border-red-500/30',
    description: 'Your verification was not approved. Please update your profile information and try again, or contact support.',
  },
}

const indianStates = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli',
  'Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
]

// ─── Animation Variants ───────────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  },
}

// ─── Profile Page ─────────────────────────────────────────────────────────────
export function ProfilePage() {
  const { user, setUser, setView } = useAppStore()
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    companyName: '',
    state: '',
    city: '',
    gstNumber: '',
  })

  // Sync form data with user
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        companyName: user.companyName || '',
        state: user.state || '',
        city: user.city || '',
        gstNumber: '',
      })
    }
  }, [user])

  // Fetch latest user data including gstNumber
  useEffect(() => {
    if (!user) return
    async function fetchUser() {
      try {
        const res = await fetch(`/api/users?id=${user.id}`)
        if (res.ok) {
          const data = await res.json()
          if (data.user) {
            setFormData(prev => ({
              ...prev,
              name: data.user.name || prev.name,
              phone: data.user.phone || prev.phone,
              companyName: data.user.companyName || prev.companyName,
              state: data.user.state || prev.state,
              city: data.user.city || prev.city,
              gstNumber: data.user.gstNumber || '',
            }))
          }
        }
      } catch {
        // Silently fail, use store data
      }
    }
    fetchUser()
  }, [user])

  if (!user) return null

  const roleInfo = roleConfig[user.role]
  const verifyInfo = verificationConfig[user.verificationStatus] || verificationConfig.pending
  const VerifyIcon = verifyInfo.icon
  const RoleIcon = roleInfo.icon

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Name is required')
      return
    }

    setIsSaving(true)
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          name: formData.name,
          phone: formData.phone || undefined,
          companyName: formData.companyName || undefined,
          state: formData.state || undefined,
          city: formData.city || undefined,
          gstNumber: formData.gstNumber || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to update profile')
        setIsSaving(false)
        return
      }

      // Update the local store user
      const updatedUser: AppUser = {
        ...user,
        name: data.user.name || user.name,
        phone: data.user.phone || undefined,
        companyName: data.user.companyName || undefined,
        state: data.user.state || undefined,
        city: data.user.city || undefined,
      }
      setUser(updatedUser)

      toast.success('Profile updated successfully')
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] animate-float" />
      <div
        className="absolute bottom-1/4 -right-20 w-80 h-80 bg-amber-500/8 rounded-full blur-[100px]"
        style={{ animationDelay: '1.5s', animation: 'float 4.5s ease-in-out infinite' }}
      />

      {/* Top Bar */}
      <div className="sticky top-0 z-30 glass-card-strong rounded-none border-b border-glass-border px-4 lg:px-8 py-3 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground"
          onClick={() => setView('dashboard')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-foreground">Profile Settings</h2>
          <p className="text-xs text-muted-foreground">Manage your account information</p>
        </div>
        <Badge className={`${roleInfo.bgClass} ${roleInfo.color} border ${roleInfo.borderClass} text-xs font-medium`}>
          <RoleIcon className="h-3 w-3 mr-1" />
          {roleInfo.label}
        </Badge>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-6 sm:py-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* Verification Status Card */}
          <motion.div variants={itemVariants}>
            <Card className={`${verifyInfo.bgClass} border ${verifyInfo.borderClass} p-5 rounded-2xl`}>
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl ${verifyInfo.bgClass} border ${verifyInfo.borderClass} flex items-center justify-center shrink-0`}>
                  <VerifyIcon className={`h-6 w-6 ${verifyInfo.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-semibold text-foreground">{verifyInfo.label}</h3>
                    <Badge className={`${verifyInfo.bgClass} ${verifyInfo.color} border ${verifyInfo.borderClass} text-[10px] px-2 py-0`}>
                      {user.verificationStatus.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {verifyInfo.description}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Profile Header Card */}
          <motion.div variants={itemVariants}>
            <Card className="glass-card p-6 rounded-2xl">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <User className="w-10 h-10 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-foreground truncate">{user.name || 'Unnamed User'}</h2>
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                    <Mail className="h-3.5 w-3.5" />
                    {user.email}
                  </p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge className={`${roleInfo.bgClass} ${roleInfo.color} border ${roleInfo.borderClass} text-xs font-medium`}>
                      {roleInfo.label}
                    </Badge>
                    <Badge className={`${verifyInfo.bgClass} ${verifyInfo.color} border ${verifyInfo.borderClass} text-xs font-medium`}>
                      {verifyInfo.label}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Edit Form Card */}
          <motion.div variants={itemVariants}>
            <Card className="glass-card p-6 rounded-2xl">
              <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-400" />
                Edit Profile
              </h3>

              <div className="space-y-5">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <User className="h-3.5 w-3.5" />
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="glass-input h-11 text-foreground placeholder:text-muted-foreground/50"
                    placeholder="Enter your full name"
                  />
                </div>

                {/* Email (read-only) */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    value={user.email}
                    disabled
                    className="glass-input h-11 text-muted-foreground bg-white/[0.02] cursor-not-allowed"
                  />
                  <p className="text-[11px] text-muted-foreground/60">Email cannot be changed</p>
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="glass-input h-11 text-foreground placeholder:text-muted-foreground/50"
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>

                {/* Company Name */}
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5" />
                    Company Name
                  </Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="glass-input h-11 text-foreground placeholder:text-muted-foreground/50"
                    placeholder="Enter company name"
                  />
                </div>

                {/* GST Number */}
                <div className="space-y-2">
                  <Label htmlFor="gstNumber" className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5" />
                    GST Number
                  </Label>
                  <Input
                    id="gstNumber"
                    value={formData.gstNumber}
                    onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                    className="glass-input h-11 text-foreground placeholder:text-muted-foreground/50"
                    placeholder="22AAAAA0000A1Z5"
                  />
                  <p className="text-[11px] text-muted-foreground/60">Required for verification as a business</p>
                </div>

                {/* State & City */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5" />
                      State
                    </Label>
                    <Select
                      value={formData.state}
                      onValueChange={(value) => setFormData({ ...formData, state: value })}
                    >
                      <SelectTrigger className="glass-input h-11 text-foreground">
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent className="bg-[oklch(0.15_0.012_260)] border-glass-border max-h-60">
                        {indianStates.map((s) => (
                          <SelectItem key={s} value={s} className="text-foreground focus:bg-white/10 focus:text-foreground">
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5" />
                      City
                    </Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="glass-input h-11 text-foreground placeholder:text-muted-foreground/50"
                      placeholder="Enter city"
                    />
                  </div>
                </div>

                {/* Role (read-only) */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5" />
                    Role
                  </Label>
                  <div className="glass-input h-11 flex items-center px-3 bg-white/[0.02] rounded-xl border border-glass-border">
                    <Badge className={`${roleInfo.bgClass} ${roleInfo.color} border ${roleInfo.borderClass} text-xs font-medium`}>
                      <RoleIcon className="h-3 w-3 mr-1" />
                      {roleInfo.label}
                    </Badge>
                    <span className="ml-auto text-[11px] text-muted-foreground/60">Change from role-select page</span>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="mt-8 flex items-center gap-3 justify-end">
                <Button
                  variant="ghost"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => setView('dashboard')}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 h-11 shadow-[0_0_20px_oklch(0.72_0.19_155/20%)]"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
