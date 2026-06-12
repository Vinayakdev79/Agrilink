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
      transporterId,
      status: requestStatus,
      // External transporter fields (supports both naming conventions)
      isExternal, isExternalTransporter,
      externalTransporterName, externalCompanyName,
      externalDriverName, externalVehicleNumber, externalMobileNumber,
      externalPickupDate, externalDeliveryDate,
      // Also support shorter names from producer dashboard
      driverName: reqDriverName,
      vehicleNumber: reqVehicleNumber,
      driverPhone: reqDriverPhone,
      expectedDeliveryDate,
    } = body

    if (!orderId || !origin || !destination) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const isExt = isExternal || isExternalTransporter || false

    const insertData: Record<string, unknown> = {
      orderId,
      origin,
      destination,
      distance: distance ? parseFloat(distance) : null,
      status: requestStatus || 'pending',
      exactPickupAddress: exactPickupAddress || null,
      exactDropAddress: exactDropAddress || null,
      pickupLatitude: pickupLatitude || null,
      pickupLongitude: pickupLongitude || null,
      dropLatitude: dropLatitude || null,
      dropLongitude: dropLongitude || null,
      expectedPickupDate: expectedPickupDate ? new Date(expectedPickupDate).toISOString() : null,
    }

    // If transporterId is provided at creation, set assignedAt and pickupDeadline
    if (transporterId) {
      insertData.transporterId = transporterId
      const now = new Date()
      insertData.assignedAt = now.toISOString()
      // pickupDeadline = assignedAt + 24 hours
      const deadline = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      insertData.pickupDeadline = deadline.toISOString()
    }

    // External transporter fields
    const externalFields: Record<string, unknown> = {}
    if (isExt) externalFields.isExternal = true
    if (isExternalTransporter) externalFields.isExternalTransporter = isExternalTransporter
    if (externalTransporterName) externalFields.externalTransporterName = externalTransporterName
    if (externalCompanyName) externalFields.externalCompanyName = externalCompanyName
    if (externalDriverName) externalFields.externalDriverName = externalDriverName
    if (externalVehicleNumber) externalFields.externalVehicleNumber = externalVehicleNumber
    if (externalMobileNumber) externalFields.externalMobileNumber = externalMobileNumber
    if (externalPickupDate) externalFields.externalPickupDate = new Date(externalPickupDate).toISOString()
    if (externalDeliveryDate) externalFields.externalDeliveryDate = new Date(externalDeliveryDate).toISOString()
    if (expectedDeliveryDate) externalFields.expectedDeliveryDate = new Date(expectedDeliveryDate).toISOString()

    // Also store external transporter driver info in standard fields for consistent display
    if (isExt) {
      if (reqDriverName || externalDriverName) insertData.driverName = reqDriverName || externalDriverName
      if (reqVehicleNumber || externalVehicleNumber) insertData.vehicleNumber = reqVehicleNumber || externalVehicleNumber
      if (reqDriverPhone || externalMobileNumber) insertData.driverPhone = reqDriverPhone || externalMobileNumber
      if (budgetMin !== undefined) insertData.budgetMin = budgetMin ? parseFloat(budgetMin) : null
      if (budgetMax !== undefined) insertData.budgetMax = budgetMax ? parseFloat(budgetMax) : null
    } else {
      if (budgetMin !== undefined) insertData.budgetMin = budgetMin ? parseFloat(budgetMin) : null
      if (budgetMax !== undefined) insertData.budgetMax = budgetMax ? parseFloat(budgetMax) : null
    }

    // Try insert with all fields (including new external/assigned fields)
    let { data: shipment, error: shipmentError } = await supabase
      .from('Shipment')
      .insert({ ...insertData, ...externalFields })
      .select()
      .single()

    // If external/assigned columns don't exist, retry without them
    if (shipmentError && Object.keys(externalFields).length > 0) {
      const fallbackResult = await supabase
        .from('Shipment')
        .insert(insertData)
        .select()
        .single()

      if (fallbackResult.error) {
        console.error('Shipment create error:', fallbackResult.error)
        return NextResponse.json({ error: 'Failed to create shipment' }, { status: 500 })
      }
      shipment = fallbackResult.data
      shipmentError = null
    }

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
      // External transporter fields
      isExternal, externalTransporterName, externalCompanyName,
      externalDriverName, externalVehicleNumber, externalMobileNumber,
      externalPickupDate, externalDeliveryDate,
    } = body

    if (!shipmentId) {
      return NextResponse.json({ error: 'Missing shipmentId' }, { status: 400 })
    }

    // Fetch current shipment for context
    const { data: currentShipment } = await supabase
      .from('Shipment')
      .select('*')
      .eq('id', shipmentId)
      .single()

    const updateData: Record<string, unknown> = {}
    if (status) updateData.status = status
    if (vehicleType) updateData.vehicleType = vehicleType
    if (vehicleNumber) updateData.vehicleNumber = vehicleNumber
    if (driverName) updateData.driverName = driverName
    if (driverPhone) updateData.driverPhone = driverPhone
    if (expectedPickupDate !== undefined) updateData.expectedPickupDate = expectedPickupDate ? new Date(expectedPickupDate).toISOString() : null

    // If transporterId is being assigned for the first time
    if (transporterId && !currentShipment?.transporterId) {
      updateData.transporterId = transporterId
      const now = new Date()
      updateData.assignedAt = now.toISOString()
      // pickupDeadline = assignedAt + 24 hours
      const deadline = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      updateData.pickupDeadline = deadline.toISOString()
    }

    // External transporter fields
    if (isExternal !== undefined) updateData.isExternal = isExternal
    if (externalTransporterName) updateData.externalTransporterName = externalTransporterName
    if (externalCompanyName) updateData.externalCompanyName = externalCompanyName
    if (externalDriverName) updateData.externalDriverName = externalDriverName
    if (externalVehicleNumber) updateData.externalVehicleNumber = externalVehicleNumber
    if (externalMobileNumber) updateData.externalMobileNumber = externalMobileNumber
    if (externalPickupDate !== undefined) updateData.externalPickupDate = externalPickupDate ? new Date(externalPickupDate).toISOString() : null
    if (externalDeliveryDate !== undefined) updateData.externalDeliveryDate = externalDeliveryDate ? new Date(externalDeliveryDate).toISOString() : null

    if (status === 'delivered') {
      updateData.actualDelivery = new Date().toISOString()
    }

    // When status changes to 'picked_up', update transporter's totalCompletedShipments
    if (status === 'picked_up' && currentShipment?.transporterId) {
      const { data: transporter } = await supabase
        .from('User')
        .select('totalTransactions')
        .eq('id', currentShipment.transporterId)
        .single()

      if (transporter) {
        await supabase
          .from('User')
          .update({
            totalTransactions: (transporter.totalTransactions || 0) + 1,
            updatedAt: new Date().toISOString(),
          })
          .eq('id', currentShipment.transporterId)
      }
    }

    // Check for 24-hour deadline warning
    if (status && currentShipment?.assignedAt) {
      const assignedTime = new Date(currentShipment.assignedAt)
      const now = new Date()
      const hoursSinceAssigned = (now.getTime() - assignedTime.getTime()) / (1000 * 60 * 60)

      if (hoursSinceAssigned > 24 && status !== 'picked_up' && status !== 'delivered' && status !== 'cancelled') {
        console.warn(`[SHIPMENT WARNING] Shipment ${shipmentId} status changed to '${status}' after ${hoursSinceAssigned.toFixed(1)} hours since assignment (>24hrs without pickup)`)
        // Frontend will handle auto-cancel logic
      }
    }

    // When status changes to picked_up or in_transit, handle tracking data
    if (status === 'picked_up' || status === 'in_transit') {
      updateData.lastTrackingUpdate = new Date().toISOString()

      // If switching to in_transit, generate simulated current position (midpoint between pickup and drop)
      if (status === 'in_transit') {
        // Get the shipment to find coordinates
        const existingShipment = currentShipment

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

    // Try update with all fields
    let { data: shipment, error: shipmentError } = await supabase
      .from('Shipment')
      .update(updateData)
      .eq('id', shipmentId)
      .select()
      .single()

    // If update fails due to missing columns (assignedAt, pickupDeadline, external fields),
    // retry with only the basic fields
    if (shipmentError) {
      const basicUpdateData: Record<string, unknown> = {}
      if (status) basicUpdateData.status = status
      if (transporterId) basicUpdateData.transporterId = transporterId
      if (vehicleType) basicUpdateData.vehicleType = vehicleType
      if (vehicleNumber) basicUpdateData.vehicleNumber = vehicleNumber
      if (driverName) basicUpdateData.driverName = driverName
      if (driverPhone) basicUpdateData.driverPhone = driverPhone
      if (expectedPickupDate !== undefined) basicUpdateData.expectedPickupDate = expectedPickupDate ? new Date(expectedPickupDate).toISOString() : null
      if (status === 'delivered') basicUpdateData.actualDelivery = new Date().toISOString()
      if (status === 'picked_up' || status === 'in_transit') {
        basicUpdateData.lastTrackingUpdate = new Date().toISOString()
      }
      if (currentLatitude) basicUpdateData.currentLatitude = currentLatitude
      if (currentLongitude) basicUpdateData.currentLongitude = currentLongitude

      const fallbackResult = await supabase
        .from('Shipment')
        .update(basicUpdateData)
        .eq('id', shipmentId)
        .select()
        .single()

      if (fallbackResult.error) {
        console.error('Shipment update error:', fallbackResult.error)
        return NextResponse.json({ error: 'Failed to update shipment' }, { status: 500 })
      }
      shipment = fallbackResult.data
      shipmentError = null
    }

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
