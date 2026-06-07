import { supabase } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const role = searchParams.get('role')

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // Product fields to include in order queries
    const productSelect = 'id, name, category, unit, pricePerUnit, imageUrl, images, qualityGrade, location, state, isOrganic, cropVariety'

    let orders: unknown[] = []

    if (role === 'buyer') {
      const { data, error } = await supabase
        .from('Order')
        .select(`*, seller:User!sellerId(id, name, companyName, phone, city, state, avatar), product:Product!productId(${productSelect})`)
        .eq('buyerId', userId)
        .order('createdAt', { ascending: false })

      if (error) {
        console.error('Orders fetch error:', error)
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
      }
      orders = data ?? []
    } else if (role === 'producer' || role === 'seller') {
      const { data, error } = await supabase
        .from('Order')
        .select(`*, buyer:User!buyerId(id, name, companyName, phone, city, state, avatar, address), product:Product!productId(${productSelect})`)
        .eq('sellerId', userId)
        .order('createdAt', { ascending: false })

      if (error) {
        console.error('Orders fetch error:', error)
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
      }
      orders = data ?? []
    } else if (role === 'admin') {
      const { data, error } = await supabase
        .from('Order')
        .select(`*, buyer:User!buyerId(id, name, companyName), seller:User!sellerId(id, name, companyName), product:Product!productId(${productSelect})`)
        .order('createdAt', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Orders fetch error:', error)
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
      }
      orders = data ?? []
    }

    return NextResponse.json({ orders: (orders as any[]).map(mapOrderAvatar) })
  } catch (error) {
    console.error('Orders error:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

// Helper to map avatar -> avatarUrl for frontend compatibility
function mapOrderAvatar(order: any) {
  if (order.seller?.avatar) {
    order.seller.avatarUrl = order.seller.avatar
  }
  if (order.buyer?.avatar) {
    order.buyer.avatarUrl = order.buyer.avatar
  }
  return order
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      buyerId, sellerId, productId, quantity, unitPrice,
      deliveryAddress, deliveryCity, deliveryState, deliveryPincode,
      deliveryLat, deliveryLng, deliveryFullAddress,
    } = body

    const totalPrice = parseFloat(quantity) * parseFloat(unitPrice)

    const insertData: Record<string, unknown> = {
      buyerId,
      sellerId,
      productId,
      quantity: parseFloat(quantity),
      unitPrice: parseFloat(unitPrice),
      totalPrice,
      status: 'negotiating',
    }

    // Try inserting with delivery address fields first
    // If the columns don't exist yet, fall back to basic fields
    const deliveryFields: Record<string, unknown> = {}
    if (deliveryAddress) deliveryFields.deliveryAddress = deliveryAddress
    if (deliveryCity) deliveryFields.deliveryCity = deliveryCity
    if (deliveryState) deliveryFields.deliveryState = deliveryState
    if (deliveryPincode) deliveryFields.deliveryPincode = deliveryPincode
    if (deliveryLat) deliveryFields.deliveryLat = deliveryLat
    if (deliveryLng) deliveryFields.deliveryLng = deliveryLng
    if (deliveryFullAddress) deliveryFields.deliveryFullAddress = deliveryFullAddress

    // Try with delivery fields first
    let { data: order, error } = await supabase
      .from('Order')
      .insert({ ...insertData, ...deliveryFields })
      .select()
      .single()

    // If delivery columns don't exist, retry without them
    if (error && Object.keys(deliveryFields).length > 0) {
      const fallbackResult = await supabase
        .from('Order')
        .insert(insertData)
        .select()
        .single()
      
      if (fallbackResult.error) {
        console.error('Order create error:', fallbackResult.error)
        return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
      }
      order = fallbackResult.data
      error = null
    }

    if (error) {
      console.error('Order create error:', error)
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error('Order create error:', error)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { orderId, status } = body

    if (!orderId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data: order, error } = await supabase
      .from('Order')
      .update({ status })
      .eq('id', orderId)
      .select()
      .single()

    if (error) {
      console.error('Order update error:', error)
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error('Order update error:', error)
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}
