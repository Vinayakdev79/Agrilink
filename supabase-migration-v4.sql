-- =============================================================
-- AgriLink - V4 Migration: Revenue Model, Delivery Handling, Razorpay
-- Run this in Supabase SQL Editor (safe to re-run)
-- =============================================================

-- =============================================================
-- PART 1: PRODUCT - Producer-managed delivery & delivery fee
-- =============================================================

-- Producer chooses to handle delivery himself (no platform transporter needed)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Product' AND column_name = 'deliveryHandledByProducer') THEN
    ALTER TABLE "Product" ADD COLUMN "deliveryHandledByProducer" BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Flat delivery fee the producer charges (added to order total)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Product' AND column_name = 'deliveryFee') THEN
    ALTER TABLE "Product" ADD COLUMN "deliveryFee" NUMERIC DEFAULT 0;
  END IF;
END $$;

-- Free delivery flag (optional convenience)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Product' AND column_name = 'freeDelivery') THEN
    ALTER TABLE "Product" ADD COLUMN "freeDelivery" BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- =============================================================
-- PART 2: ORDER - Delivery type, delivery fee, local transporter, Razorpay
-- =============================================================

-- deliveryType: 'platform' (default), 'producer' (producer handles), 'local' (producer's local transporter)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'deliveryType') THEN
    ALTER TABLE "Order" ADD COLUMN "deliveryType" TEXT DEFAULT 'platform';
  END IF;
END $$;

-- Delivery fee charged on this order (snapshot from product)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'deliveryFee') THEN
    ALTER TABLE "Order" ADD COLUMN "deliveryFee" NUMERIC DEFAULT 0;
  END IF;
END $$;

-- Producer's local transporter info (when deliveryType = 'local')
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

-- Razorpay order IDs (one for advance, one for remaining)
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

-- Producer who manually updated the status (for delivery-handled orders)
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
-- PART 3: USER - Subscription amount, payment ref, status, deals count
-- =============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'subscriptionAmount') THEN
    ALTER TABLE "User" ADD COLUMN "subscriptionAmount" NUMERIC DEFAULT 0;
  END IF;
END $$;

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

-- Total completed deals (separate from totalTransactions which is overloaded)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'totalDeals') THEN
    ALTER TABLE "User" ADD COLUMN "totalDeals" INTEGER DEFAULT 0;
  END IF;
END $$;

-- =============================================================
-- PART 4: SUBSCRIPTIONS table - payment history
-- =============================================================

CREATE TABLE IF NOT EXISTS "Subscription" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "plan" TEXT NOT NULL,            -- producer_pro, transporter_pro, buyer_pro, sponsored
  "amount" NUMERIC NOT NULL,
  "durationDays" INTEGER DEFAULT 30,
  "razorpayOrderId" TEXT,
  "razorpayPaymentId" TEXT,
  "razorpaySignature" TEXT,
  "status" TEXT DEFAULT 'created', -- created, paid, failed, expired
  "startsAt" TIMESTAMPTZ,
  "expiresAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================
-- PART 5: Update existing orders to have sensible deliveryType defaults
-- =============================================================
UPDATE "Order" SET "deliveryType" = 'platform' WHERE "deliveryType" IS NULL;
UPDATE "Order" SET "deliveryFee" = 0 WHERE "deliveryFee" IS NULL;
UPDATE "User" SET "subscriptionStatus" = 'inactive' WHERE "subscriptionStatus" IS NULL;
UPDATE "User" SET "totalDeals" = "totalTransactions" WHERE "totalDeals" IS NULL;

-- =============================================================
-- PART 6: Refresh subscription expiry (auto-deactivate expired subs)
-- =============================================================
UPDATE "User"
SET "subscriptionTier" = 'free',
    "subscriptionStatus" = 'inactive',
    "subscriptionExpiry" = NULL
WHERE "subscriptionTier" != 'free'
  AND "subscriptionExpiry" IS NOT NULL
  AND "subscriptionExpiry" < NOW();

-- =============================================================
-- PART 7: Indexes
-- =============================================================
CREATE INDEX IF NOT EXISTS "idx_order_deliveryType" ON "Order"("deliveryType");
CREATE INDEX IF NOT EXISTS "idx_order_razorpayAdvanceOrderId" ON "Order"("razorpayAdvanceOrderId") WHERE "razorpayAdvanceOrderId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_user_subscriptionStatus" ON "User"("subscriptionStatus") WHERE "subscriptionStatus" = 'active';
CREATE INDEX IF NOT EXISTS "idx_subscription_userId" ON "Subscription"("userId");
CREATE INDEX IF NOT EXISTS "idx_subscription_status" ON "Subscription"("status");

-- Done
SELECT 'V4 migration complete' AS result;
