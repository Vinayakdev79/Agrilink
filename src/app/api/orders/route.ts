import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const role = searchParams.get('role')

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    let orders = []

    if (role === 'buyer') {
      orders = await db.order.findMany({
        where: { buyerId: userId },
        include: {
          seller: { select: { id: true, name: true, companyName: true, phone: true } },
          product: { select: { name: true, category: true, unit: true } },
          shipment: { select: { status: true, origin: true, destination: true } },
        },
        orderBy: { createdAt: 'desc' },
      })
    } else if (role === 'producer' || role === 'seller') {
      orders = await db.order.findMany({
        where: { sellerId: userId },
        include: {
          buyer: { select: { id: true, name: true, companyName: true, phone: true } },
          product: { select: { name: true, category: true, unit: true } },
          shipment: { select: { status: true, origin: true, destination: true } },
        },
        orderBy: { createdAt: 'desc' },
      })
    } else if (role === 'admin') {
      orders = await db.order.findMany({
        include: {
          buyer: { select: { id: true, name: true, companyName: true } },
          seller: { select: { id: true, name: true, companyName: true } },
          product: { select: { name: true, category: true, unit: true } },
          shipment: { select: { status: true, origin: true, destination: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      })
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

    const order = await db.order.create({
      data: {
        buyerId,
        sellerId,
        productId,
        quantity: parseFloat(quantity),
        unitPrice: parseFloat(unitPrice),
        totalPrice,
        status: 'negotiating',
      }
    })

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

    const order = await db.order.update({
      where: { id: orderId },
      data: { status },
    })

    return NextResponse.json({ order })
  } catch (error) {
    console.error('Order update error:', error)
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}
