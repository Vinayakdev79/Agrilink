import { supabase } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const otherUserId = searchParams.get('otherUserId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    let query = supabase
      .from('Message')
      .select('*, sender:User!senderId(id, name, companyName), receiver:User!receiverId(id, name, companyName)')

    if (otherUserId) {
      // Filter for conversation between two users
      query = query.or(`and(senderId.eq.${userId},receiverId.eq.${otherUserId}),and(senderId.eq.${otherUserId},receiverId.eq.${userId})`)
    } else {
      // Filter for all messages involving the user
      query = query.or(`senderId.eq.${userId},receiverId.eq.${userId}`)
    }

    const { data: messages, error: messagesError } = await query
      .order('createdAt', { ascending: true })
      .limit(100)

    if (messagesError) {
      console.error('Messages fetch error:', messagesError)
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }

    // Mark unread messages as read
    if (otherUserId) {
      await supabase
        .from('Message')
        .update({ isRead: true })
        .eq('senderId', otherUserId)
        .eq('receiverId', userId)
        .is('isRead', false)
    }

    return NextResponse.json({ messages: messages || [] })
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

    const { data: message, error: messageError } = await supabase
      .from('Message')
      .insert({ senderId, receiverId, content })
      .select('*, sender:User!senderId(id, name, companyName), receiver:User!receiverId(id, name, companyName)')
      .single()

    if (messageError) {
      console.error('Message create error:', messageError)
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
    }

    return NextResponse.json({ message })
  } catch (error) {
    console.error('Message create error:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
