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
        .select(`*, buyer:User!buyerId(id, name, companyName, phone, city, state, avatar, avatarUrl, address), product:Product!productId(${productSelect})`)
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
    } = body

    if (!buyerId || !sellerId || !productId || !quantity || !unitPrice) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const parsedQuantity = parseFloat(quantity)
    const parsedUnitPrice = parseFloat(unitPrice)
    const totalPrice = clientTotalPayable || (parsedQuantity * parsedUnitPrice)

    // Use client-provided payment breakdown or calculate defaults
    const platformFee = clientPlatformFee || Math.round(parsedQuantity * parsedUnitPrice * 0.02 * 100) / 100
    const advanceAmount = clientAdvancePayment || Math.round(totalPrice * 0.5 * 100) / 100
    const remainingAmount = clientRemainingPayment || Math.round(totalPrice * 0.5 * 100) / 100
    const orderStatus = clientStatus || 'negotiating'

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
      paymentStatus: clientPaymentStatus || 'advance_paid',
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

    // Try with all fields first
    let { data: order, error } = await supabase
      .from('Order')
      .insert({ ...insertData, ...paymentFields })
      .select()
      .single()

    // If payment/delivery columns don't exist, retry without them
    if (error) {
      // Try without payment fields
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

    // Create PlatformRevenue entry for the commission
    try {
      await supabase
        .from('PlatformRevenue')
        .insert({
          orderId: order.id,
          type: 'commission',
          amount: platformFee,
          userId: sellerId,
          description: `2% platform commission on order ${order.id}`,
        })
    } catch (revenueError) {
      // Table may not exist yet - log but don't fail the order
      console.warn('Could not create PlatformRevenue entry (table may not exist):', revenueError)
    }

    return NextResponse.json({
      order,
      paymentDetails: {
        totalPrice,
        platformFee,
        advanceAmount,
        remainingAmount,
        paymentStatus: 'advance_paid',
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
    const { orderId, status, paymentStatus, remainingPaidAt } = body

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

    // When status changes to 'delivered', update payment and transporter stats
    if (status === 'delivered') {
      // Try to update payment status to 'full_paid' and set remainingPaidAt
      try {
        updateData.paymentStatus = 'full_paid'
        updateData.remainingPaidAt = new Date().toISOString()
      } catch {
        // Columns may not exist yet
      }

      // Update transporter's totalCompletedShipments
      // Find the shipment for this order
      const { data: shipment } = await supabase
        .from('Shipment')
        .select('transporterId')
        .eq('orderId', orderId)
        .single()

      if (shipment?.transporterId) {
        const { data: transporter } = await supabase
          .from('User')
          .select('totalTransactions')
          .eq('id', shipment.transporterId)
          .single()

        if (transporter) {
          await supabase
            .from('User')
            .update({
              totalTransactions: (transporter.totalTransactions || 0) + 1,
              updatedAt: new Date().toISOString(),
            })
            .eq('id', shipment.transporterId)
        }
      }
    }

    // Try update with new fields
    let { data: order, error } = await supabase
      .from('Order')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single()

    // If update fails due to missing columns, retry without payment fields
    if (error && (updateData.paymentStatus || updateData.remainingPaidAt)) {
      const fallbackData: Record<string, unknown> = {
        status,
        updatedAt: new Date().toISOString(),
      }
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
