'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useAppStore, type UserRole, type AppUser } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
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
  Camera,
  Upload,
  Image as ImageIcon,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

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
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  },
}

// ─── Profile Page ─────────────────────────────────────────────────────────────
export function ProfilePage() {
  const { user, setUser, setView } = useAppStore()
  const [isSaving, setIsSaving] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [bannerUrl, setBannerUrl] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    companyName: '',
    state: '',
    city: '',
    gstNumber: '',
    address: '',
    // Producer-specific fields
    farmName: '',
    farmSize: '',
    farmLocation: '',
    yearsExperience: '',
    certifications: '',
  })

  const bannerInputRef = useRef<HTMLInputElement>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

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
        address: user.address || '',
        farmName: user.farmName || '',
        farmSize: user.farmSize || '',
        farmLocation: user.farmLocation || '',
        yearsExperience: user.yearsExperience ? String(user.yearsExperience) : '',
        certifications: user.certifications || '',
      })
      setBannerUrl(user.bannerUrl || null)
      setAvatarUrl(user.avatarUrl || null)
    }
  }, [user])

  // Fetch latest user data including all new fields
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
              address: data.user.address || '',
              farmName: data.user.farmName || '',
              farmSize: data.user.farmSize || '',
              farmLocation: data.user.farmLocation || '',
              yearsExperience: data.user.yearsExperience ? String(data.user.yearsExperience) : '',
              certifications: data.user.certifications || '',
            }))
            if (data.user.avatarUrl) setAvatarUrl(data.user.avatarUrl)
            if (data.user.bannerUrl) setBannerUrl(data.user.bannerUrl)
          }
        }
      } catch {
        // Silently fail, use store data
      }
    }
    fetchUser()
  }, [user])

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingBanner(true)
    try {
      const uploadForm = new FormData()
      uploadForm.append('file', file)
      uploadForm.append('folder', 'banners')
      const res = await fetch('/api/upload', { method: 'POST', body: uploadForm })
      if (res.ok) {
        const data = await res.json()
        setBannerUrl(data.url)
        // Update user on server
        await fetch('/api/users', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user!.id, bannerUrl: data.url }),
        })
        // Update local store
        if (user) setUser({ ...user, bannerUrl: data.url })
        toast.success('Banner updated!')
      } else {
        toast.error('Failed to upload banner')
      }
    } catch {
      toast.error('Failed to upload banner')
    } finally {
      setUploadingBanner(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAvatar(true)
    try {
      const uploadForm = new FormData()
      uploadForm.append('file', file)
      uploadForm.append('folder', 'avatars')
      const res = await fetch('/api/upload', { method: 'POST', body: uploadForm })
      if (res.ok) {
        const data = await res.json()
        setAvatarUrl(data.url)
        // Update user on server
        await fetch('/api/users', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user!.id, avatarUrl: data.url }),
        })
        // Update local store
        if (user) setUser({ ...user, avatarUrl: data.url })
        toast.success('Avatar updated!')
      } else {
        toast.error('Failed to upload avatar')
      }
    } catch {
      toast.error('Failed to upload avatar')
    } finally {
      setUploadingAvatar(false)
    }
  }

  if (!user) return null

  const roleInfo = roleConfig[user.role]
  const verifyInfo = verificationConfig[user.verificationStatus] || verificationConfig.pending
  const VerifyIcon = verifyInfo.icon
  const RoleIcon = roleInfo.icon
  const isProducer = user.role === 'producer'

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Name is required')
      return
    }

    setIsSaving(true)
    try {
      const body: Record<string, unknown> = {
        userId: user.id,
        name: formData.name,
        phone: formData.phone || undefined,
        companyName: formData.companyName || undefined,
        state: formData.state || undefined,
        city: formData.city || undefined,
        gstNumber: formData.gstNumber || undefined,
        address: formData.address || undefined,
      }

      // Producer-specific fields
      if (isProducer) {
        body.farmName = formData.farmName || undefined
        body.farmSize = formData.farmSize || undefined
        body.farmLocation = formData.farmLocation || undefined
        body.yearsExperience = formData.yearsExperience ? parseInt(formData.yearsExperience) : undefined
        body.certifications = formData.certifications || undefined
      }

      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
        address: data.user.address || undefined,
        farmName: data.user.farmName || undefined,
        farmSize: data.user.farmSize || undefined,
        farmLocation: data.user.farmLocation || undefined,
        yearsExperience: data.user.yearsExperience || undefined,
        certifications: data.user.certifications || undefined,
      }
      setUser(updatedUser)

      toast.success('Profile updated successfully')
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const getInitials = (name: string) => name.slice(0, 2).toUpperCase() || 'U'

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
          {/* Banner Image */}
          <motion.div variants={itemVariants}>
            <div className="relative w-full h-40 rounded-2xl overflow-hidden border border-glass-border group">
              {bannerUrl ? (
                <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-emerald-900/40 via-teal-900/30 to-amber-900/40" />
              )}
              <button
                onClick={() => bannerInputRef.current?.click()}
                disabled={uploadingBanner}
                className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors cursor-pointer"
              >
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center gap-1">
                  {uploadingBanner ? (
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  ) : (
                    <Camera className="h-6 w-6 text-white" />
                  )}
                  <span className="text-white text-xs font-medium">
                    {uploadingBanner ? 'Uploading...' : 'Edit Banner'}
                  </span>
                </div>
              </button>
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleBannerUpload}
              />
            </div>
          </motion.div>

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
                {/* Avatar with upload */}
                <div className="relative group">
                  <Avatar className="w-20 h-20 border-2 border-glass-border shrink-0">
                    {avatarUrl ? (
                      <AvatarImage src={avatarUrl} alt={user.name || ''} />
                    ) : null}
                    <AvatarFallback className="bg-emerald-500/20 text-emerald-400 text-2xl font-bold">
                      {getInitials(user.name || '')}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-emerald-600 hover:bg-emerald-500 border-2 border-background flex items-center justify-center transition-colors cursor-pointer"
                  >
                    {uploadingAvatar ? (
                      <Loader2 className="h-3.5 w-3.5 text-white animate-spin" />
                    ) : (
                      <Camera className="h-3.5 w-3.5 text-white" />
                    )}
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
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

                {/* Address - for ALL users */}
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5" />
                    Full Address
                  </Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="glass-input text-foreground placeholder:text-muted-foreground/50 min-h-[80px]"
                    placeholder="Enter your full address"
                  />
                </div>

                {/* ─── Producer-Specific Fields ──────────────────────────── */}
                {isProducer && (
                  <>
                    <div className="border-t border-glass-border pt-5 mt-5">
                      <h4 className="text-sm font-semibold text-emerald-400 flex items-center gap-2 mb-4">
                        <Leaf className="h-4 w-4" />
                        Farm & Producer Details
                      </h4>
                    </div>

                    {/* Farm Name */}
                    <div className="space-y-2">
                      <Label htmlFor="farmName" className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Leaf className="h-3.5 w-3.5" />
                        Farm Name
                      </Label>
                      <Input
                        id="farmName"
                        value={formData.farmName}
                        onChange={(e) => setFormData({ ...formData, farmName: e.target.value })}
                        className="glass-input h-11 text-foreground placeholder:text-muted-foreground/50"
                        placeholder="e.g. Green Valley Farms"
                      />
                    </div>

                    {/* Farm Size & Farm Location */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="farmSize" className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5" />
                          Farm Size
                        </Label>
                        <Input
                          id="farmSize"
                          value={formData.farmSize}
                          onChange={(e) => setFormData({ ...formData, farmSize: e.target.value })}
                          className="glass-input h-11 text-foreground placeholder:text-muted-foreground/50"
                          placeholder="e.g. 50 acres"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="farmLocation" className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5" />
                          Farm Location
                        </Label>
                        <Input
                          id="farmLocation"
                          value={formData.farmLocation}
                          onChange={(e) => setFormData({ ...formData, farmLocation: e.target.value })}
                          className="glass-input h-11 text-foreground placeholder:text-muted-foreground/50"
                          placeholder="e.g. Nashik, Maharashtra"
                        />
                      </div>
                    </div>

                    {/* Years of Experience */}
                    <div className="space-y-2">
                      <Label htmlFor="yearsExperience" className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <User className="h-3.5 w-3.5" />
                        Years of Experience
                      </Label>
                      <Input
                        id="yearsExperience"
                        type="number"
                        value={formData.yearsExperience}
                        onChange={(e) => setFormData({ ...formData, yearsExperience: e.target.value })}
                        className="glass-input h-11 text-foreground placeholder:text-muted-foreground/50"
                        placeholder="e.g. 15"
                      />
                    </div>

                    {/* Certifications */}
                    <div className="space-y-2">
                      <Label htmlFor="certifications" className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Shield className="h-3.5 w-3.5" />
                        Certifications
                      </Label>
                      <Input
                        id="certifications"
                        value={formData.certifications}
                        onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
                        className="glass-input h-11 text-foreground placeholder:text-muted-foreground/50"
                        placeholder="e.g. FSSAI, APEDA, Organic India (comma separated)"
                      />
                      <p className="text-[11px] text-muted-foreground/60">Separate multiple certifications with commas</p>
                    </div>
                  </>
                )}

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
