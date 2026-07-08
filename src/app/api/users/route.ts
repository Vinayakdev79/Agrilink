import { supabase } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// Base columns that always exist in the User table
const userSelectBase = 'id, name, email, role, companyName, phone, state, city, verificationStatus, isOnline, gstNumber, avatar, avatarUrl, bannerUrl, address, farmName, farmSize, farmLocation, farmImages, yearsExperience, certifications, totalTransactions, latitude, longitude, avgRating, totalReviews, createdAt'

// Extended columns from migration V3 (may not exist yet)
const userSelectExtended = 'pickupSuccessRate, deliverySuccessRate, avgResponseTimeHours, warningCount, totalCompletedShipments, totalFailedShipments, lastWarningAt, subscriptionTier, subscriptionExpiry, subscriptionAmount, isSponsored, sponsoredExpiry, sponsoredAmount'

// V4 columns (may not exist yet)
const userSelectV4 = 'subscriptionPaymentId, subscriptionStatus, subscriptionStartedAt, totalDeals'

const userSelectFull = `${userSelectBase}, ${userSelectExtended}, ${userSelectV4}`

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const verificationStatus = searchParams.get('verificationStatus')
    const id = searchParams.get('id')

    // Single user lookup by ID
    if (id) {
      // Try with full columns (base + extended + V4) first
      let { data: user, error: userError } = await supabase
        .from('User')
        .select(userSelectFull)
        .eq('id', id)
        .maybeSingle()

      if (userError) {
        // Fallback: try without V4 columns (base + extended)
        const fallback1 = await supabase
          .from('User')
          .select(`${userSelectBase}, ${userSelectExtended}`)
          .eq('id', id)
          .maybeSingle()
        
        if (fallback1.error) {
          // Final fallback: try with just base columns
          const fallback2 = await supabase
            .from('User')
            .select(userSelectBase)
            .eq('id', id)
            .maybeSingle()
          user = fallback2.data
          userError = fallback2.error
        } else {
          user = fallback1.data
          userError = null
        }
      }

      if (userError) {
        console.error('User fetch error:', userError)
        return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
      }
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      // Use avatarUrl/bannerUrl columns directly, fallback to avatar for legacy data
      // Provide defaults for extended + V4 columns in case they don't exist
      const mappedUser = {
        ...user,
        avatarUrl: user.avatarUrl || user.avatar || null,
        bannerUrl: user.bannerUrl || null,
        pickupSuccessRate: user.pickupSuccessRate ?? 100,
        deliverySuccessRate: user.deliverySuccessRate ?? 100,
        avgResponseTimeHours: user.avgResponseTimeHours ?? 0,
        warningCount: user.warningCount ?? 0,
        totalCompletedShipments: user.totalCompletedShipments ?? 0,
        totalFailedShipments: user.totalFailedShipments ?? 0,
        // V4 defaults
        subscriptionStatus: (user as any).subscriptionStatus ?? 'inactive',
        totalDeals: (user as any).totalDeals ?? 0,
      }

      // Fetch counts separately
      const [productsRes, ordersAsBuyerRes, ordersAsSellerRes, shipmentsAsTransporterRes] = await Promise.all([
        supabase.from('Product').select('*', { count: 'exact', head: true }).eq('sellerId', id),
        supabase.from('Order').select('*', { count: 'exact', head: true }).eq('buyerId', id),
        supabase.from('Order').select('*', { count: 'exact', head: true }).eq('sellerId', id),
        supabase.from('Shipment').select('*', { count: 'exact', head: true }).eq('transporterId', id),
      ])

      const userWithCount = {
        ...mappedUser,
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
    // Try with full columns (base + extended + V4) first, cascade down
    let query = supabase
      .from('User')
      .select(userSelectFull)
      .order('createdAt', { ascending: false })

    if (role) {
      query = query.eq('role', role)
    }
    if (verificationStatus) {
      query = query.eq('verificationStatus', verificationStatus)
    }

    let { data: users, error: usersError } = await query

    if (usersError) {
      // Fallback 1: try without V4 columns (base + extended)
      let fallbackQuery1 = supabase
        .from('User')
        .select(`${userSelectBase}, ${userSelectExtended}`)
        .order('createdAt', { ascending: false })

      if (role) fallbackQuery1 = fallbackQuery1.eq('role', role)
      if (verificationStatus) fallbackQuery1 = fallbackQuery1.eq('verificationStatus', verificationStatus)

      const fallback1 = await fallbackQuery1
      if (fallback1.error) {
        // Fallback 2: try with just base columns
        let fallbackQuery2 = supabase
          .from('User')
          .select(userSelectBase)
          .order('createdAt', { ascending: false })

        if (role) fallbackQuery2 = fallbackQuery2.eq('role', role)
        if (verificationStatus) fallbackQuery2 = fallbackQuery2.eq('verificationStatus', verificationStatus)

        const fallback2 = await fallbackQuery2
        users = fallback2.data
        usersError = fallback2.error
      } else {
        users = fallback1.data
        usersError = null
      }
    }

    if (usersError) {
      console.error('Users fetch error:', usersError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ users: [] })
    }

    // Map avatar -> avatarUrl for each user + add defaults for extended + V4 columns
    const mappedUsers = users.map(u => ({
      ...u,
      avatarUrl: u.avatarUrl || u.avatar || null,
      bannerUrl: u.bannerUrl || null,
      pickupSuccessRate: (u as any).pickupSuccessRate ?? 100,
      deliverySuccessRate: (u as any).deliverySuccessRate ?? 100,
      avgResponseTimeHours: (u as any).avgResponseTimeHours ?? 0,
      warningCount: (u as any).warningCount ?? 0,
      totalCompletedShipments: (u as any).totalCompletedShipments ?? 0,
      totalFailedShipments: (u as any).totalFailedShipments ?? 0,
      // V4 defaults
      subscriptionStatus: (u as any).subscriptionStatus ?? 'inactive',
      totalDeals: (u as any).totalDeals ?? 0,
    }))

    // Fetch all related FK values and compute counts in JS
    const userIds = mappedUsers.map(u => u.id)

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
    const usersWithCount = mappedUsers.map(user => ({
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
      yearsExperience, certifications, latitude, longitude, farmImages,
      subscriptionTier, subscriptionExpiry, subscriptionAmount,
      isSponsored, sponsoredExpiry, sponsoredAmount,
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
    // Save avatarUrl and bannerUrl to their dedicated columns
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl || null
    if (bannerUrl !== undefined) updateData.bannerUrl = bannerUrl || null
    if (address !== undefined) updateData.address = address || null
    if (farmName !== undefined) updateData.farmName = farmName || null
    if (farmSize !== undefined) updateData.farmSize = farmSize || null
    if (farmLocation !== undefined) updateData.farmLocation = farmLocation || null
    if (yearsExperience !== undefined) updateData.yearsExperience = yearsExperience || null
    if (certifications !== undefined) updateData.certifications = certifications || null
    if (latitude !== undefined) updateData.latitude = latitude || null
    if (longitude !== undefined) updateData.longitude = longitude || null
    if (farmImages !== undefined) updateData.farmImages = farmImages || null
    if (subscriptionTier !== undefined) updateData.subscriptionTier = subscriptionTier || 'free'
    if (subscriptionExpiry !== undefined) updateData.subscriptionExpiry = subscriptionExpiry || null
    if (subscriptionAmount !== undefined) updateData.subscriptionAmount = subscriptionAmount || null
    if (isSponsored !== undefined) updateData.isSponsored = isSponsored
    if (sponsoredExpiry !== undefined) updateData.sponsoredExpiry = sponsoredExpiry || null
    if (sponsoredAmount !== undefined) updateData.sponsoredAmount = sponsoredAmount || null

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

    // Map avatar -> avatarUrl for frontend compatibility
    const mappedUser = {
      ...user,
      avatarUrl: user?.avatarUrl || user?.avatar || null,
      bannerUrl: user?.bannerUrl || null,
    }

    return NextResponse.json({ user: mappedUser })
  } catch (error) {
    console.error('User update error:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}
