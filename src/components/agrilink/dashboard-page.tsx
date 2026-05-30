'use client'

import { useAppStore, type UserRole } from '@/lib/store'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Leaf, LayoutDashboard, Package, ShoppingCart, MessageSquare, User,
  Store, ClipboardList, Truck, Gavel, Users, ShieldCheck, BarChart3,
  Bell, Menu, X, LogOut, ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ProducerDashboard } from './producer-dashboard'
import { BuyerDashboard } from './buyer-dashboard'
import { TransporterDashboard } from './transporter-dashboard'
import { AdminDashboard } from './admin-dashboard'

interface NavItem {
  id: string
  label: string
  icon: React.ReactNode
}

const navItemsByRole: Record<UserRole, NavItem[]> = {
  producer: [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="h-5 w-5" /> },
    { id: 'listings', label: 'My Listings', icon: <Package className="h-5 w-5" /> },
    { id: 'orders', label: 'Orders', icon: <ShoppingCart className="h-5 w-5" /> },
    { id: 'messages', label: 'Messages', icon: <MessageSquare className="h-5 w-5" /> },
    { id: 'profile', label: 'Profile', icon: <User className="h-5 w-5" /> },
  ],
  buyer: [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="h-5 w-5" /> },
    { id: 'marketplace', label: 'Marketplace', icon: <Store className="h-5 w-5" /> },
    { id: 'procurement', label: 'Procurement', icon: <ClipboardList className="h-5 w-5" /> },
    { id: 'orders', label: 'Orders', icon: <ShoppingCart className="h-5 w-5" /> },
    { id: 'messages', label: 'Messages', icon: <MessageSquare className="h-5 w-5" /> },
    { id: 'profile', label: 'Profile', icon: <User className="h-5 w-5" /> },
  ],
  transporter: [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="h-5 w-5" /> },
    { id: 'loads', label: 'Available Loads', icon: <Truck className="h-5 w-5" /> },
    { id: 'shipments', label: 'My Shipments', icon: <Package className="h-5 w-5" /> },
    { id: 'bids', label: 'Bids', icon: <Gavel className="h-5 w-5" /> },
    { id: 'messages', label: 'Messages', icon: <MessageSquare className="h-5 w-5" /> },
    { id: 'profile', label: 'Profile', icon: <User className="h-5 w-5" /> },
  ],
  admin: [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="h-5 w-5" /> },
    { id: 'users', label: 'Users', icon: <Users className="h-5 w-5" /> },
    { id: 'verification', label: 'Verification', icon: <ShieldCheck className="h-5 w-5" /> },
    { id: 'orders', label: 'Orders', icon: <ShoppingCart className="h-5 w-5" /> },
    { id: 'shipments', label: 'Shipments', icon: <Truck className="h-5 w-5" /> },
    { id: 'messages', label: 'Messages', icon: <MessageSquare className="h-5 w-5" /> },
    { id: 'profile', label: 'Profile', icon: <User className="h-5 w-5" /> },
  ],
}

const roleLabels: Record<UserRole, string> = {
  producer: 'Producer',
  buyer: 'Buyer',
  transporter: 'Transporter',
  admin: 'Admin',
}

const roleColors: Record<UserRole, string> = {
  producer: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  buyer: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  transporter: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  admin: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
}

function DashboardContent({ role, tab }: { role: UserRole; tab: string }) {
  switch (role) {
    case 'producer':
      return <ProducerDashboard tab={tab} />
    case 'buyer':
      return <BuyerDashboard tab={tab} />
    case 'transporter':
      return <TransporterDashboard tab={tab} />
    case 'admin':
      return <AdminDashboard tab={tab} />
    default:
      return <div>Unknown role</div>
  }
}

export function DashboardPage() {
  const { user, dashboardTab, setDashboardTab, sidebarOpen, setSidebarOpen, setUser, setView, notifications, setChatOpen, setMarketplaceCategory } = useAppStore()

  if (!user) return null

  const navItems = navItemsByRole[user.role] || []
  const initials = (user.name || user.email || 'U').slice(0, 2).toUpperCase()

  const handleNavClick = (id: string) => {
    if (id === 'marketplace') {
      setMarketplaceCategory('all')
      setView('marketplace')
      return
    }
    if (id === 'messages') {
      setChatOpen(true)
      return
    }
    if (id === 'profile') {
      setView('profile')
      return
    }
    setDashboardTab(id)
    setSidebarOpen(false)
  }

  const handleSignOut = () => {
    setUser(null)
    setView('landing')
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 glass-card-strong rounded-none border-r border-glass-border flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="p-6 flex items-center gap-3 border-b border-glass-border">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center glow-green">
            <Leaf className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">AgriLink</h1>
            <p className="text-xs text-muted-foreground">Agricultural Trade Platform</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto lg:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Role badge */}
        <div className="px-6 py-3">
          <Badge className={`${roleColors[user.role]} border text-xs font-medium`}>
            {roleLabels[user.role]} Dashboard
          </Badge>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                dashboardTab === item.id
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 glow-green'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent'
              }`}
            >
              <span className={dashboardTab === item.id ? 'text-emerald-400' : 'text-muted-foreground group-hover:text-foreground'}>
                {item.icon}
              </span>
              <span className="flex-1 text-left">{item.label}</span>
              {dashboardTab === item.id && (
                <ChevronRight className="h-4 w-4 text-emerald-400" />
              )}
            </button>
          ))}
        </nav>

        {/* User & Sign out */}
        <div className="p-4 border-t border-glass-border space-y-3">
          <div className="flex items-center gap-3 px-2">
            <Avatar className="h-9 w-9 border border-glass-border">
              <AvatarFallback className="bg-emerald-500/20 text-emerald-400 text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user.name || user.email}</p>
              <p className="text-xs text-muted-foreground truncate">{user.companyName || user.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground hover:bg-white/5"
            onClick={() => setView('role-select')}
          >
            <ChevronRight className="h-4 w-4" />
            Switch Role
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-red-400 hover:text-red-300 hover:bg-red-500/10"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 glass-card-strong rounded-none border-b border-glass-border px-4 lg:px-8 py-3 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex-1">
            <h2 className="text-lg font-semibold text-foreground capitalize">{dashboardTab}</h2>
            <p className="text-xs text-muted-foreground">
              Welcome back, {user.name || user.email}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="relative text-muted-foreground hover:text-foreground"
              onClick={() => setChatOpen(true)}
            >
              <MessageSquare className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="relative text-muted-foreground hover:text-foreground"
            >
              <Bell className="h-5 w-5" />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </Button>
            <Avatar className="h-8 w-8 border border-glass-border ml-2">
              <AvatarFallback className="bg-emerald-500/20 text-emerald-400 text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Dashboard content */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${user.role}-${dashboardTab}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              <DashboardContent role={user.role} tab={dashboardTab} />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
