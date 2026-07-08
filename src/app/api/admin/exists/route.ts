import { supabase } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { data: admins, error } = await supabase
      .from('User')
      .select('id, email')
      .eq('role', 'admin')
      .limit(1)

    if (error) {
      console.error('Admin check error:', error)
      return NextResponse.json({ error: 'Failed to check admin status' }, { status: 500 })
    }

    return NextResponse.json({
      adminExists: admins && admins.length > 0,
      adminEmail: admins && admins.length > 0 ? admins[0].email : null,
    })
  } catch (error) {
    console.error('Admin exists check error:', error)
    return NextResponse.json({ error: 'Failed to check admin status' }, { status: 500 })
  }
}
