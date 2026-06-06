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
      const { data: product, error } = await supabase
        .from('Product')
        .select('*, seller:User!sellerId(id, name, companyName, verificationStatus, state, city)')
        .eq('id', id)
        .maybeSingle()

      if (error) {
        console.error('Product fetch error:', error)
        return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 })
      }
      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      }
      return NextResponse.json({ product })
    }

    // List products with filters
    let query = supabase
      .from('Product')
      .select('*, seller:User!sellerId(id, name, companyName, verificationStatus, state, city)')
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
      console.error('Products fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }

    return NextResponse.json({ products: products ?? [] })
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
