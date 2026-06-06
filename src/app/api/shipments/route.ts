import { supabase } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const transporterId = searchParams.get('transporterId')
    const status = searchParams.get('status')
    const orderId = searchParams.get('orderId')

    // Build filtered shipments query
    let shipmentsQuery = supabase
      .from('Shipment')
      .select('*, order:Order!orderId(*, buyer:User!buyerId(id, name, companyName, phone, city), seller:User!sellerId(id, name, companyName, phone, city), product:Product!productId(name, category, quantity, unit)), transporter:User!transporterId(id, name, companyName, phone), transportBids:TransportBid!shipmentId(*, transporter:User!transporterId(id, name, companyName))')
      .order('createdAt', { ascending: false })

    if (transporterId) shipmentsQuery = shipmentsQuery.eq('transporterId', transporterId)
    if (status) shipmentsQuery = shipmentsQuery.eq('status', status)
    if (orderId) shipmentsQuery = shipmentsQuery.eq('orderId', orderId)

    const { data: shipments, error: shipmentsError } = await shipmentsQuery

    if (shipmentsError) {
      console.error('Shipments fetch error:', shipmentsError)
      return NextResponse.json({ error: 'Failed to fetch shipments' }, { status: 500 })
    }

    // Also get shipments pending bidding (no transporter assigned)
    const { data: pendingShipments, error: pendingError } = await supabase
      .from('Shipment')
      .select('*, order:Order!orderId(*, buyer:User!buyerId(id, name, companyName), seller:User!sellerId(id, name, companyName), product:Product!productId(name, category, quantity, unit)), transportBids:TransportBid!shipmentId(*, transporter:User!transporterId(id, name, companyName))')
      .is('transporterId', null)
      .eq('status', 'pending')

    if (pendingError) {
      console.error('Pending shipments fetch error:', pendingError)
      return NextResponse.json({ error: 'Failed to fetch pending shipments' }, { status: 500 })
    }

    return NextResponse.json({ shipments: shipments || [], pendingShipments: pendingShipments || [] })
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
      budgetMin, budgetMax,
    } = body

    const { data: shipment, error: shipmentError } = await supabase
      .from('Shipment')
      .insert({
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
        expectedPickupDate: expectedPickupDate ? new Date(expectedPickupDate).toISOString() : null,
      })
      .select()
      .single()

    if (shipmentError) {
      console.error('Shipment create error:', shipmentError)
      return NextResponse.json({ error: 'Failed to create shipment' }, { status: 500 })
    }

    // Update order status
    const { error: orderError } = await supabase
      .from('Order')
      .update({ status: 'confirmed' })
      .eq('id', orderId)

    if (orderError) {
      console.error('Order update error:', orderError)
    }

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
      expectedPickupDate,
    } = body

    const updateData: Record<string, unknown> = { status }
    if (transporterId) updateData.transporterId = transporterId
    if (vehicleType) updateData.vehicleType = vehicleType
    if (vehicleNumber) updateData.vehicleNumber = vehicleNumber
    if (driverName) updateData.driverName = driverName
    if (driverPhone) updateData.driverPhone = driverPhone
    if (expectedPickupDate !== undefined) updateData.expectedPickupDate = expectedPickupDate ? new Date(expectedPickupDate).toISOString() : null

    if (status === 'delivered') {
      updateData.actualDelivery = new Date().toISOString()
    }

    // When status changes to picked_up or in_transit, handle tracking data
    if (status === 'picked_up' || status === 'in_transit') {
      updateData.lastTrackingUpdate = new Date().toISOString()

      // If switching to in_transit, generate simulated current position (midpoint between pickup and drop)
      if (status === 'in_transit') {
        // Get the shipment to find coordinates
        const { data: existingShipment } = await supabase
          .from('Shipment')
          .select('pickupLatitude, pickupLongitude, dropLatitude, dropLongitude')
          .eq('id', shipmentId)
          .single()

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

    const { data: shipment, error: shipmentError } = await supabase
      .from('Shipment')
      .update(updateData)
      .eq('id', shipmentId)
      .select()
      .single()

    if (shipmentError) {
      console.error('Shipment update error:', shipmentError)
      return NextResponse.json({ error: 'Failed to update shipment' }, { status: 500 })
    }

    // Update order status accordingly
    if (status === 'delivered' && shipment) {
      await supabase
        .from('Order')
        .update({ status: 'delivered' })
        .eq('id', shipment.orderId)
    } else if (status === 'in_transit' && shipment) {
      await supabase
        .from('Order')
        .update({ status: 'shipped' })
        .eq('id', shipment.orderId)
    }

    return NextResponse.json({ shipment })
  } catch (error) {
    console.error('Shipment update error:', error)
    return NextResponse.json({ error: 'Failed to update shipment' }, { status: 500 })
  }
}
