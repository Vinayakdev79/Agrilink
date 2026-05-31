import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const transporterId = searchParams.get('transporterId')
    const status = searchParams.get('status')
    const orderId = searchParams.get('orderId')

    const where: Record<string, unknown> = {}
    if (transporterId) where.transporterId = transporterId
    if (status) where.status = status
    if (orderId) where.orderId = orderId

    const shipments = await db.shipment.findMany({
      where,
      include: {
        order: {
          include: {
            buyer: { select: { id: true, name: true, companyName: true, phone: true, city: true } },
            seller: { select: { id: true, name: true, companyName: true, phone: true, city: true } },
            product: { select: { name: true, category: true, quantity: true, unit: true } },
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
            product: { select: { name: true, category: true, quantity: true, unit: true } },
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
    const {
      orderId, origin, destination, distance,
      exactPickupAddress, exactDropAddress,
      pickupLatitude, pickupLongitude,
      dropLatitude, dropLongitude,
      expectedPickupDate,
    } = body

    const shipment = await db.shipment.create({
      data: {
        orderId,
        origin,
        destination,
        distance: distance ? parseFloat(distance) : null,
        status: 'pending',
        exactPickupAddress: exactPickupAddress || null,
        exactDropAddress: exactDropAddress || null,
        pickupLatitude: pickupLatitude || null,
        pickupLongitude: pickupLongitude || null,
        dropLatitude: dropLatitude || null,
        dropLongitude: dropLongitude || null,
        expectedPickupDate: expectedPickupDate ? new Date(expectedPickupDate) : null,
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
    const {
      shipmentId, status, transporterId, vehicleType, vehicleNumber,
      driverName, driverPhone,
      currentLatitude, currentLongitude,
    } = body

    const updateData: Record<string, unknown> = { status }
    if (transporterId) updateData.transporterId = transporterId
    if (vehicleType) updateData.vehicleType = vehicleType
    if (vehicleNumber) updateData.vehicleNumber = vehicleNumber
    if (driverName) updateData.driverName = driverName
    if (driverPhone) updateData.driverPhone = driverPhone

    if (status === 'delivered') {
      updateData.actualDelivery = new Date()
    }

    // When status changes to picked_up or in_transit, handle tracking data
    if (status === 'picked_up' || status === 'in_transit') {
      updateData.lastTrackingUpdate = new Date()

      // If switching to in_transit, generate simulated current position (midpoint between pickup and drop)
      if (status === 'in_transit') {
        // Get the shipment to find coordinates
        const existingShipment = await db.shipment.findUnique({
          where: { id: shipmentId }
        })

        if (existingShipment) {
          const pLat = existingShipment.pickupLatitude ? parseFloat(existingShipment.pickupLatitude) : null
          const pLng = existingShipment.pickupLongitude ? parseFloat(existingShipment.pickupLongitude) : null
          const dLat = existingShipment.dropLatitude ? parseFloat(existingShipment.dropLatitude) : null
          const dLng = existingShipment.dropLongitude ? parseFloat(existingShipment.dropLongitude) : null

          if (pLat && pLng && dLat && dLng && !currentLatitude) {
            // Generate a simulated position ~40-60% of the way between pickup and drop
            const progress = 0.4 + Math.random() * 0.2
            const simLat = pLat + (dLat - pLat) * progress
            const simLng = pLng + (dLng - pLng) * progress
            updateData.currentLatitude = simLat.toFixed(6)
            updateData.currentLongitude = simLng.toFixed(6)
          }
        }

        // Allow explicit override of current position
        if (currentLatitude) updateData.currentLatitude = currentLatitude
        if (currentLongitude) updateData.currentLongitude = currentLongitude
      }
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
