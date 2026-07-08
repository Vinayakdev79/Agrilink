-- =============================================================
-- AgriLink - FINAL COMBINED MIGRATION (v1 + v2 + v3 + v4)
-- All schema changes in one idempotent script
-- Run this in Supabase SQL Editor
-- Safe to re-run — uses IF NOT EXISTS and DO blocks
-- =============================================================

-- =============================================================
-- PART 1: USER TABLE — All columns across all migrations
-- =============================================================

-- Base avatar/banner columns (v1)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'avatarUrl') THEN
    ALTER TABLE "User" ADD COLUMN "avatarUrl" TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'bannerUrl') THEN
    ALTER TABLE "User" ADD COLUMN "bannerUrl" TEXT;
  END IF;
END $$;

-- Subscription & sponsored columns (v2/v3)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'subscriptionTier') THEN
    ALTER TABLE "User" ADD COLUMN "subscriptionTier" TEXT DEFAULT 'free';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'subscriptionExpiry') THEN
    ALTER TABLE "User" ADD COLUMN "subscriptionExpiry" TIMESTAMPTZ;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'subscriptionAmount') THEN
    ALTER TABLE "User" ADD COLUMN "subscriptionAmount" NUMERIC DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'isSponsored') THEN
    ALTER TABLE "User" ADD COLUMN "isSponsored" BOOLEAN DEFAULT false;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'sponsoredExpiry') THEN
    ALTER TABLE "User" ADD COLUMN "sponsoredExpiry" TIMESTAMPTZ;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'sponsoredAmount') THEN
    ALTER TABLE "User" ADD COLUMN "sponsoredAmount" FLOAT;
  END IF;
END $$;

-- Performance stats columns (v2/v3 — transporters)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'pickupSuccessRate') THEN
    ALTER TABLE "User" ADD COLUMN "pickupSuccessRate" NUMERIC DEFAULT 100;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'deliverySuccessRate') THEN
    ALTER TABLE "User" ADD COLUMN "deliverySuccessRate" NUMERIC DEFAULT 100;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'avgResponseTimeHours') THEN
    ALTER TABLE "User" ADD COLUMN "avgResponseTimeHours" NUMERIC DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'warningCount') THEN
    ALTER TABLE "User" ADD COLUMN "warningCount" INTEGER DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'totalCompletedShipments') THEN
    ALTER TABLE "User" ADD COLUMN "totalCompletedShipments" INTEGER DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'totalFailedShipments') THEN
    ALTER TABLE "User" ADD COLUMN "totalFailedShipments" INTEGER DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'lastWarningAt') THEN
    ALTER TABLE "User" ADD COLUMN "lastWarningAt" TIMESTAMPTZ;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'isSuspended') THEN
    ALTER TABLE "User" ADD COLUMN "isSuspended" BOOLEAN DEFAULT false;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'suspendedAt') THEN
    ALTER TABLE "User" ADD COLUMN "suspendedAt" TIMESTAMPTZ;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'suspensionReason') THEN
    ALTER TABLE "User" ADD COLUMN "suspensionReason" TEXT;
  END IF;
END $$;

-- V4: Subscription payment columns
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'subscriptionPaymentId') THEN
    ALTER TABLE "User" ADD COLUMN "subscriptionPaymentId" TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'subscriptionStatus') THEN
    ALTER TABLE "User" ADD COLUMN "subscriptionStatus" TEXT DEFAULT 'inactive';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'subscriptionStartedAt') THEN
    ALTER TABLE "User" ADD COLUMN "subscriptionStartedAt" TIMESTAMPTZ;
  END IF;
END $$;

-- V4: Total deals counter (separate from totalTransactions)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'totalDeals') THEN
    ALTER TABLE "User" ADD COLUMN "totalDeals" INTEGER DEFAULT 0;
  END IF;
END $$;

