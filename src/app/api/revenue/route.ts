import { supabase } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const userId = searchParams.get('userId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '100')

    // Build base query for PlatformRevenue
    let query = supabase
      .from('PlatformRevenue')
      .select('*')
      .order('createdAt', { ascending: false })
      .limit(limit)

    if (type) query = query.eq('type', type)
    if (userId) query = query.eq('userId', userId)
    if (startDate) query = query.gte('createdAt', startDate)
    if (endDate) query = query.lte('createdAt', endDate)

    const { data: revenueRecords, error: revenueError } = await query

    if (revenueError) {
      // Table may not exist yet - return empty results gracefully
      console.warn('Revenue fetch error (table may not exist):', revenueError.message)
      return NextResponse.json({
        records: [],
        summary: {
          totalRevenue: 0,
          monthlyRevenue: 0,
          totalRecords: 0,
          totalByType: {},
          monthlyBreakdown: {},
        },
      })
    }

    const records = revenueRecords || []

    // Calculate total by type
    const totalByType: Record<string, number> = {}
    for (const record of records) {
      const recordType = record.type || 'other'
      totalByType[recordType] = (totalByType[recordType] || 0) + (record.amount || 0)
    }

    // Calculate current month revenue
    const now = new Date()
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    let monthlyRevenue = 0
    for (const record of records) {
      if (record.createdAt && record.createdAt >= currentMonthStart) {
        monthlyRevenue += record.amount || 0
      }
    }

    // Calculate monthly breakdown
    const monthlyBreakdown: Record<string, { total: number; count: number; byType: Record<string, number> }> = {}
    for (const record of records) {
      if (!record.createdAt) continue
      const date = new Date(record.createdAt)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

      if (!monthlyBreakdown[monthKey]) {
        monthlyBreakdown[monthKey] = { total: 0, count: 0, byType: {} }
      }

      monthlyBreakdown[monthKey].total += record.amount || 0
      monthlyBreakdown[monthKey].count += 1

      const recordType = record.type || 'other'
      monthlyBreakdown[monthKey].byType[recordType] = (monthlyBreakdown[monthKey].byType[recordType] || 0) + (record.amount || 0)
    }

    // Round totals to 2 decimal places
    const totalByTypeRounded: Record<string, number> = {}
    for (const [key, value] of Object.entries(totalByType)) {
      totalByTypeRounded[key] = Math.round(value * 100) / 100
    }

    const monthlyBreakdownRounded: Record<string, { total: number; count: number; byType: Record<string, number> }> = {}
    for (const [month, data] of Object.entries(monthlyBreakdown)) {
      monthlyBreakdownRounded[month] = {
        total: Math.round(data.total * 100) / 100,
        count: data.count,
        byType: Object.fromEntries(
          Object.entries(data.byType).map(([t, v]) => [t, Math.round(v * 100) / 100])
        ),
      }
    }

    // Calculate overall totals
    const totalRevenue = records.reduce((sum, r) => sum + (r.amount || 0), 0)

    // Fetch associated user info for records that have userId
    const userIds = [...new Set(records.filter((r: any) => r.userId).map((r: any) => r.userId))]
    const orderIds = [...new Set(records.filter((r: any) => r.orderId).map((r: any) => r.orderId))]

    let userMap: Record<string, any> = {}
    let orderMap: Record<string, any> = {}

    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('User')
        .select('id, name, email, role, companyName')
        .in('id', userIds)
      users?.forEach((u: any) => { userMap[u.id] = u })
    }

    if (orderIds.length > 0) {
      const { data: orders } = await supabase
        .from('Order')
        .select('id, totalPrice, status, buyerId, sellerId')
        .in('id', orderIds)
      orders?.forEach((o: any) => { orderMap[o.id] = o })
    }

    // Enrich records with user and order info
    const enrichedRecords = records.map((record: any) => ({
      ...record,
      user: record.userId ? userMap[record.userId] || null : null,
      order: record.orderId ? orderMap[record.orderId] || null : null,
    }))

    return NextResponse.json({
      records: enrichedRecords,
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
        totalRecords: records.length,
        totalByType: totalByTypeRounded,
        monthlyBreakdown: monthlyBreakdownRounded,
      },
    })
  } catch (error) {
    console.error('Revenue error:', error)
    return NextResponse.json({ error: 'Failed to fetch revenue data' }, { status: 500 })
  }
}
