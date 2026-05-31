import { supabase } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, role, name, companyName, phone, state, city } = body

    if (!email || !role || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if user exists
    const { data: existing, error: fetchError } = await supabase
      .from('User')
      .select()
      .eq('email', email)
      .maybeSingle()

    if (fetchError) {
      console.error('User lookup error:', fetchError)
      return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
    }

    if (existing) {
      // UPDATE the user's role if different
      if (role && existing.role !== role) {
        const { data: updated, error: updateError } = await supabase
          .from('User')
          .update({
            role,
            companyName: companyName || existing.companyName,
            phone: phone || existing.phone,
            state: state || existing.state,
            city: city || existing.city,
          })
          .eq('id', existing.id)
          .select()
          .single()

        if (updateError) {
          console.error('User update error:', updateError)
          return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
        }

        return NextResponse.json({ user: updated })
      }
      return NextResponse.json({ user: existing })
    }

    // Create new user
    const { data: user, error: createError } = await supabase
      .from('User')
      .insert({
        email,
        role,
        name,
        companyName: companyName || null,
        phone: phone || null,
        state: state || null,
        city: city || null,
        verificationStatus: 'pending',
      })
      .select()
      .single()

    if (createError) {
      console.error('User create error:', createError)
      return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
    }

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

    const { data: user, error: userError } = await supabase
      .from('User')
      .select()
      .eq('email', email)
      .maybeSingle()

    if (userError) {
      console.error('User fetch error:', userError)
      return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Fetch counts separately (replacing Prisma _count)
    const userId = user.id

    const [productsRes, ordersAsBuyerRes, ordersAsSellerRes, shipmentsAsTransporterRes, transportBidsRes] = await Promise.all([
      supabase.from('Product').select('*', { count: 'exact', head: true }).eq('sellerId', userId),
      supabase.from('Order').select('*', { count: 'exact', head: true }).eq('buyerId', userId),
      supabase.from('Order').select('*', { count: 'exact', head: true }).eq('sellerId', userId),
      supabase.from('Shipment').select('*', { count: 'exact', head: true }).eq('transporterId', userId),
      supabase.from('TransportBid').select('*', { count: 'exact', head: true }).eq('transporterId', userId),
    ])

    const userWithCount = {
      ...user,
      _count: {
        products: productsRes.count ?? 0,
        ordersAsBuyer: ordersAsBuyerRes.count ?? 0,
        ordersAsSeller: ordersAsSellerRes.count ?? 0,
        shipmentsAsTransporter: shipmentsAsTransporterRes.count ?? 0,
        transportBids: transportBidsRes.count ?? 0,
      },
    }

    return NextResponse.json({ user: userWithCount })
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}
