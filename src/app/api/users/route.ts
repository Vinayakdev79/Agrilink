import { supabase } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const verificationStatus = searchParams.get('verificationStatus')
    const id = searchParams.get('id')

    // Columns that exist in the User table
    const userSelect = 'id, name, email, role, companyName, phone, state, city, verificationStatus, isOnline, gstNumber, avatar, address, farmName, farmSize, farmLocation, farmImages, yearsExperience, certifications, totalTransactions, latitude, longitude, avgRating, totalReviews, createdAt'

    // Single user lookup by ID
    if (id) {
      const { data: user, error: userError } = await supabase
        .from('User')
        .select(userSelect)
        .eq('id', id)
        .maybeSingle()

      if (userError) {
        console.error('User fetch error:', userError)
        return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
      }
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      // Map 'avatar' to 'avatarUrl' for frontend compatibility
      // Extract bannerUrl from farmImages if stored with 'banner:' prefix
      const farmImagesRaw = user.farmImages || ''
      const farmImageParts = farmImagesRaw.split(',').map((p: string) => p.trim()).filter(Boolean)
      const bannerPart = farmImageParts.find((p: string) => p.startsWith('banner:'))
      const cleanFarmImages = farmImageParts.filter((p: string) => !p.startsWith('banner:')).join(',')

      const mappedUser = {
        ...user,
        avatarUrl: user.avatar || null,
        bannerUrl: bannerPart ? bannerPart.replace('banner:', '') : null,
        farmImages: cleanFarmImages || null,
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
    let query = supabase
      .from('User')
      .select(userSelect)
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

    // Map avatar -> avatarUrl for each user, extract bannerUrl from farmImages
    const mappedUsers = users.map(u => {
      const farmImagesRaw = u.farmImages || ''
      const farmImageParts = farmImagesRaw.split(',').map((p: string) => p.trim()).filter(Boolean)
      const bannerPart = farmImageParts.find((p: string) => p.startsWith('banner:'))
      const cleanFarmImages = farmImageParts.filter((p: string) => !p.startsWith('banner:')).join(',')

      return {
        ...u,
        avatarUrl: u.avatar || null,
        bannerUrl: bannerPart ? bannerPart.replace('banner:', '') : null,
        farmImages: cleanFarmImages || null,
      }
    })

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
      yearsExperience, certifications, latitude, longitude,
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
    // Map avatarUrl back to 'avatar' column since that's what exists in DB
    if (avatarUrl !== undefined) updateData.avatar = avatarUrl || null
    // bannerUrl - store in a way that can be retrieved later
    // Since the column doesn't exist, we store it as JSON in the 'avatar' field 
    // with a special prefix. When the column is added, this will be migrated.
    if (bannerUrl !== undefined) {
      // Store banner URL in farmImages field temporarily (hack until column is added)
      // We use a prefix to distinguish from actual farm images
      const existingFarmImages = (await supabase.from('User').select('farmImages').eq('id', userId).single()).data?.farmImages || ''
      const farmImageParts = existingFarmImages.split(',').filter((p: string) => !p.startsWith('banner:'))
      if (bannerUrl) farmImageParts.unshift(`banner:${bannerUrl}`)
      updateData.farmImages = farmImageParts.join(',')
    }
    if (address !== undefined) updateData.address = address || null
    if (farmName !== undefined) updateData.farmName = farmName || null
    if (farmSize !== undefined) updateData.farmSize = farmSize || null
    if (farmLocation !== undefined) updateData.farmLocation = farmLocation || null
    if (yearsExperience !== undefined) updateData.yearsExperience = yearsExperience || null
    if (certifications !== undefined) updateData.certifications = certifications || null
    if (latitude !== undefined) updateData.latitude = latitude || null
    if (longitude !== undefined) updateData.longitude = longitude || null

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
      avatarUrl: user?.avatar || null,
      bannerUrl: null,
    }

    return NextResponse.json({ user: mappedUser })
  } catch (error) {
    console.error('User update error:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}
