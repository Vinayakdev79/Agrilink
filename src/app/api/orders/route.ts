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

    let orders: unknown[] = []

    if (role === 'buyer') {
      const { data, error } = await supabase
        .from('Order')
        .select('*, seller:User!sellerId(id, name, companyName, phone), product:Product!productId(name, category, unit), shipment:Shipment!orderId(status, origin, destination)')
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
        .select('*, buyer:User!buyerId(id, name, companyName, phone), product:Product!productId(name, category, unit), shipment:Shipment!orderId(status, origin, destination)')
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
        .select('*, buyer:User!buyerId(id, name, companyName), seller:User!sellerId(id, name, companyName), product:Product!productId(name, category, unit), shipment:Shipment!orderId(status, origin, destination)')
        .order('createdAt', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Orders fetch error:', error)
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
      }
      orders = data ?? []
    }

    return NextResponse.json({ orders })
  } catch (error) {
    console.error('Orders error:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { buyerId, sellerId, productId, quantity, unitPrice } = body

    const totalPrice = parseFloat(quantity) * parseFloat(unitPrice)

    const { data: order, error } = await supabase
      .from('Order')
      .insert({
        buyerId,
        sellerId,
        productId,
        quantity: parseFloat(quantity),
        unitPrice: parseFloat(unitPrice),
        totalPrice,
        status: 'negotiating',
      })
      .select()
      .single()

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
