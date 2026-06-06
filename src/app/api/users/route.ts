import { supabase } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const verificationStatus = searchParams.get('verificationStatus')
    const id = searchParams.get('id')

    // Single user lookup by ID
    if (id) {
      const { data: user, error: userError } = await supabase
        .from('User')
        .select('id, name, email, role, companyName, phone, state, city, verificationStatus, isOnline, gstNumber, avatar, avatarUrl, bannerUrl, address, farmName, farmSize, farmLocation, farmImages, yearsExperience, certifications, totalTransactions, latitude, longitude, avgRating, totalReviews, createdAt')
        .eq('id', id)
        .maybeSingle()

      if (userError) {
        console.error('User fetch error:', userError)
        return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
      }
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      // Fetch counts separately (replacing Prisma _count)
      const [productsRes, ordersAsBuyerRes, ordersAsSellerRes, shipmentsAsTransporterRes] = await Promise.all([
        supabase.from('Product').select('*', { count: 'exact', head: true }).eq('sellerId', id),
        supabase.from('Order').select('*', { count: 'exact', head: true }).eq('buyerId', id),
        supabase.from('Order').select('*', { count: 'exact', head: true }).eq('sellerId', id),
        supabase.from('Shipment').select('*', { count: 'exact', head: true }).eq('transporterId', id),
      ])

      const userWithCount = {
        ...user,
        _count: {
          products: productsRes.count ?? 0,
          ordersAsBuyer: ordersAsBuyerRes.count ?? 0,
          ordersAsSeller: ordersAsSellerRes.count ?? 0,
          shipmentsAsTransporter: shipmentsAsTransporterRes.count ?? 0,
        },
      }

      return NextResponse.json({ user: userWithCount })
    }

    // List users with filters
    let query = supabase
      .from('User')
      .select('id, name, email, role, companyName, phone, state, city, verificationStatus, isOnline, avatar, avatarUrl, bannerUrl, address, farmName, farmSize, farmLocation, farmImages, yearsExperience, certifications, totalTransactions, latitude, longitude, avgRating, totalReviews, createdAt')
      .order('createdAt', { ascending: false })

    if (role) {
      query = query.eq('role', role)
    }
    if (verificationStatus) {
      query = query.eq('verificationStatus', verificationStatus)
    }

    const { data: users, error: usersError } = await query

    if (usersError) {
      console.error('Users fetch error:', usersError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ users: [] })
    }

    // Fetch all related FK values and compute counts in JS (replacing Prisma _count for list)
    const userIds = users.map(u => u.id)

    const [productRows, orderBuyerRows, orderSellerRows, shipmentRows] = await Promise.all([
      supabase.from('Product').select('sellerId').in('sellerId', userIds),
      supabase.from('Order').select('buyerId').in('buyerId', userIds),
      supabase.from('Order').select('sellerId').in('sellerId', userIds),
      supabase.from('Shipment').select('transporterId').in('transporterId', userIds),
    ])

    // Build count maps
    const productCounts: Record<string, number> = {}
    productRows.data?.forEach(r => {
      productCounts[r.sellerId] = (productCounts[r.sellerId] || 0) + 1
    })

    const orderBuyerCounts: Record<string, number> = {}
    orderBuyerRows.data?.forEach(r => {
      orderBuyerCounts[r.buyerId] = (orderBuyerCounts[r.buyerId] || 0) + 1
    })

    const orderSellerCounts: Record<string, number> = {}
    orderSellerRows.data?.forEach(r => {
      orderSellerCounts[r.sellerId] = (orderSellerCounts[r.sellerId] || 0) + 1
    })

    const shipmentCounts: Record<string, number> = {}
    shipmentRows.data?.forEach(r => {
      shipmentCounts[r.transporterId] = (shipmentCounts[r.transporterId] || 0) + 1
    })

    // Attach _count to each user
    const usersWithCount = users.map(user => ({
      ...user,
      _count: {
        products: productCounts[user.id] || 0,
        ordersAsBuyer: orderBuyerCounts[user.id] || 0,
        ordersAsSeller: orderSellerCounts[user.id] || 0,
        shipmentsAsTransporter: shipmentCounts[user.id] || 0,
      },
    }))

    return NextResponse.json({ users: usersWithCount })
  } catch (error) {
    console.error('Users error:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const {
      userId, verificationStatus, name, phone, companyName, state, city, gstNumber,
      avatarUrl, bannerUrl, address, farmName, farmSize, farmLocation,
      yearsExperience, certifications,
    } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    if (verificationStatus) updateData.verificationStatus = verificationStatus
    if (name !== undefined) updateData.name = name
    if (phone !== undefined) updateData.phone = phone || null
    if (companyName !== undefined) updateData.companyName = companyName || null
    if (state !== undefined) updateData.state = state || null
    if (city !== undefined) updateData.city = city || null
    if (gstNumber !== undefined) updateData.gstNumber = gstNumber || null
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl || null
    if (bannerUrl !== undefined) updateData.bannerUrl = bannerUrl || null
    if (address !== undefined) updateData.address = address || null
    if (farmName !== undefined) updateData.farmName = farmName || null
    if (farmSize !== undefined) updateData.farmSize = farmSize || null
    if (farmLocation !== undefined) updateData.farmLocation = farmLocation || null
    if (yearsExperience !== undefined) updateData.yearsExperience = yearsExperience || null
    if (certifications !== undefined) updateData.certifications = certifications || null

    const { data: user, error } = await supabase
      .from('User')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('User update error:', error)
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('User update error:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}
