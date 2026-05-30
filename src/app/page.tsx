'use client'

import { LandingPage } from '@/components/agrilink/landing-page'
import { AuthPage } from '@/components/agrilink/auth-page'
import { RoleSelectPage } from '@/components/agrilink/role-select-page'
import { MarketplacePage } from '@/components/agrilink/marketplace-page'
import { LogisticsPage } from '@/components/agrilink/logistics-page'
import { DashboardPage } from '@/components/agrilink/dashboard-page'
import { ProfilePage } from '@/components/agrilink/profile-page'
import { ChatPanel } from '@/components/agrilink/chat-panel'
import { useAppStore } from '@/lib/store'

export default function Home() {
  const currentView = useAppStore((s) => s.currentView)

  return (
    <div className="min-h-screen bg-background text-foreground">
      {currentView === 'landing' && <LandingPage />}
      {currentView === 'auth' && <AuthPage />}
      {currentView === 'role-select' && <RoleSelectPage />}
      {currentView === 'marketplace' && <MarketplacePage />}
      {currentView === 'logistics' && <LogisticsPage />}
      {currentView === 'dashboard' && <DashboardPage />}
      {currentView === 'profile' && <ProfilePage />}
      {currentView === 'chat' && <DashboardPage />}
      <ChatPanel />
    </div>
  )
}
