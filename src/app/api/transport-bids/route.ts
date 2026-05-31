import { supabase } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const shipmentId = searchParams.get('shipmentId')

    if (!shipmentId) {
      return NextResponse.json({ error: 'Shipment ID required' }, { status: 400 })
    }

    const { data: bids, error: bidsError } = await supabase
      .from('TransportBid')
      .select('*, transporter:User!transporterId(id, name, companyName, verificationStatus)')
      .eq('shipmentId', shipmentId)
      .order('bidAmount', { ascending: true })

    if (bidsError) {
      console.error('Transport bids fetch error:', bidsError)
      return NextResponse.json({ error: 'Failed to fetch bids' }, { status: 500 })
    }

    return NextResponse.json({ bids: bids || [] })
  } catch (error) {
    console.error('Transport bids error:', error)
    return NextResponse.json({ error: 'Failed to fetch bids' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { shipmentId, transporterId, bidAmount, estimatedDays, vehicleType, comments } = body

    if (!shipmentId || !transporterId || !bidAmount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data: bid, error: bidError } = await supabase
      .from('TransportBid')
      .insert({
        shipmentId,
        transporterId,
        bidAmount: parseFloat(bidAmount),
        estimatedDays: estimatedDays ? parseInt(estimatedDays) : null,
        vehicleType,
        comments,
        status: 'pending',
      })
      .select('*, transporter:User!transporterId(id, name, companyName)')
      .single()

    if (bidError) {
      console.error('Bid create error:', bidError)
      return NextResponse.json({ error: 'Failed to create bid' }, { status: 500 })
    }

    return NextResponse.json({ bid })
  } catch (error) {
    console.error('Bid create error:', error)
    return NextResponse.json({ error: 'Failed to create bid' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { bidId, status } = body

    if (!bidId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // If accepting a bid, reject all others for this shipment
    if (status === 'accepted') {
      const { data: bid } = await supabase
        .from('TransportBid')
        .select('shipmentId, transporterId')
        .eq('id', bidId)
        .single()

      if (bid) {
        // Reject all other bids for this shipment
        await supabase
          .from('TransportBid')
          .update({ status: 'rejected' })
          .eq('shipmentId', bid.shipmentId)
          .neq('id', bidId)

        // Update shipment with transporter
        await supabase
          .from('Shipment')
          .update({ transporterId: bid.transporterId, status: 'assigned' })
          .eq('id', bid.shipmentId)
      }
    }

    const { data: updatedBid, error: updateError } = await supabase
      .from('TransportBid')
      .update({ status })
      .eq('id', bidId)
      .select()
      .single()

    if (updateError) {
      console.error('Bid update error:', updateError)
      return NextResponse.json({ error: 'Failed to update bid' }, { status: 500 })
    }

    return NextResponse.json({ bid: updatedBid })
  } catch (error) {
    console.error('Bid update error:', error)
    return NextResponse.json({ error: 'Failed to update bid' }, { status: 500 })
  }
}
