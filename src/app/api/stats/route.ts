import { supabase } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Get platform stats
    const { data: statsData, error: statsError } = await supabase
      .from('PlatformStats')
      .select('*')
      .limit(1)
      .single()
    
    if (statsError && statsError.code !== 'PGRST116') {
      console.error('Stats fetch error:', statsError)
    }

    // Get real-time counts
    const [usersCountRes, activeProductsCountRes, ordersCountRes, shipmentsCountRes, verifiedUsersCountRes] = await Promise.all([
      supabase.from('User').select('*', { count: 'exact', head: true }),
      supabase.from('Product').select('*', { count: 'exact', head: true }).eq('isActive', true),
      supabase.from('Order').select('*', { count: 'exact', head: true }),
      supabase.from('Shipment').select('*', { count: 'exact', head: true }),
      supabase.from('User').select('*', { count: 'exact', head: true }).eq('verificationStatus', 'verified'),
    ])

    const totalUsers = usersCountRes.count ?? 0
    const totalProducts = activeProductsCountRes.count ?? 0
    const totalOrders = ordersCountRes.count ?? 0
    const totalShipments = shipmentsCountRes.count ?? 0
    const verifiedUsers = verifiedUsersCountRes.count ?? 0

    // Get recent orders with joins
    const { data: recentOrders, error: recentOrdersError } = await supabase
      .from('Order')
      .select('*, buyer:User!buyerId(name, companyName), seller:User!sellerId(name, companyName), product:Product!productId(name, category)')
      .order('createdAt', { ascending: false })
      .limit(5)

    if (recentOrdersError) {
      console.error('Recent orders fetch error:', recentOrdersError)
    }

    // Category distribution - fetch all active products and group in JS
    const { data: activeProducts, error: activeProductsError } = await supabase
      .from('Product')
      .select('category, pricePerUnit')
      .eq('isActive', true)

    if (activeProductsError) {
      console.error('Active products fetch error:', activeProductsError)
    }

    const categoryMap = new Map<string, { count: number; totalPrice: number }>()
    for (const p of activeProducts ?? []) {
      const existing = categoryMap.get(p.category) ?? { count: 0, totalPrice: 0 }
      existing.count += 1
      existing.totalPrice += p.pricePerUnit ?? 0
      categoryMap.set(p.category, existing)
    }
    const categoryStats = Array.from(categoryMap.entries()).map(([category, { count, totalPrice }]) => ({
      category,
      _count: { id: count },
      _avg: { pricePerUnit: count > 0 ? totalPrice / count : 0 },
    }))

    // Order status distribution - fetch all orders and group in JS
    const { data: allOrders, error: allOrdersError } = await supabase
      .from('Order')
      .select('status')

    if (allOrdersError) {
      console.error('All orders fetch error:', allOrdersError)
    }

    const orderStatusMap = new Map<string, number>()
    for (const o of allOrders ?? []) {
      orderStatusMap.set(o.status, (orderStatusMap.get(o.status) ?? 0) + 1)
    }
    const orderStatusStats = Array.from(orderStatusMap.entries()).map(([status, count]) => ({
      status,
      _count: { id: count },
    }))

    // Shipment status distribution - fetch all shipments and group in JS
    const { data: allShipments, error: allShipmentsError } = await supabase
      .from('Shipment')
      .select('status')

    if (allShipmentsError) {
      console.error('All shipments fetch error:', allShipmentsError)
    }

    const shipmentStatusMap = new Map<string, number>()
    for (const s of allShipments ?? []) {
      shipmentStatusMap.set(s.status, (shipmentStatusMap.get(s.status) ?? 0) + 1)
    }
    const shipmentStatusStats = Array.from(shipmentStatusMap.entries()).map(([status, count]) => ({
      status,
      _count: { id: count },
    }))

    // State distribution - fetch users with non-null state and group in JS
    const { data: usersWithState, error: usersWithStateError } = await supabase
      .from('User')
      .select('state')
      .not('state', 'is', null)

    if (usersWithStateError) {
      console.error('Users with state fetch error:', usersWithStateError)
    }

    const stateMap = new Map<string, number>()
    for (const u of usersWithState ?? []) {
      if (u.state) {
        stateMap.set(u.state, (stateMap.get(u.state) ?? 0) + 1)
      }
    }
    const stateStats = Array.from(stateMap.entries()).map(([state, count]) => ({
      state,
      _count: { id: count },
    }))

    // Revenue calculation - fetch all delivered orders and sum in JS
    const { data: deliveredOrders, error: deliveredOrdersError } = await supabase
      .from('Order')
      .select('totalPrice')
      .eq('status', 'delivered')

    if (deliveredOrdersError) {
      console.error('Delivered orders fetch error:', deliveredOrdersError)
    }

    const totalRevenue = (deliveredOrders ?? []).reduce((sum, o) => sum + (o.totalPrice || 0), 0)

    return NextResponse.json({
      stats: statsData || {},
      realtime: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalShipments,
        verifiedUsers,
        totalRevenue,
      },
      recentOrders: recentOrders ?? [],
      categoryStats,
      orderStatusStats,
      shipmentStatusStats,
      stateStats,
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
