import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, role, name, companyName, phone, state, city } = body

    if (!email || !role || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if user exists
    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      // UPDATE the user's role if different
      if (role && existing.role !== role) {
        const updated = await db.user.update({
          where: { id: existing.id },
          data: { 
            role,
            companyName: companyName || existing.companyName,
            phone: phone || existing.phone,
            state: state || existing.state,
            city: city || existing.city,
          }
        })
        return NextResponse.json({ user: updated })
      }
      return NextResponse.json({ user: existing })
    }

    // Create new user
    const user = await db.user.create({
      data: {
        email,
        role,
        name,
        companyName: companyName || null,
        phone: phone || null,
        state: state || null,
        city: city || null,
        verificationStatus: 'pending',
      }
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    const user = await db.user.findUnique({ 
      where: { email },
      include: {
        _count: {
          select: {
            products: true,
            ordersAsBuyer: true,
            ordersAsSeller: true,
            shipmentsAsTransporter: true,
            transportBids: true,
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}
