import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const otherUserId = searchParams.get('otherUserId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const where: Record<string, unknown> = {
      OR: [
        { senderId: userId },
        { receiverId: userId }
      ]
    }

    if (otherUserId) {
      where.OR = [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId }
      ]
    }

    const messages = await db.message.findMany({
      where,
      include: {
        sender: { select: { id: true, name: true, companyName: true } },
        receiver: { select: { id: true, name: true, companyName: true } },
      },
      orderBy: { createdAt: 'asc' },
      take: 100,
    })

    // Mark unread messages as read
    if (otherUserId) {
      await db.message.updateMany({
        where: { senderId: otherUserId, receiverId: userId, isRead: false },
        data: { isRead: true },
      })
    }

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Messages error:', error)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { senderId, receiverId, content } = body

    if (!senderId || !receiverId || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const message = await db.message.create({
      data: { senderId, receiverId, content },
      include: {
        sender: { select: { id: true, name: true, companyName: true } },
        receiver: { select: { id: true, name: true, companyName: true } },
      }
    })

    return NextResponse.json({ message })
  } catch (error) {
    console.error('Message create error:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
