import { create } from 'zustand'

export type View = 
  | 'landing'
  | 'auth'
  | 'role-select'
  | 'dashboard'
  | 'marketplace'
  | 'logistics'
  | 'chat'
  | 'profile'

export type UserRole = 'producer' | 'buyer' | 'transporter' | 'admin'

export interface AppUser {
  id: string
  name: string
  email: string
  role: UserRole
  companyName?: string
  phone?: string
  state?: string
  city?: string
  verificationStatus: string
  avatar?: string
}

interface AppState {
  // Navigation
  currentView: View
  setView: (view: View) => void
  
  // Auth
  user: AppUser | null
  setUser: (user: AppUser | null) => void
  isAuthenticated: boolean
  
  // Dashboard
  dashboardTab: string
  setDashboardTab: (tab: string) => void
  
  // Marketplace
  marketplaceCategory: string
  setMarketplaceCategory: (cat: string) => void
  marketplaceSearch: string
  setMarketplaceSearch: (search: string) => void
  
  // UI State
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  notifications: number
  setNotifications: (n: number) => void
  
  // Chat
  chatOpen: boolean
  setChatOpen: (open: boolean) => void
  activeChatUser: string | null
  setActiveChatUser: (userId: string | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  currentView: 'landing',
  setView: (view) => set({ currentView: view }),
  
  user: null,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  isAuthenticated: false,
  
  dashboardTab: 'overview',
  setDashboardTab: (tab) => set({ dashboardTab: tab }),
  
  marketplaceCategory: 'all',
  setMarketplaceCategory: (cat) => set({ marketplaceCategory: cat }),
  marketplaceSearch: '',
  setMarketplaceSearch: (search) => set({ marketplaceSearch: search }),
  
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  notifications: 3,
  setNotifications: (n) => set({ notifications: n }),
  
  chatOpen: false,
  setChatOpen: (open) => set({ chatOpen: open }),
  activeChatUser: null,
  setActiveChatUser: (userId) => set({ activeChatUser: userId }),
}))