-- =============================================================
-- PART 2: PRODUCT TABLE — V4 delivery handling columns
-- =============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Product' AND column_name = 'deliveryHandledByProducer') THEN
    ALTER TABLE "Product" ADD COLUMN "deliveryHandledByProducer" BOOLEAN DEFAULT false;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Product' AND column_name = 'deliveryFee') THEN
    ALTER TABLE "Product" ADD COLUMN "deliveryFee" NUMERIC DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Product' AND column_name = 'freeDelivery') THEN
    ALTER TABLE "Product" ADD COLUMN "freeDelivery" BOOLEAN DEFAULT false;
  END IF;
END $$;

-- =============================================================
-- PART 3: ORDER TABLE — Delivery address (v1), Payment (v2), V4 delivery/Razorpay
-- =============================================================

-- Delivery address columns (v1)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'deliveryAddress') THEN
    ALTER TABLE "Order" ADD COLUMN "deliveryAddress" TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'deliveryCity') THEN
    ALTER TABLE "Order" ADD COLUMN "deliveryCity" TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'deliveryState') THEN
    ALTER TABLE "Order" ADD COLUMN "deliveryState" TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'deliveryPincode') THEN
    ALTER TABLE "Order" ADD COLUMN "deliveryPincode" TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'deliveryLat') THEN
    ALTER TABLE "Order" ADD COLUMN "deliveryLat" TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'deliveryLng') THEN
    ALTER TABLE "Order" ADD COLUMN "deliveryLng" TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'deliveryFullAddress') THEN
    ALTER TABLE "Order" ADD COLUMN "deliveryFullAddress" TEXT;
  END IF;
END $$;

-- Payment columns (v2)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'paymentStatus') THEN
    ALTER TABLE "Order" ADD COLUMN "paymentStatus" TEXT DEFAULT 'pending';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'advanceAmount') THEN
    ALTER TABLE "Order" ADD COLUMN "advanceAmount" NUMERIC;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'remainingAmount') THEN
    ALTER TABLE "Order" ADD COLUMN "remainingAmount" NUMERIC;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'platformFee') THEN
    ALTER TABLE "Order" ADD COLUMN "platformFee" NUMERIC;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'transportBookingFee') THEN
    ALTER TABLE "Order" ADD COLUMN "transportBookingFee" NUMERIC DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'estimatedTransportCost') THEN
    ALTER TABLE "Order" ADD COLUMN "estimatedTransportCost" NUMERIC;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'advancePaidAt') THEN
    ALTER TABLE "Order" ADD COLUMN "advancePaidAt" TIMESTAMPTZ;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'remainingPaidAt') THEN
    ALTER TABLE "Order" ADD COLUMN "remainingPaidAt" TIMESTAMPTZ;
  END IF;
END $$;

-- V4: Delivery type & local transporter
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'deliveryType') THEN
    ALTER TABLE "Order" ADD COLUMN "deliveryType" TEXT DEFAULT 'platform';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'deliveryFee') THEN
    ALTER TABLE "Order" ADD COLUMN "deliveryFee" NUMERIC DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'localTransporterName') THEN
    ALTER TABLE "Order" ADD COLUMN "localTransporterName" TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'localTransporterPhone') THEN
    ALTER TABLE "Order" ADD COLUMN "localTransporterPhone" TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'localTransporterVehicle') THEN
    ALTER TABLE "Order" ADD COLUMN "localTransporterVehicle" TEXT;
  END IF;
END $$;

-- V4: Razorpay order/payment IDs
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'razorpayAdvanceOrderId') THEN
    ALTER TABLE "Order" ADD COLUMN "razorpayAdvanceOrderId" TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'razorpayAdvancePaymentId') THEN
    ALTER TABLE "Order" ADD COLUMN "razorpayAdvancePaymentId" TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'razorpayRemainingOrderId') THEN
    ALTER TABLE "Order" ADD COLUMN "razorpayRemainingOrderId" TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'razorpayRemainingPaymentId') THEN
    ALTER TABLE "Order" ADD COLUMN "razorpayRemainingPaymentId" TEXT;
  END IF;
END $$;

