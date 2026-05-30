import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const verificationStatus = searchParams.get('verificationStatus')
    const id = searchParams.get('id')

    // Single user lookup by ID
    if (id) {
      const user = await db.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          companyName: true,
          phone: true,
          state: true,
          city: true,
          verificationStatus: true,
          isOnline: true,
          gstNumber: true,
          createdAt: true,
        }
      })
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
      return NextResponse.json({ user })
    }

    const where: Record<string, unknown> = {}
    if (role) where.role = role
    if (verificationStatus) where.verificationStatus = verificationStatus

    const users = await db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        companyName: true,
        phone: true,
        state: true,
        city: true,
        verificationStatus: true,
        isOnline: true,
        createdAt: true,
        _count: {
          select: {
            products: true,
            ordersAsBuyer: true,
            ordersAsSeller: true,
            shipmentsAsTransporter: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Users error:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { userId, verificationStatus, name, phone, companyName, state, city, gstNumber } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    if (verificationStatus) updateData.verificationStatus = verificationStatus
    if (name !== undefined) updateData.name = name
    if (phone !== undefined) updateData.phone = phone || null
    if (companyName !== undefined) updateData.companyName = companyName || null
    if (state !== undefined) updateData.state = state || null
    if (city !== undefined) updateData.city = city || null
    if (gstNumber !== undefined) updateData.gstNumber = gstNumber || null

    const user = await db.user.update({
      where: { id: userId },
      data: updateData,
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error('User update error:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}
