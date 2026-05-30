import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const transporterId = searchParams.get('transporterId')
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}
    if (transporterId) where.transporterId = transporterId
    if (status) where.status = status

    const shipments = await db.shipment.findMany({
      where,
      include: {
        order: {
          include: {
            buyer: { select: { id: true, name: true, companyName: true, phone: true } },
            seller: { select: { id: true, name: true, companyName: true, phone: true } },
            product: { select: { name: true, category: true } },
          }
        },
        transporter: { select: { id: true, name: true, companyName: true, phone: true } },
        transportBids: {
          include: {
            transporter: { select: { id: true, name: true, companyName: true } }
          }
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Also get shipments pending bidding (no transporter assigned)
    const pendingShipments = await db.shipment.findMany({
      where: { transporterId: null, status: 'pending' },
      include: {
        order: {
          include: {
            buyer: { select: { id: true, name: true, companyName: true } },
            seller: { select: { id: true, name: true, companyName: true } },
            product: { select: { name: true, category: true } },
          }
        },
        transportBids: {
          include: {
            transporter: { select: { id: true, name: true, companyName: true } }
          }
        },
      },
    })

    return NextResponse.json({ shipments, pendingShipments })
  } catch (error) {
    console.error('Shipments error:', error)
    return NextResponse.json({ error: 'Failed to fetch shipments' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { orderId, origin, destination, distance } = body

    const shipment = await db.shipment.create({
      data: {
        orderId,
        origin,
        destination,
        distance: distance ? parseFloat(distance) : null,
        status: 'pending',
      }
    })

    // Update order status
    await db.order.update({
      where: { id: orderId },
      data: { status: 'confirmed' },
    })

    return NextResponse.json({ shipment })
  } catch (error) {
    console.error('Shipment create error:', error)
    return NextResponse.json({ error: 'Failed to create shipment' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { shipmentId, status, transporterId, vehicleType, vehicleNumber, driverName, driverPhone } = body

    const updateData: Record<string, unknown> = { status }
    if (transporterId) updateData.transporterId = transporterId
    if (vehicleType) updateData.vehicleType = vehicleType
    if (vehicleNumber) updateData.vehicleNumber = vehicleNumber
    if (driverName) updateData.driverName = driverName
    if (driverPhone) updateData.driverPhone = driverPhone

    if (status === 'delivered') {
      updateData.actualDelivery = new Date()
    }

    const shipment = await db.shipment.update({
      where: { id: shipmentId },
      data: updateData,
    })

    // Update order status accordingly
    if (status === 'delivered') {
      await db.order.update({
        where: { id: shipment.orderId },
        data: { status: 'delivered' },
      })
    } else if (status === 'in_transit') {
      await db.order.update({
        where: { id: shipment.orderId },
        data: { status: 'shipped' },
      })
    }

    return NextResponse.json({ shipment })
  } catch (error) {
    console.error('Shipment update error:', error)
    return NextResponse.json({ error: 'Failed to update shipment' }, { status: 500 })
  }
}