-- V4: Status update tracking (producer-driven status changes)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'statusUpdatedBy') THEN
    ALTER TABLE "Order" ADD COLUMN "statusUpdatedBy" TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'statusUpdatedAt') THEN
    ALTER TABLE "Order" ADD COLUMN "statusUpdatedAt" TIMESTAMPTZ;
  END IF;
END $$;

-- =============================================================
-- PART 4: SHIPMENT TABLE — External transporter & assignment (v2/v3)
-- =============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Shipment' AND column_name = 'budgetMin') THEN
    ALTER TABLE "Shipment" ADD COLUMN "budgetMin" FLOAT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Shipment' AND column_name = 'budgetMax') THEN
    ALTER TABLE "Shipment" ADD COLUMN "budgetMax" FLOAT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Shipment' AND column_name = 'assignedAt') THEN
    ALTER TABLE "Shipment" ADD COLUMN "assignedAt" TIMESTAMPTZ;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Shipment' AND column_name = 'pickupDeadline') THEN
    ALTER TABLE "Shipment" ADD COLUMN "pickupDeadline" TIMESTAMPTZ;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Shipment' AND column_name = 'isExternal') THEN
    ALTER TABLE "Shipment" ADD COLUMN "isExternal" BOOLEAN DEFAULT false;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Shipment' AND column_name = 'isExternalTransporter') THEN
    ALTER TABLE "Shipment" ADD COLUMN "isExternalTransporter" BOOLEAN DEFAULT false;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Shipment' AND column_name = 'externalTransporterName') THEN
    ALTER TABLE "Shipment" ADD COLUMN "externalTransporterName" TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Shipment' AND column_name = 'externalCompanyName') THEN
    ALTER TABLE "Shipment" ADD COLUMN "externalCompanyName" TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Shipment' AND column_name = 'externalDriverName') THEN
    ALTER TABLE "Shipment" ADD COLUMN "externalDriverName" TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Shipment' AND column_name = 'externalVehicleNumber') THEN
    ALTER TABLE "Shipment" ADD COLUMN "externalVehicleNumber" TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Shipment' AND column_name = 'externalMobileNumber') THEN
    ALTER TABLE "Shipment" ADD COLUMN "externalMobileNumber" TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Shipment' AND column_name = 'externalPickupDate') THEN
    ALTER TABLE "Shipment" ADD COLUMN "externalPickupDate" TIMESTAMPTZ;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Shipment' AND column_name = 'externalDeliveryDate') THEN
    ALTER TABLE "Shipment" ADD COLUMN "externalDeliveryDate" TIMESTAMPTZ;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Shipment' AND column_name = 'autoCancelledAt') THEN
    ALTER TABLE "Shipment" ADD COLUMN "autoCancelledAt" TIMESTAMPTZ;
  END IF;
END $$;

-- =============================================================
-- PART 5: REVIEW TABLE — productId (v1/v2)
-- =============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Review' AND column_name = 'productId') THEN
    ALTER TABLE "Review" ADD COLUMN "productId" TEXT REFERENCES "Product"("id");
  END IF;
END $$;

-- =============================================================
-- PART 6: PLATFORM REVENUE TABLE (v2/v3)
-- =============================================================

CREATE TABLE IF NOT EXISTS "PlatformRevenue" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "type" TEXT NOT NULL,
  "orderId" TEXT REFERENCES "Order"("id"),
  "shipmentId" TEXT REFERENCES "Shipment"("id"),
  "userId" TEXT REFERENCES "User"("id"),
  "amount" NUMERIC NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- RLS on PlatformRevenue
DO $$ BEGIN
  ALTER TABLE "PlatformRevenue" ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN
  -- RLS may already be enabled
  NULL;
END $$;

CREATE POLICY "Public read PlatformRevenue" ON "PlatformRevenue" FOR SELECT USING (true);
CREATE POLICY "Insert PlatformRevenue" ON "PlatformRevenue" FOR INSERT WITH CHECK (true);
CREATE POLICY "Update PlatformRevenue" ON "PlatformRevenue" FOR UPDATE USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS "PlatformRevenue_type_idx" ON "PlatformRevenue"("type");
CREATE INDEX IF NOT EXISTS "PlatformRevenue_userId_idx" ON "PlatformRevenue"("userId");
CREATE INDEX IF NOT EXISTS "PlatformRevenue_createdAt_idx" ON "PlatformRevenue"("createdAt");

