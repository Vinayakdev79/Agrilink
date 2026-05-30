import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const stats = await db.platformStats.findFirst()
    
    // Get real-time counts
    const [totalUsers, totalProducts, totalOrders, totalShipments, verifiedUsers] = await Promise.all([
      db.user.count(),
      db.product.count({ where: { isActive: true } }),
      db.order.count(),
      db.shipment.count(),
      db.user.count({ where: { verificationStatus: 'verified' } }),
    ])

    // Get recent activity
    const recentOrders = await db.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        buyer: { select: { name: true, companyName: true } },
        seller: { select: { name: true, companyName: true } },
        product: { select: { name: true, category: true } },
      }
    })

    // Category distribution
    const categoryStats = await db.product.groupBy({
      by: ['category'],
      _count: { id: true },
      _avg: { pricePerUnit: true },
      where: { isActive: true },
    })

    // Order status distribution
    const orderStatusStats = await db.order.groupBy({
      by: ['status'],
      _count: { id: true },
    })

    // Shipment status distribution
    const shipmentStatusStats = await db.shipment.groupBy({
      by: ['status'],
      _count: { id: true },
    })

    // State distribution
    const stateStats = await db.user.groupBy({
      by: ['state'],
      _count: { id: true },
      where: { state: { not: null } },
    })

    // Revenue calculation
    const deliveredOrders = await db.order.findMany({
      where: { status: 'delivered' },
      select: { totalPrice: true },
    })
    const totalRevenue = deliveredOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0)

    return NextResponse.json({
      stats: stats || {},
      realtime: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalShipments,
        verifiedUsers,
        totalRevenue,
      },
      recentOrders,
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
