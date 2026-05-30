import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const state = searchParams.get('state')
    const grade = searchParams.get('grade')
    const sellerId = searchParams.get('sellerId')

    const where: Record<string, unknown> = { isActive: true }

    if (category && category !== 'all') {
      where.category = category
    }
    if (search) {
      where.name = { contains: search }
    }
    if (state) {
      where.state = state
    }
    if (grade) {
      where.qualityGrade = grade
    }
    if (sellerId) {
      where.sellerId = sellerId
    }

    const products = await db.product.findMany({
      where,
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            companyName: true,
            verificationStatus: true,
            state: true,
            city: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({ products })
  } catch (error) {
    console.error('Products error:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { sellerId, category, name, description, quantity, unit, pricePerUnit, minOrderQty, location, state, qualityGrade } = body

    if (!sellerId || !category || !name || !quantity || !unit || !pricePerUnit || !location) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const product = await db.product.create({
      data: {
        sellerId,
        category,
        name,
        description,
        quantity: parseFloat(quantity),
        unit,
        pricePerUnit: parseFloat(pricePerUnit),
        minOrderQty: minOrderQty ? parseFloat(minOrderQty) : null,
        location,
        state,
        qualityGrade,
        isActive: true,
      }
    })

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Product create error:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}
