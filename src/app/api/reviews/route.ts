import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const targetId = searchParams.get('targetId')
    const reviewerId = searchParams.get('reviewerId')

    const where: Record<string, unknown> = {}
    if (targetId) where.targetId = targetId
    if (reviewerId) where.reviewerId = reviewerId

    const reviews = await db.review.findMany({
      where,
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            companyName: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({ reviews })
  } catch (error) {
    console.error('Reviews error:', error)
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { reviewerId, targetId, rating, comment } = body

    if (!reviewerId || !targetId || !rating) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const review = await db.review.create({
      data: {
        reviewerId,
        targetId,
        rating: parseInt(rating),
        comment,
      }
    })

    // Update target user's avg rating
    const allReviews = await db.review.findMany({
      where: { targetId },
      select: { rating: true },
    })
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
    await db.user.update({
      where: { id: targetId },
      data: {
        avgRating: Math.round(avgRating * 10) / 10,
        totalReviews: allReviews.length,
      },
    })

    return NextResponse.json({ review })
  } catch (error) {
    console.error('Review create error:', error)
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 })
  }
}
