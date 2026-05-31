import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Server-side Supabase client using the anon key
// The RLS policies on Supabase allow anon access (set up via supabase-setup.sql)

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Create client even if credentials are missing (will fail gracefully on queries)
export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
)

// Helper to check if Supabase is properly configured
export const isSupabaseConfigured = (): boolean => {
  return supabaseUrl.length > 10 && supabaseAnonKey.length > 10 && 
    supabaseUrl !== 'https://placeholder.supabase.co'
}
