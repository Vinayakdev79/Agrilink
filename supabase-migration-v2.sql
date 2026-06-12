-- =============================================
-- AgroBridge Platform - Migration V2
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Add payment fields to Order table
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentStatus" TEXT DEFAULT 'pending';
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "advanceAmount" NUMERIC;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "remainingAmount" NUMERIC;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "platformFee" NUMERIC;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "transportCost" NUMERIC;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "advancePaidAt" TIMESTAMPTZ;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "remainingPaidAt" TIMESTAMPTZ;

-- 2. Add external transporter fields to Shipment table
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "isExternal" BOOLEAN DEFAULT FALSE;
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "externalTransporterName" TEXT;
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "externalCompanyName" TEXT;
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "externalDriverName" TEXT;
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "externalVehicleNumber" TEXT;
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "externalMobileNumber" TEXT;
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "externalPickupDate" TIMESTAMPTZ;
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "externalDeliveryDate" TIMESTAMPTZ;
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "assignedAt" TIMESTAMPTZ;
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "pickupDeadline" TIMESTAMPTZ;

-- 3. Add subscription fields to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "subscriptionTier" TEXT DEFAULT 'free';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "subscriptionExpiry" TIMESTAMPTZ;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isSponsored" BOOLEAN DEFAULT FALSE;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "sponsoredExpiry" TIMESTAMPTZ;

-- 4. Add performance fields to User table (for transporters)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "pickupSuccessRate" NUMERIC DEFAULT 100;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "deliverySuccessRate" NUMERIC DEFAULT 100;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avgResponseTime" NUMERIC DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "warningCount" INTEGER DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "totalCompletedShipments" INTEGER DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "totalFailedShipments" INTEGER DEFAULT 0;

-- 5. Add productId to Review table (if not already added)
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "productId" TEXT REFERENCES "Product"("id");

-- 6. Create PlatformRevenue table
CREATE TABLE IF NOT EXISTS "PlatformRevenue" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "type" TEXT NOT NULL, -- 'transaction_commission', 'transport_booking_fee', 'subscription', 'logistics_commission', 'escrow_fee', 'sponsored_listing'
  "orderId" TEXT REFERENCES "Order"("id"),
  "shipmentId" TEXT REFERENCES "Shipment"("id"),
  "userId" TEXT REFERENCES "User"("id"),
  "amount" NUMERIC NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Create index on PlatformRevenue
CREATE INDEX IF NOT EXISTS "PlatformRevenue_type_idx" ON "PlatformRevenue"("type");
CREATE INDEX IF NOT EXISTS "PlatformRevenue_userId_idx" ON "PlatformRevenue"("userId");
CREATE INDEX IF NOT EXISTS "PlatformRevenue_createdAt_idx" ON "PlatformRevenue"("createdAt");

-- 8. Set RLS on PlatformRevenue
ALTER TABLE "PlatformRevenue" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read PlatformRevenue" ON "PlatformRevenue" FOR SELECT USING (true);
CREATE POLICY "Insert PlatformRevenue" ON "PlatformRevenue" FOR INSERT WITH CHECK (true);
CREATE POLICY "Update PlatformRevenue" ON "PlatformRevenue" FOR UPDATE USING (true);

-- 9. Add order relationship for producer shipment management
-- The producer (seller) should be able to create shipments
-- This is already supported since Shipment.orderId references Order and Order.sellerId references User

-- 10. Update existing orders: set paymentStatus based on current status
UPDATE "Order" SET "paymentStatus" = 
  CASE 
    WHEN status = 'delivered' THEN 'full_paid'
    WHEN status IN ('confirmed', 'shipped') THEN 'advance_paid'
    ELSE 'pending'
  END
WHERE "paymentStatus" IS NULL OR "paymentStatus" = 'pending';
