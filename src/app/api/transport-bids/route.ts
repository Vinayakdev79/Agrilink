import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const shipmentId = searchParams.get('shipmentId')

    if (!shipmentId) {
      return NextResponse.json({ error: 'Shipment ID required' }, { status: 400 })
    }

    const bids = await db.transportBid.findMany({
      where: { shipmentId },
      include: {
        transporter: { select: { id: true, name: true, companyName: true, verificationStatus: true } },
      },
      orderBy: { bidAmount: 'asc' },
    })

    return NextResponse.json({ bids })
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

    const bid = await db.transportBid.create({
      data: {
        shipmentId,
        transporterId,
        bidAmount: parseFloat(bidAmount),
        estimatedDays: estimatedDays ? parseInt(estimatedDays) : null,
        vehicleType,
        comments,
        status: 'pending',
      },
      include: {
        transporter: { select: { id: true, name: true, companyName: true } },
      }
    })

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
      const bid = await db.transportBid.findUnique({ where: { id: bidId } })
      if (bid) {
        await db.transportBid.updateMany({
          where: { shipmentId: bid.shipmentId, id: { not: bidId } },
          data: { status: 'rejected' },
        })
        
        // Update shipment with transporter
        await db.shipment.update({
          where: { id: bid.shipmentId },
          data: { transporterId: bid.transporterId, status: 'assigned' },
        })
      }
    }

    const updatedBid = await db.transportBid.update({
      where: { id: bidId },
      data: { status },
    })

    return NextResponse.json({ bid: updatedBid })
  } catch (error) {
    console.error('Bid update error:', error)
    return NextResponse.json({ error: 'Failed to update bid' }, { status: 500 })
  }
}
