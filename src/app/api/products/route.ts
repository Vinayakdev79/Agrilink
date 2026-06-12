import { supabase } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const state = searchParams.get('state')
    const grade = searchParams.get('grade')
    const sellerId = searchParams.get('sellerId')

    // Single product lookup by ID
    if (id) {
      // Try with sponsored fields first, fallback without
      let { data: product, error } = await supabase
        .from('Product')
        .select('*, seller:User!sellerId(id, name, companyName, verificationStatus, state, city, isSponsored, sponsoredExpiry)')
        .eq('id', id)
        .maybeSingle()

      if (error) {
        // Retry without sponsored columns
        const fallback = await supabase
          .from('Product')
          .select('*, seller:User!sellerId(id, name, companyName, verificationStatus, state, city)')
          .eq('id', id)
          .maybeSingle()
        if (fallback.error) {
          console.error('Product fetch error:', fallback.error)
          return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 })
        }
        product = fallback.data
      }
      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      }
      return NextResponse.json({ product })
    }

    // List products with filters
    let query = supabase
      .from('Product')
      .select('*, seller:User!sellerId(id, name, companyName, verificationStatus, state, city, isSponsored, sponsoredExpiry)')
      .eq('isActive', true)
      .order('createdAt', { ascending: false })
      .limit(50)

    if (category && category !== 'all') {
      query = query.eq('category', category)
    }
    if (search) {
      query = query.ilike('name', '%' + search + '%')
    }
    if (state) {
      query = query.eq('state', state)
    }
    if (grade) {
      query = query.eq('qualityGrade', grade)
    }
    if (sellerId) {
      query = query.eq('sellerId', sellerId)
    }

    const { data: products, error } = await query

    if (error) {
      // Fallback: try without sponsored columns (they may not exist yet)
      let fallbackQuery = supabase
        .from('Product')
        .select('*, seller:User!sellerId(id, name, companyName, verificationStatus, state, city)')
        .eq('isActive', true)
        .order('createdAt', { ascending: false })
        .limit(50)

      if (category && category !== 'all') fallbackQuery = fallbackQuery.eq('category', category)
      if (search) fallbackQuery = fallbackQuery.ilike('name', '%' + search + '%')
      if (state) fallbackQuery = fallbackQuery.eq('state', state)
      if (grade) fallbackQuery = fallbackQuery.eq('qualityGrade', grade)
      if (sellerId) fallbackQuery = fallbackQuery.eq('sellerId', sellerId)

      const fallbackResult = await fallbackQuery
      if (fallbackResult.error) {
        console.error('Products fetch error:', fallbackResult.error)
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
      }

      return NextResponse.json({ products: fallbackResult.data || [] })
    }

    // Sort products so that sponsored sellers (with valid isSponsored and non-expired sponsoredExpiry) appear first
    const now = new Date()
    const sortedProducts = (products ?? []).sort((a: any, b: any) => {
      const aSponsored = a.seller?.isSponsored && a.seller?.sponsoredExpiry && new Date(a.seller.sponsoredExpiry) > now
      const bSponsored = b.seller?.isSponsored && b.seller?.sponsoredExpiry && new Date(b.seller.sponsoredExpiry) > now
      if (aSponsored && !bSponsored) return -1
      if (!aSponsored && bSponsored) return 1
      return 0
    })

    return NextResponse.json({ products: sortedProducts })
  } catch (error) {
    console.error('Products error:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      sellerId, category, name, description, quantity, unit, pricePerUnit,
      minOrderQty, location, state, qualityGrade,
      imageUrl, images, cropVariety, harvestDate, freshness,
      isOrganic, pesticidesUsed, moistureContent, shelfLife,
      storageCondition, certifications,
    } = body

    if (!sellerId || !category || !name || !quantity || !unit || !pricePerUnit || !location) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data: product, error } = await supabase
      .from('Product')
      .insert({
        sellerId,
        category,
        name,
        description,
        quantity: parseFloat(quantity),
        unit,
        pricePerUnit: parseFloat(pricePerUnit),
        minOrderQty: minOrderQty ? parseFloat(minOrderQty) : null,
        location,
        state,
        qualityGrade,
        imageUrl: imageUrl || null,
        images: images || null,
        cropVariety: cropVariety || null,
        harvestDate: harvestDate || null,
        freshness: freshness || null,
        isOrganic: isOrganic || false,
        pesticidesUsed: pesticidesUsed || null,
        moistureContent: moistureContent || null,
        shelfLife: shelfLife || null,
        storageCondition: storageCondition || null,
        certifications: certifications || null,
        isActive: true,
      })
      .select()
      .single()

    if (error) {
      console.error('Product create error:', error)
      return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
    }

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Product create error:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { productId, quantity, isActive } = body

    if (!productId) {
      return NextResponse.json({ error: 'Missing productId' }, { status: 400 })
    }

    // Build update data - only include fields that are provided
    const updateData: Record<string, unknown> = {}
    if (quantity !== undefined) {
      updateData.quantity = parseFloat(quantity)
    }
    if (isActive !== undefined) {
      updateData.isActive = isActive
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    updateData.updatedAt = new Date().toISOString()

    const { data: product, error } = await supabase
      .from('Product')
      .update(updateData)
      .eq('id', productId)
      .select()
      .single()

    if (error) {
      console.error('Product update error:', error)
      return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
    }

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Product update error:', error)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}
