import { supabase } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  // Return the SQL needed for migration
  const sql = `
-- Add missing columns to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bannerUrl" TEXT;

-- Add missing columns to Shipment table
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "budgetMin" FLOAT;
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "budgetMax" FLOAT;
`
  return NextResponse.json({ sql: sql.trim(), message: 'Run this SQL in your Supabase SQL Editor to add missing columns' })
}
