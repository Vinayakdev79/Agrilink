import { supabase } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const targetId = searchParams.get('targetId')
    const reviewerId = searchParams.get('reviewerId')
    const productId = searchParams.get('productId')

    let query = supabase
      .from('Review')
      .select('*, reviewer:User!reviewerId(id, name, companyName), product:Product!productId(id, name, category)')
      .order('createdAt', { ascending: false })
      .limit(50)

    if (targetId) query = query.eq('targetId', targetId)
    if (reviewerId) query = query.eq('reviewerId', reviewerId)
    if (productId) query = query.eq('productId', productId)

    const { data: reviews, error: reviewsError } = await query

    if (reviewsError) {
      console.error('Reviews fetch error:', reviewsError)
      return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
    }

    return NextResponse.json({ reviews: reviews || [] })
  } catch (error) {
    console.error('Reviews error:', error)
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { reviewerId, targetId, productId, rating, comment } = body

    if (!reviewerId || !targetId || !rating) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create the review
    const { data: review, error: reviewError } = await supabase
      .from('Review')
      .insert({
        reviewerId,
        targetId,
        productId: productId || null,
        rating: parseInt(rating),
        comment,
      })
      .select()
      .single()

    if (reviewError) {
      console.error('Review create error:', reviewError)
      return NextResponse.json({ error: 'Failed to create review' }, { status: 500 })
    }

    // Fetch all reviews for the target to compute average
    const { data: allReviews, error: allReviewsError } = await supabase
      .from('Review')
      .select('rating')
      .eq('targetId', targetId)

    if (!allReviewsError && allReviews && allReviews.length > 0) {
      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length

      // Update target user's avg rating
      await supabase
        .from('User')
        .update({
          avgRating: Math.round(avgRating * 10) / 10,
          totalReviews: allReviews.length,
        })
        .eq('id', targetId)
    }

    return NextResponse.json({ review })
  } catch (error) {
    console.error('Review create error:', error)
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 })
  }
}
