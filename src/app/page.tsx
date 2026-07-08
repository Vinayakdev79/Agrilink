'use client'

import { LandingPage } from '@/components/agrilink/landing-page'
import { AuthPage } from '@/components/agrilink/auth-page'
import { RoleSelectPage } from '@/components/agrilink/role-select-page'
import { MarketplacePage } from '@/components/agrilink/marketplace-page'
import { LogisticsPage } from '@/components/agrilink/logistics-page'
import { DashboardPage } from '@/components/agrilink/dashboard-page'
import { ProfilePage } from '@/components/agrilink/profile-page'
import { ProducerProfilePage } from '@/components/agrilink/producer-profile-page'
import { ChatPanel } from '@/components/agrilink/chat-panel'
import { CartPanel } from '@/components/agrilink/cart-panel'
import { ProductPage } from '@/components/agrilink/product-page'
import { useAppStore } from '@/lib/store'
import { Leaf } from 'lucide-react'

// Views that manage their own full-page layout (no app footer needed)
const fullPageViews = new Set(['landing', 'dashboard', 'chat', 'logistics'])

function AppFooter() {
  return (
    <footer className="border-t border-border bg-background mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Leaf className="w-4 h-4 text-emerald-500" />
            <span>&copy; 2025 AgriLink. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Terms
            </button>
            <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Privacy
            </button>
            <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default function Home() {
  const currentView = useAppStore((s) => s.currentView)

  const showFooter = !fullPageViews.has(currentView)

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <div className="flex-1 flex flex-col">
        {currentView === 'landing' && <LandingPage />}
        {currentView === 'auth' && <AuthPage />}
        {currentView === 'role-select' && <RoleSelectPage />}
        {currentView === 'marketplace' && <MarketplacePage />}
        {currentView === 'logistics' && <LogisticsPage />}
        {currentView === 'dashboard' && <DashboardPage />}
        {currentView === 'profile' && <ProfilePage />}
        {currentView === 'chat' && <DashboardPage />}
        {currentView === 'product' && <ProductPage />}
        {currentView === 'producer-profile' && <ProducerProfilePage />}
      </div>
      {showFooter && <AppFooter />}
      <ChatPanel />
      <CartPanel />
    </div>
  )
}
