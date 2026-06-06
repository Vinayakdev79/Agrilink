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
  | 'product'
  | 'producer-profile'

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
  avatarUrl?: string
  bannerUrl?: string
  address?: string
  gstNumber?: string
  farmName?: string
  farmSize?: string
  farmLocation?: string
  yearsExperience?: number
  certifications?: string
  totalTransactions?: number
  avgRating?: number
  totalReviews?: number
}

export interface CartItem {
  productId: string
  productName: string
  productImage?: string
  sellerId: string
  sellerName: string
  quantity: number
  unit: string
  pricePerUnit: number
  minOrderQty: number
  maxQuantity: number
  location: string
  state?: string
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
  
  // Product & Producer detail views
  selectedProductId: string | null
  setSelectedProductId: (id: string | null) => void
  selectedProducerId: string | null
  setSelectedProducerId: (id: string | null) => void
  
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

  // Cart
  cart: CartItem[]
  addToCart: (item: CartItem) => void
  removeFromCart: (productId: string) => void
  updateCartQty: (productId: string, qty: number) => void
  clearCart: () => void
  cartOpen: boolean
  setCartOpen: (open: boolean) => void
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
  
  selectedProductId: null,
  setSelectedProductId: (id) => set({ selectedProductId: id }),
  selectedProducerId: null,
  setSelectedProducerId: (id) => set({ selectedProducerId: id }),
  
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  notifications: 3,
  setNotifications: (n) => set({ notifications: n }),
  
  chatOpen: false,
  setChatOpen: (open) => set({ chatOpen: open }),
  activeChatUser: null,
  setActiveChatUser: (userId) => set({ activeChatUser: userId }),

  // Cart
  cart: [],
  addToCart: (item) => set((state) => {
    const existing = state.cart.find(c => c.productId === item.productId)
    if (existing) {
      return { cart: state.cart.map(c => c.productId === item.productId ? { ...c, quantity: c.quantity + item.quantity } : c) }
    }
    return { cart: [...state.cart, item] }
  }),
  removeFromCart: (productId) => set((state) => ({ cart: state.cart.filter(c => c.productId !== productId) })),
  updateCartQty: (productId, qty) => set((state) => ({ cart: state.cart.map(c => c.productId === productId ? { ...c, quantity: qty } : c) })),
  clearCart: () => set({ cart: [] }),
  cartOpen: false,
  setCartOpen: (open) => set({ cartOpen: open }),
}))
