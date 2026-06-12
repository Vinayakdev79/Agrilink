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
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "assignedAt" TIMESTAMPTZ;
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "pickupDeadline" TIMESTAMPTZ;
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "isExternal" BOOLEAN DEFAULT false;
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "externalTransporterName" TEXT;
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "externalCompanyName" TEXT;
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "externalDriverName" TEXT;
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "externalVehicleNumber" TEXT;
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "externalMobileNumber" TEXT;
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "externalPickupDate" TIMESTAMPTZ;
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "externalDeliveryDate" TIMESTAMPTZ;

-- Add payment fields to Order table
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentStatus" TEXT DEFAULT 'advance_paid';
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "advanceAmount" FLOAT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "remainingAmount" FLOAT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "platformFee" FLOAT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "remainingPaidAt" TIMESTAMPTZ;

-- Add productId to Review table
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "productId" TEXT REFERENCES "Product"("id");

-- Create PlatformRevenue table
CREATE TABLE IF NOT EXISTS "PlatformRevenue" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "orderId" TEXT REFERENCES "Order"("id"),
  "type" TEXT NOT NULL,
  "amount" FLOAT NOT NULL,
  "userId" TEXT REFERENCES "User"("id"),
  "description" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on PlatformRevenue
ALTER TABLE "PlatformRevenue" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on PlatformRevenue" ON "PlatformRevenue" FOR ALL USING (true) WITH CHECK (true);
`
  return NextResponse.json({ sql: sql.trim(), message: 'Run this SQL in your Supabase SQL Editor to add missing columns' })
}