-- =============================================================
-- PART 7: SUBSCRIPTION TABLE (V4)
-- =============================================================

CREATE TABLE IF NOT EXISTS "Subscription" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "plan" TEXT NOT NULL,
  "amount" NUMERIC NOT NULL,
  "durationDays" INTEGER DEFAULT 30,
  "razorpayOrderId" TEXT,
  "razorpayPaymentId" TEXT,
  "razorpaySignature" TEXT,
  "status" TEXT DEFAULT 'created',
  "startsAt" TIMESTAMPTZ,
  "expiresAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- RLS on Subscription
DO $$ BEGIN
  ALTER TABLE "Subscription" ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

CREATE POLICY "Allow all on Subscription" ON "Subscription" FOR ALL USING (true) WITH CHECK (true);

-- =============================================================
-- PART 8: STORAGE BUCKET (v1)
-- =============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('agrilink-images', 'agrilink-images', true, 5242880)
ON CONFLICT (id) DO NOTHING;

-- Storage policies (ignore if already exist)
DO $$ BEGIN
  CREATE POLICY "Public read access" ON storage.objects
    FOR SELECT USING (bucket_id = 'agrilink-images');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Anon uploads" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'agrilink-images');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Allow updates" ON storage.objects
    FOR UPDATE USING (bucket_id = 'agrilink-images');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Allow deletes" ON storage.objects
    FOR DELETE USING (bucket_id = 'agrilink-images');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- =============================================================
-- PART 9: DATA MIGRATION — Set sensible defaults for existing rows
-- =============================================================

-- Migrate avatar -> avatarUrl
UPDATE "User" SET "avatarUrl" = "avatar" WHERE "avatar" IS NOT NULL AND "avatarUrl" IS NULL;

-- Set payment status for existing orders
UPDATE "Order" SET "paymentStatus" =
  CASE
    WHEN status = 'delivered' THEN 'full_paid'
    WHEN status IN ('confirmed', 'shipped') THEN 'advance_paid'
    ELSE 'pending'
  END
WHERE "paymentStatus" IS NULL OR "paymentStatus" = 'pending';

-- Set delivery type for existing orders
UPDATE "Order" SET "deliveryType" = 'platform' WHERE "deliveryType" IS NULL;
UPDATE "Order" SET "deliveryFee" = 0 WHERE "deliveryFee" IS NULL;

-- Set subscription status for existing users
UPDATE "User" SET "subscriptionStatus" = 'inactive' WHERE "subscriptionStatus" IS NULL;

-- Initialize totalDeals from totalTransactions
UPDATE "User" SET "totalDeals" = "totalTransactions" WHERE "totalDeals" IS NULL;

-- Auto-deactivate expired subscriptions
UPDATE "User"
SET "subscriptionTier" = 'free',
    "subscriptionStatus" = 'inactive',
    "subscriptionExpiry" = NULL
WHERE "subscriptionTier" != 'free'
  AND "subscriptionExpiry" IS NOT NULL
  AND "subscriptionExpiry" < NOW();

-- =============================================================
-- PART 10: INDEXES
-- =============================================================

CREATE INDEX IF NOT EXISTS "idx_order_deliveryType" ON "Order"("deliveryType");
CREATE INDEX IF NOT EXISTS "idx_order_razorpayAdvanceOrderId" ON "Order"("razorpayAdvanceOrderId") WHERE "razorpayAdvanceOrderId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_user_subscriptionStatus" ON "User"("subscriptionStatus") WHERE "subscriptionStatus" = 'active';
CREATE INDEX IF NOT EXISTS "idx_subscription_userId" ON "Subscription"("userId");
CREATE INDEX IF NOT EXISTS "idx_subscription_status" ON "Subscription"("status");

-- Done!
SELECT 'AgriLink Final Migration (v1+v2+v3+v4) complete' AS result;
