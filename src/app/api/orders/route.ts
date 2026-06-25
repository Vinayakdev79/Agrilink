import { supabase } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { computePlatformFee } from '@/lib/razorpay'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const role = searchParams.get('role')

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // Product fields to include in order queries
    const productSelect = 'id, name, category, unit, pricePerUnit, imageUrl, images, qualityGrade, location, state, isOrganic, cropVariety, deliveryHandledByProducer, deliveryFee, freeDelivery'

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
        .select(`*, buyer:User!buyerId(id, name, companyName, phone, email, city, state, avatar, avatarUrl, address), product:Product!productId(${productSelect})`)
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
      // Payment breakdown fields from cart
      platformFee: clientPlatformFee,
      transportBookingFee: clientTransportBookingFee,
      totalPayable: clientTotalPayable,
      advancePayment: clientAdvancePayment,
      remainingPayment: clientRemainingPayment,
      estimatedTransportCost: clientEstimatedTransportCost,
      paymentStatus: clientPaymentStatus,
      status: clientStatus,
      // V4 delivery fields
      deliveryType,
      deliveryFee: clientDeliveryFee,
      localTransporterName,
      localTransporterPhone,
      localTransporterVehicle,
    } = body

    if (!buyerId || !sellerId || !productId || !quantity || !unitPrice) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const parsedQuantity = parseFloat(quantity)
    const parsedUnitPrice = parseFloat(unitPrice)
    const productSubtotal = parsedQuantity * parsedUnitPrice

    // ─── New Revenue Model ────────────────────────────────────────────────
    // Platform fee: ₹1000 flat if subtotal > ₹10,000, else ₹0
    const platformFee = clientPlatformFee !== undefined
      ? Number(clientPlatformFee)
      : computePlatformFee(productSubtotal)

    // Delivery fee (only when producer handles delivery or assigns local transporter)
    const deliveryFee = clientDeliveryFee !== undefined ? Number(clientDeliveryFee) : 0

    // Transport booking fee applies only when the platform arranges transport
    const transportBookingFee = deliveryType && deliveryType !== 'platform'
      ? 0
      : (clientTransportBookingFee || 0)

    const totalPrice = clientTotalPayable || (productSubtotal + platformFee + transportBookingFee + deliveryFee)

    // Use client-provided payment breakdown or calculate defaults (50/50 split)
    const advanceAmount = clientAdvancePayment || Math.round(totalPrice * 0.5 * 100) / 100
    const remainingAmount = clientRemainingPayment || Math.round((totalPrice - advanceAmount) * 100) / 100
    const orderStatus = clientStatus || 'confirmed'

    const insertData: Record<string, unknown> = {
      buyerId,
      sellerId,
      productId,
      quantity: parsedQuantity,
      unitPrice: parsedUnitPrice,
      totalPrice,
      status: orderStatus,
    }

    // Payment fields - try to include them (columns may not exist yet)
    const paymentFields: Record<string, unknown> = {
      paymentStatus: clientPaymentStatus || 'pending',
      advanceAmount,
      remainingAmount,
      platformFee,
    }

    // Additional payment fields from cart checkout
    if (clientTransportBookingFee) paymentFields.transportBookingFee = clientTransportBookingFee
    if (clientEstimatedTransportCost) paymentFields.estimatedTransportCost = clientEstimatedTransportCost

    // Delivery address fields
    if (deliveryAddress) paymentFields.deliveryAddress = deliveryAddress
    if (deliveryCity) paymentFields.deliveryCity = deliveryCity
    if (deliveryState) paymentFields.deliveryState = deliveryState
    if (deliveryPincode) paymentFields.deliveryPincode = deliveryPincode
    if (deliveryLat) paymentFields.deliveryLat = deliveryLat
    if (deliveryLng) paymentFields.deliveryLng = deliveryLng
    if (deliveryFullAddress) paymentFields.deliveryFullAddress = deliveryFullAddress

    // V4 fields
    const v4Fields: Record<string, unknown> = {}
    if (deliveryType) v4Fields.deliveryType = deliveryType
    if (deliveryFee !== undefined) v4Fields.deliveryFee = deliveryFee
    if (localTransporterName) v4Fields.localTransporterName = localTransporterName
    if (localTransporterPhone) v4Fields.localTransporterPhone = localTransporterPhone
    if (localTransporterVehicle) v4Fields.localTransporterVehicle = localTransporterVehicle

    // Try with all fields first
    let { data: order, error } = await supabase
      .from('Order')
      .insert({ ...insertData, ...paymentFields, ...v4Fields })
      .select()
      .single()

    // If V4 columns don't exist, retry without them
    if (error && Object.keys(v4Fields).length > 0) {
      const retryResult = await supabase
        .from('Order')
        .insert({ ...insertData, ...paymentFields })
        .select()
        .single()

      if (!retryResult.error) {
        order = retryResult.data
        error = null
      } else if (retryResult.error && Object.keys(paymentFields).length > 0) {
        // If payment columns also don't exist, try with just delivery fields
        const deliveryOnlyFields: Record<string, unknown> = {}
        if (deliveryAddress) deliveryOnlyFields.deliveryAddress = deliveryAddress
        if (deliveryCity) deliveryOnlyFields.deliveryCity = deliveryCity
        if (deliveryState) deliveryOnlyFields.deliveryState = deliveryState
        if (deliveryPincode) deliveryOnlyFields.deliveryPincode = deliveryPincode
        if (deliveryLat) deliveryOnlyFields.deliveryLat = deliveryLat
        if (deliveryLng) deliveryOnlyFields.deliveryLng = deliveryLng
        if (deliveryFullAddress) deliveryOnlyFields.deliveryFullAddress = deliveryFullAddress

        let fallbackResult = await supabase
          .from('Order')
          .insert({ ...insertData, ...deliveryOnlyFields })
          .select()
          .single()

        if (fallbackResult.error && Object.keys(deliveryOnlyFields).length > 0) {
          // Try without delivery fields too
          fallbackResult = await supabase
            .from('Order')
            .insert(insertData)
            .select()
            .single()
        }

        if (fallbackResult.error) {
          console.error('Order create error:', fallbackResult.error)
          return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
        }
        order = fallbackResult.data
        error = null
      } else {
        console.error('Order create error:', retryResult.error)
        return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
      }
    }

    if (error) {
      console.error('Order create error:', error)
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    // Deduct ordered quantity from Product's available quantity
    const { data: product } = await supabase
      .from('Product')
      .select('quantity')
      .eq('id', productId)
      .single()

    if (product) {
      const newQuantity = Math.max(0, product.quantity - parsedQuantity)
      await supabase
        .from('Product')
        .update({ quantity: newQuantity, updatedAt: new Date().toISOString() })
        .eq('id', productId)
    }

    // Create PlatformRevenue entry for the commission (only if fee > 0)
    if (platformFee > 0) {
      try {
        await supabase
          .from('PlatformRevenue')
          .insert({
            orderId: order.id,
            type: 'platform_fee',
            amount: platformFee,
            userId: sellerId,
            description: `₹${platformFee} platform fee on order ${order.id.slice(-8)} (subtotal ₹${productSubtotal})`,
          })
      } catch (revenueError) {
        console.warn('Could not create PlatformRevenue entry (table may not exist):', revenueError)
      }
    }

    return NextResponse.json({
      order,
      paymentDetails: {
        totalPrice,
        platformFee,
        deliveryFee,
        transportBookingFee,
        advanceAmount,
        remainingAmount,
        paymentStatus: clientPaymentStatus || 'pending',
      },
    })
  } catch (error) {
    console.error('Order create error:', error)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const {
      orderId, status, paymentStatus, remainingPaidAt,
      // V4: producer-driven status updates
      statusUpdatedBy,
      // V4: local transporter assignment by producer
      localTransporterName, localTransporterPhone, localTransporterVehicle,
      deliveryType,
    } = body

    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 })
    }

    // Support payment-only updates (e.g. "Pay Remaining" from buyer)
    if (paymentStatus && !status) {
      const paymentUpdateData: Record<string, unknown> = {
        paymentStatus,
        updatedAt: new Date().toISOString(),
      }
      if (remainingPaidAt) paymentUpdateData.remainingPaidAt = remainingPaidAt

      let { data: order, error } = await supabase
        .from('Order')
        .update(paymentUpdateData)
        .eq('id', orderId)
        .select()
        .single()

      if (error) {
        // Retry without remainingPaidAt if column doesn't exist
        const fallbackData: Record<string, unknown> = {
          paymentStatus,
          updatedAt: new Date().toISOString(),
        }
        const fallbackResult = await supabase
          .from('Order')
          .update(fallbackData)
          .eq('id', orderId)
          .select()
          .single()

        if (fallbackResult.error) {
          console.error('Payment update error:', fallbackResult.error)
          return NextResponse.json({ error: 'Failed to update payment status' }, { status: 500 })
        }
        order = fallbackResult.data
      }

      return NextResponse.json({ order })
    }

    if (!status) {
      // Maybe it's a local-transporter-assignment-only update
      if (localTransporterName !== undefined || localTransporterPhone !== undefined || localTransporterVehicle !== undefined || deliveryType !== undefined) {
        const updateData: Record<string, unknown> = { updatedAt: new Date().toISOString() }
        if (localTransporterName !== undefined) updateData.localTransporterName = localTransporterName
        if (localTransporterPhone !== undefined) updateData.localTransporterPhone = localTransporterPhone
        if (localTransporterVehicle !== undefined) updateData.localTransporterVehicle = localTransporterVehicle
        if (deliveryType) updateData.deliveryType = deliveryType
        if (statusUpdatedBy) {
          updateData.statusUpdatedBy = statusUpdatedBy
          updateData.statusUpdatedAt = new Date().toISOString()
        }
        let { data: order, error } = await supabase
          .from('Order')
          .update(updateData)
          .eq('id', orderId)
          .select()
          .single()
        if (error) {
          // Fallback without V4 columns - just update the timestamp
          const fb = await supabase
            .from('Order')
            .update({ updatedAt: new Date().toISOString() })
            .eq('id', orderId)
            .select()
            .single()
          if (fb.error) {
            return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
          }
          order = fb.data
        }
        return NextResponse.json({ order })
      }
      return NextResponse.json({ error: 'Missing status field' }, { status: 400 })
    }

    // Fetch the current order to get context
    const { data: currentOrder, error: fetchError } = await supabase
      .from('Order')
      .select('*')
      .eq('id', orderId)
      .single()

    if (fetchError || !currentOrder) {
      console.error('Order fetch error:', fetchError)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {
      status,
      updatedAt: new Date().toISOString(),
    }

    // V4: track who changed the status (producer for delivery-handled orders)
    if (statusUpdatedBy) {
      updateData.statusUpdatedBy = statusUpdatedBy
      updateData.statusUpdatedAt = new Date().toISOString()
    }

    // When status changes to 'cancelled', restore the deducted quantity to the Product
    if (status === 'cancelled') {
      const { data: product } = await supabase
        .from('Product')
        .select('quantity')
        .eq('id', currentOrder.productId)
        .single()

      if (product) {
        const restoredQuantity = product.quantity + currentOrder.quantity
        await supabase
          .from('Product')
          .update({ quantity: restoredQuantity, updatedAt: new Date().toISOString() })
          .eq('id', currentOrder.productId)
      }
    }

    // When status changes to 'delivered', update payment and seller's deals count
    if (status === 'delivered') {
      try {
        updateData.paymentStatus = 'full_paid'
        updateData.remainingPaidAt = new Date().toISOString()
      } catch {
        // Columns may not exist yet
      }

      // Increment seller's totalTransactions & totalDeals (deals count fix)
      const { data: seller } = await supabase
        .from('User')
        .select('totalTransactions, totalDeals')
        .eq('id', currentOrder.sellerId)
        .single()

      if (seller) {
        const updates: Record<string, unknown> = {
          totalTransactions: (seller.totalTransactions || 0) + 1,
          totalDeals: (seller.totalDeals || 0) + 1,
          updatedAt: new Date().toISOString(),
        }
        await supabase
          .from('User')
          .update(updates)
          .eq('id', currentOrder.sellerId)
      }

      // Also increment transporter's stats if there's a platform shipment
      const { data: shipment } = await supabase
        .from('Shipment')
        .select('transporterId, isExternal, isExternalTransporter')
        .eq('orderId', orderId)
        .single()

      if (shipment?.transporterId && !shipment.isExternal && !shipment.isExternalTransporter) {
        const { data: transporter } = await supabase
          .from('User')
          .select('totalTransactions, totalCompletedShipments, deliverySuccessRate, totalDeals')
          .eq('id', shipment.transporterId)
          .single()

        if (transporter) {
          await supabase
            .from('User')
            .update({
              totalTransactions: (transporter.totalTransactions || 0) + 1,
              totalCompletedShipments: (transporter.totalCompletedShipments || 0) + 1,
              totalDeals: (transporter.totalDeals || 0) + 1,
              deliverySuccessRate: Math.min(100, (transporter.deliverySuccessRate || 100) + 1),
              updatedAt: new Date().toISOString(),
            })
            .eq('id', shipment.transporterId)
        }
      }
    }

    // When status changes to 'shipped' for producer-handled delivery, no shipment record is created
    // (the producer handles delivery themselves), so we just update the order status

    // Try update with new fields
    let { data: order, error } = await supabase
      .from('Order')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single()

    // If update fails due to missing columns, retry without V4 fields
    if (error && (updateData.paymentStatus || updateData.remainingPaidAt || updateData.statusUpdatedBy || updateData.statusUpdatedAt)) {
      const fallbackData: Record<string, unknown> = {
        status,
        updatedAt: new Date().toISOString(),
      }
      if (updateData.paymentStatus) fallbackData.paymentStatus = updateData.paymentStatus
      if (updateData.remainingPaidAt) fallbackData.remainingPaidAt = updateData.remainingPaidAt

      const fallbackResult = await supabase
        .from('Order')
        .update(fallbackData)
        .eq('id', orderId)
        .select()
        .single()

      if (fallbackResult.error) {
        console.error('Order update error:', fallbackResult.error)
        return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
      }
      order = fallbackResult.data
      error = null
    }

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
