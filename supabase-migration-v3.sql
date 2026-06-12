-- =============================================
-- AgroBridge Platform - Migration V3
-- Comprehensive feature support migration
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Add transportBookingFee and estimatedTransportCost to Order table
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "transportBookingFee" NUMERIC DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "estimatedTransportCost" NUMERIC DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "escrowFee" NUMERIC DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "logisticsCommission" NUMERIC DEFAULT 0;

-- 2. Add transporter performance tracking columns to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "pickupSuccessRate" NUMERIC DEFAULT 100;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "deliverySuccessRate" NUMERIC DEFAULT 100;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avgResponseTimeHours" NUMERIC DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "warningCount" INTEGER DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "totalCompletedShipments" INTEGER DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "totalFailedShipments" INTEGER DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastWarningAt" TIMESTAMPTZ;

-- 3. Add subscription fields to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "subscriptionTier" TEXT DEFAULT 'free';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "subscriptionExpiry" TIMESTAMPTZ;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "subscriptionAmount" NUMERIC DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isSponsored" BOOLEAN DEFAULT FALSE;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "sponsoredExpiry" TIMESTAMPTZ;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "sponsoredAmount" NUMERIC DEFAULT 0;

-- 4. Add shipment management fields to Shipment table
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "assignedAt" TIMESTAMPTZ;
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "pickupDeadline" TIMESTAMPTZ;
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "autoCancelledAt" TIMESTAMPTZ;
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "isExternal" BOOLEAN DEFAULT FALSE;
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "externalTransporterName" TEXT;
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "externalCompanyName" TEXT;
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "externalDriverName" TEXT;
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "externalVehicleNumber" TEXT;
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "externalMobileNumber" TEXT;
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "externalPickupDate" TIMESTAMPTZ;
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "externalDeliveryDate" TIMESTAMPTZ;

-- 5. Add Message table for order communication (if not exists)
CREATE TABLE IF NOT EXISTS "Message" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "senderId" TEXT REFERENCES "User"("id"),
  "receiverId" TEXT REFERENCES "User"("id"),
  "orderId" TEXT REFERENCES "Order"("id"),
  "shipmentId" TEXT REFERENCES "Shipment"("id"),
  "content" TEXT NOT NULL,
  "isRead" BOOLEAN DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for Message table
CREATE INDEX IF NOT EXISTS "Message_senderId_idx" ON "Message"("senderId");
CREATE INDEX IF NOT EXISTS "Message_receiverId_idx" ON "Message"("receiverId");
CREATE INDEX IF NOT EXISTS "Message_orderId_idx" ON "Message"("orderId");
CREATE INDEX IF NOT EXISTS "Message_createdAt_idx" ON "Message"("createdAt");

-- 6. Enable RLS on Message table
ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read Message" ON "Message" FOR SELECT USING (true);
CREATE POLICY "Insert Message" ON "Message" FOR INSERT WITH CHECK (true);
CREATE POLICY "Update Message" ON "Message" FOR UPDATE USING (true);

-- 7. Create/Update PlatformRevenue table with all revenue types
CREATE TABLE IF NOT EXISTS "PlatformRevenue" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "type" TEXT NOT NULL,
  "amount" NUMERIC NOT NULL,
  "orderId" TEXT REFERENCES "Order"("id"),
  "shipmentId" TEXT REFERENCES "Shipment"("id"),
  "userId" TEXT REFERENCES "User"("id"),
  "description" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "PlatformRevenue_type_idx" ON "PlatformRevenue"("type");
CREATE INDEX IF NOT EXISTS "PlatformRevenue_userId_idx" ON "PlatformRevenue"("userId");
CREATE INDEX IF NOT EXISTS "PlatformRevenue_createdAt_idx" ON "PlatformRevenue"("createdAt");

-- Enable RLS on PlatformRevenue
ALTER TABLE "PlatformRevenue" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read PlatformRevenue" ON "PlatformRevenue" FOR SELECT USING (true);
CREATE POLICY "Insert PlatformRevenue" ON "PlatformRevenue" FOR INSERT WITH CHECK (true);
CREATE POLICY "Update PlatformRevenue" ON "PlatformRevenue" FOR UPDATE USING (true);

-- 8. Update existing orders with payment status
UPDATE "Order" SET "paymentStatus" = 
  CASE 
    WHEN status = 'delivered' THEN 'full_paid'
    WHEN status IN ('confirmed', 'shipped') THEN 'advance_paid'
    ELSE 'pending'
  END
WHERE "paymentStatus" IS NULL OR "paymentStatus" = 'pending';

-- 9. Add orderId column to Message if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Message' AND column_name = 'orderId'
  ) THEN
    ALTER TABLE "Message" ADD COLUMN "orderId" TEXT REFERENCES "Order"("id");
  END IF;
END $$;

-- 10. Add shipmentId column to Message if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Message' AND column_name = 'shipmentId'
  ) THEN
    ALTER TABLE "Message" ADD COLUMN "shipmentId" TEXT REFERENCES "Shipment"("id");
  END IF;
END $$;

-- =====================================================
-- DONE! AgroBridge V3 migration complete.
-- =====================================================
