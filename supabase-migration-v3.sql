-- =============================================================
-- AgroBridge Platform - Migration V3
-- Comprehensive schema for all 8 features + Revenue Model
-- Run this in Supabase SQL Editor
-- =============================================================
-- Features covered:
--   1. Inventory Visibility
--   2. Product Page Redesign (schema support)
--   3. Pricing Corrections & Checkout Breakdown
--   4. Shipment Management by Producer
--   5. Order Communication (Chat/Messaging)
--   6. Transporter Performance & 24hr Pickup Deadline
--   7. Split Payment (50% Advance + 50% Post-Delivery)
--   8. External Transporter Support
--   + Revenue Model (7 streams)
-- =============================================================

-- =============================================================
-- SECTION 1: PRODUCT TABLE — Inventory Visibility (Feature 1)
-- =============================================================
-- Add stock tracking columns so producer dashboard & marketplace
-- can show available vs reserved stock. Auto-updated via triggers.

-- quantity = total stock the producer listed
-- stockReserved = quantity locked in active (non-cancelled/non-delivered) orders
-- stockAvailable = quantity - stockReserved (computed, or maintained by trigger)

ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "stockReserved" NUMERIC DEFAULT 0;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "stockAvailable" NUMERIC GENERATED ALWAYS AS ("quantity" - "stockReserved") STORED;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "reservedUpdatedAt" TIMESTAMPTZ;

-- Index for filtering products with available stock
CREATE INDEX IF NOT EXISTS "idx_product_stockAvailable" ON "Product"("stockAvailable") WHERE "stockAvailable" > 0;

-- =============================================================
-- SECTION 2: ORDER TABLE — Pricing Corrections (Feature 3)
-- =============================================================
-- Detailed checkout breakdown: product cost, quantity, subtotal,
-- transport estimate, platform charges, total.
-- NO auto GST, NO transport baked into price.

ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "productSubtotal" NUMERIC;           -- unitPrice × quantity
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "transportEstimate" NUMERIC DEFAULT 0; -- estimated transport cost
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "transportBookingFee" NUMERIC DEFAULT 0; -- ₹30-50 booking fee
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "platformCommission" NUMERIC DEFAULT 0;  -- 1-3% of productSubtotal
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "escrowFee" NUMERIC DEFAULT 0;       -- 0.5-1% escrow fee
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "logisticsCommission" NUMERIC DEFAULT 0; -- logistics commission
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "totalWithCharges" NUMERIC;          -- grand total buyer pays
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "priceBreakdownJson" JSONB;          -- full breakdown as JSON

-- Update existing orders: set productSubtotal from existing data
UPDATE "Order" SET "productSubtotal" = "unitPrice" * "quantity"
WHERE "productSubtotal" IS NULL;

-- Update existing orders: set totalWithCharges if null
UPDATE "Order" SET "totalWithCharges" = "totalPrice"
WHERE "totalWithCharges" IS NULL;

-- =============================================================
-- SECTION 3: ORDER TABLE — Split Payment (Feature 7)
-- =============================================================
-- 50% advance + 50% post-delivery. Transport charges in 2nd payment.

-- Payment status values: 'pending', 'advance_paid', 'full_paid', 'refunded', 'partial_refund'
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentStatus" TEXT DEFAULT 'pending';
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "advanceAmount" NUMERIC;              -- 50% of productSubtotal
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "remainingAmount" NUMERIC;            -- 50% productSubtotal + transport + fees
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "advancePaidAt" TIMESTAMPTZ;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "remainingPaidAt" TIMESTAMPTZ;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "advancePaymentRef" TEXT;             -- payment gateway reference
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "remainingPaymentRef" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "advancePaymentMethod" TEXT;          -- 'upi', 'bank_transfer', 'razorpay', etc.
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "remainingPaymentMethod" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "platformFee" NUMERIC DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "transportCost" NUMERIC DEFAULT 0;

-- Update existing orders: set paymentStatus based on current status
UPDATE "Order" SET "paymentStatus" =
  CASE
    WHEN status = 'delivered' THEN 'full_paid'
    WHEN status IN ('confirmed', 'shipped') THEN 'advance_paid'
    ELSE 'pending'
  END
WHERE "paymentStatus" IS NULL OR "paymentStatus" = 'pending';

-- Update existing orders: calculate advance/remaining if null
UPDATE "Order" SET
  "advanceAmount" = FLOOR("totalPrice" * 0.5 * 100) / 100,
  "remainingAmount" = CEIL("totalPrice" * 0.5 * 100) / 100
WHERE "advanceAmount" IS NULL AND "totalPrice" > 0;

-- =============================================================
-- SECTION 4: SHIPMENT TABLE — Producer Shipment Mgmt (Feature 4)
--              & External Transporter (Feature 8)
-- =============================================================

-- Producer shipment management fields
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "createdBy" TEXT;                  -- userId who created (usually producer)
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "createdByRole" TEXT DEFAULT 'producer'; -- 'producer', 'admin', 'system'
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "assignedAt" TIMESTAMPTZ;
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "pickupDeadline" TIMESTAMPTZ;
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "autoCancelledAt" TIMESTAMPTZ;
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "pickupConfirmedAt" TIMESTAMPTZ;
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "reassignedFrom" TEXT;             -- previous transporterId if reassigned
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "reassignmentCount" INTEGER DEFAULT 0;
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "reassignmentReason" TEXT;
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "producerNotes" TEXT;              -- notes from producer

-- Set pickupDeadline = assignedAt + 24hrs when transporter is assigned
-- (Applied via trigger below)

-- External transporter support fields (Feature 8)
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "isExternal" BOOLEAN DEFAULT FALSE;
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "externalTransporterName" TEXT;
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "externalCompanyName" TEXT;
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "externalDriverName" TEXT;
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "externalVehicleNumber" TEXT;
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "externalMobileNumber" TEXT;
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "externalPickupDate" TIMESTAMPTZ;
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "externalDeliveryDate" TIMESTAMPTZ;
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "externalTransportCost" NUMERIC DEFAULT 0;
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "logisticsCommissionWaived" BOOLEAN DEFAULT FALSE; -- no commission for external

-- Add createdBy foreign key reference
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Shipment' AND column_name = 'createdBy'
  ) THEN
    ALTER TABLE "Shipment" ADD COLUMN "createdBy" TEXT REFERENCES "User"("id");
  END IF;
END $$;

-- Indexes for shipment queries
CREATE INDEX IF NOT EXISTS "idx_shipment_createdBy" ON "Shipment"("createdBy");
CREATE INDEX IF NOT EXISTS "idx_shipment_pickupDeadline" ON "Shipment"("pickupDeadline") WHERE "pickupDeadline" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_shipment_isExternal" ON "Shipment"("isExternal") WHERE "isExternal" = TRUE;

-- =============================================================
-- SECTION 5: MESSAGE TABLE — Order Communication (Feature 5)
-- =============================================================
-- Chat between buyer↔producer, producer↔transporter, buyer↔transporter
-- with order/shipment context

-- Add orderId and shipmentId to existing Message table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Message' AND column_name = 'orderId'
  ) THEN
    ALTER TABLE "Message" ADD COLUMN "orderId" TEXT REFERENCES "Order"("id");
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Message' AND column_name = 'shipmentId'
  ) THEN
    ALTER TABLE "Message" ADD COLUMN "shipmentId" TEXT REFERENCES "Shipment"("id");
  END IF;
END $$;

-- Additional message fields
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "messageType" TEXT DEFAULT 'text';  -- 'text', 'image', 'system', 'file'
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "attachmentUrl" TEXT;               -- for image/file messages
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "chatType" TEXT DEFAULT 'order';    -- 'order', 'shipment', 'direct'
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "isSystemMessage" BOOLEAN DEFAULT FALSE;
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "metadata" JSONB;                   -- extra data (e.g. {action: 'status_change', from: 'confirmed', to: 'shipped'})

-- Indexes for efficient message queries
CREATE INDEX IF NOT EXISTS "idx_message_orderId" ON "Message"("orderId") WHERE "orderId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_message_shipmentId" ON "Message"("shipmentId") WHERE "shipmentId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_message_chatType" ON "Message"("chatType");
CREATE INDEX IF NOT EXISTS "idx_message_createdAt" ON "Message"("createdAt");
CREATE INDEX IF NOT EXISTS "idx_message_sender_receiver" ON "Message"("senderId", "receiverId");

-- Enable RLS on Message (if not already)
ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for Message (idempotent using DO $$)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'Message' AND policyname = 'Public read Message') THEN
    CREATE POLICY "Public read Message" ON "Message" FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'Message' AND policyname = 'Insert Message') THEN
    CREATE POLICY "Insert Message" ON "Message" FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'Message' AND policyname = 'Update Message') THEN
    CREATE POLICY "Update Message" ON "Message" FOR UPDATE USING (true);
  END IF;
END $$;

-- =============================================================
-- SECTION 6: USER TABLE — Transporter Performance (Feature 6)
--              & Subscriptions (Revenue Model)
-- =============================================================

-- Transporter performance metrics
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "pickupSuccessRate" NUMERIC DEFAULT 100;    -- percentage
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "deliverySuccessRate" NUMERIC DEFAULT 100;  -- percentage
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avgResponseTimeHours" NUMERIC DEFAULT 0;   -- hours to accept/confirm
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "warningCount" INTEGER DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastWarningAt" TIMESTAMPTZ;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "totalCompletedShipments" INTEGER DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "totalFailedShipments" INTEGER DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isSuspended" BOOLEAN DEFAULT FALSE;        -- suspended transporter
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "suspendedAt" TIMESTAMPTZ;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "suspensionReason" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastShipmentAssignedAt" TIMESTAMPTZ;       -- for 24hr deadline tracking
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "consecutiveFailures" INTEGER DEFAULT 0;    -- consecutive pickup failures

-- Subscription fields (Revenue Model)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "subscriptionTier" TEXT DEFAULT 'free';
  -- Producer tiers: 'free', 'basic' (₹299), 'professional' (₹999), 'enterprise' (₹4999)
  -- Transporter tiers: 'free', 'basic' (₹199), 'premium' (₹499)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "subscriptionExpiry" TIMESTAMPTZ;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "subscriptionAmount" NUMERIC DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "subscriptionStartedAt" TIMESTAMPTZ;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "subscriptionAutoRenew" BOOLEAN DEFAULT FALSE;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "subscriptionPaymentRef" TEXT;

-- Sponsored listing fields (Revenue Model)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isSponsored" BOOLEAN DEFAULT FALSE;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "sponsoredExpiry" TIMESTAMPTZ;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "sponsoredAmount" NUMERIC DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "sponsoredStartedAt" TIMESTAMPTZ;

-- Index for finding sponsored users
CREATE INDEX IF NOT EXISTS "idx_user_sponsored" ON "User"("isSponsored") WHERE "isSponsored" = TRUE;
CREATE INDEX IF NOT EXISTS "idx_user_subscription" ON "User"("subscriptionTier") WHERE "subscriptionTier" != 'free';
CREATE INDEX IF NOT EXISTS "idx_user_suspended" ON "User"("isSuspended") WHERE "isSuspended" = TRUE;

-- =============================================================
-- SECTION 7: TRANSPORTER WARNING TABLE (Feature 6)
-- =============================================================
-- Track warnings issued to transporters for missed pickups, delays, etc.

CREATE TABLE IF NOT EXISTS "TransporterWarning" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "transporterId" TEXT NOT NULL REFERENCES "User"("id"),
  "shipmentId" TEXT REFERENCES "Shipment"("id"),
  "orderId" TEXT REFERENCES "Order"("id"),
  "warningType" TEXT NOT NULL,        -- 'pickup_missed', 'pickup_delayed', 'delivery_delayed', 'no_response', 'cancellation'
  "severity" TEXT DEFAULT 'warning',  -- 'warning', 'critical', 'suspension'
  "message" TEXT,
  "issuedAt" TIMESTAMPTZ DEFAULT NOW(),
  "resolvedAt" TIMESTAMPTZ,
  "isResolved" BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS "idx_warning_transporter" ON "TransporterWarning"("transporterId");
CREATE INDEX IF NOT EXISTS "idx_warning_type" ON "TransporterWarning"("warningType");
CREATE INDEX IF NOT EXISTS "idx_warning_severity" ON "TransporterWarning"("severity");
CREATE INDEX IF NOT EXISTS "idx_warning_resolved" ON "TransporterWarning"("isResolved") WHERE "isResolved" = FALSE;

-- Enable RLS
ALTER TABLE "TransporterWarning" ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'TransporterWarning' AND policyname = 'Allow all on TransporterWarning') THEN
    CREATE POLICY "Allow all on TransporterWarning" ON "TransporterWarning" FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- =============================================================
-- SECTION 8: PAYMENT TABLE — Split Payment Records (Feature 7)
-- =============================================================
-- Track each payment transaction (advance + remaining) separately

CREATE TABLE IF NOT EXISTS "Payment" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "orderId" TEXT NOT NULL REFERENCES "Order"("id"),
  "paymentType" TEXT NOT NULL,         -- 'advance', 'remaining', 'full', 'refund'
  "amount" NUMERIC NOT NULL,
  "currency" TEXT DEFAULT 'INR',
  "status" TEXT DEFAULT 'pending',     -- 'pending', 'processing', 'completed', 'failed', 'refunded'
  "paymentMethod" TEXT,                -- 'upi', 'bank_transfer', 'razorpay', 'wallet', 'cash'
  "paymentRef" TEXT,                   -- gateway transaction reference
  "gatewayResponse" JSONB,             -- full gateway response
  "paidAt" TIMESTAMPTZ,
  "failedAt" TIMESTAMPTZ,
  "refundedAt" TIMESTAMPTZ,
  "refundRef" TEXT,
  "description" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_payment_orderId" ON "Payment"("orderId");
CREATE INDEX IF NOT EXISTS "idx_payment_status" ON "Payment"("status");
CREATE INDEX IF NOT EXISTS "idx_payment_type" ON "Payment"("paymentType");
CREATE INDEX IF NOT EXISTS "idx_payment_paidAt" ON "Payment"("paidAt") WHERE "paidAt" IS NOT NULL;

-- Enable RLS
ALTER TABLE "Payment" ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'Payment' AND policyname = 'Allow all on Payment') THEN
    CREATE POLICY "Allow all on Payment" ON "Payment" FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- =============================================================
-- SECTION 9: SUBSCRIPTION TABLE — Revenue Model
-- =============================================================
-- Track subscription purchases and renewals

CREATE TABLE IF NOT EXISTS "Subscription" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"("id"),
  "tier" TEXT NOT NULL,                -- 'basic', 'professional', 'enterprise' (producer) / 'basic', 'premium' (transporter)
  "roleType" TEXT NOT NULL,            -- 'producer', 'transporter'
  "amount" NUMERIC NOT NULL,
  "durationDays" INTEGER NOT NULL,     -- 30, 90, 365
  "startedAt" TIMESTAMPTZ DEFAULT NOW(),
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "status" TEXT DEFAULT 'active',      -- 'active', 'expired', 'cancelled'
  "autoRenew" BOOLEAN DEFAULT FALSE,
  "paymentRef" TEXT,
  "paymentId" TEXT REFERENCES "Payment"("id"),
  "cancelledAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_subscription_userId" ON "Subscription"("userId");
CREATE INDEX IF NOT EXISTS "idx_subscription_status" ON "Subscription"("status");
CREATE INDEX IF NOT EXISTS "idx_subscription_expiresAt" ON "Subscription"("expiresAt");
CREATE INDEX IF NOT EXISTS "idx_subscription_tier" ON "Subscription"("tier");

-- Enable RLS
ALTER TABLE "Subscription" ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'Subscription' AND policyname = 'Allow all on Subscription') THEN
    CREATE POLICY "Allow all on Subscription" ON "Subscription" FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- =============================================================
-- SECTION 10: SPONSORED LISTING TABLE — Revenue Model
-- =============================================================
-- Track product/user sponsored listings (₹50-1000 per listing)

CREATE TABLE IF NOT EXISTS "SponsoredListing" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"("id"),
  "productId" TEXT REFERENCES "Product"("id"),     -- if null, it's a profile sponsorship
  "amount" NUMERIC NOT NULL,                        -- ₹50-1000
  "durationDays" INTEGER DEFAULT 7,
  "startedAt" TIMESTAMPTZ DEFAULT NOW(),
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "status" TEXT DEFAULT 'active',                   -- 'active', 'expired', 'cancelled'
  "position" INTEGER DEFAULT 0,                     -- priority position in listing
  "impressions" INTEGER DEFAULT 0,                  -- view count
  "clicks" INTEGER DEFAULT 0,                       -- click count
  "paymentRef" TEXT,
  "paymentId" TEXT REFERENCES "Payment"("id"),
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_sponsored_userId" ON "SponsoredListing"("userId");
CREATE INDEX IF NOT EXISTS "idx_sponsored_productId" ON "SponsoredListing"("productId") WHERE "productId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_sponsored_status" ON "SponsoredListing"("status");
CREATE INDEX IF NOT EXISTS "idx_sponsored_expiresAt" ON "SponsoredListing"("expiresAt");
CREATE INDEX IF NOT EXISTS "idx_sponsored_position" ON "SponsoredListing"("position");

-- Enable RLS
ALTER TABLE "SponsoredListing" ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'SponsoredListing' AND policyname = 'Allow all on SponsoredListing') THEN
    CREATE POLICY "Allow all on SponsoredListing" ON "SponsoredListing" FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- =============================================================
-- SECTION 11: PLATFORM REVENUE TABLE — Revenue Model
-- =============================================================
-- Track all 7 revenue streams:
--   1. Transaction Commission (1-3%, target 2%)
--   2. Transport Booking Fee (₹30-50)
--   3. Premium Producer Subscription (₹299-4999)
--   4. Premium Transporter Subscription (₹199-499)
--   5. Escrow Fee (0.5-1%)
--   6. Sponsored Listings (₹50-1000)
--   7. Logistics Commission

CREATE TABLE IF NOT EXISTS "PlatformRevenue" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "type" TEXT NOT NULL,                -- 'transaction_commission', 'transport_booking_fee', 'producer_subscription', 'transporter_subscription', 'escrow_fee', 'sponsored_listing', 'logistics_commission'
  "amount" NUMERIC NOT NULL,
  "currency" TEXT DEFAULT 'INR',
  "orderId" TEXT REFERENCES "Order"("id"),
  "shipmentId" TEXT REFERENCES "Shipment"("id"),
  "userId" TEXT REFERENCES "User"("id"),
  "subscriptionId" TEXT REFERENCES "Subscription"("id"),
  "sponsoredListingId" TEXT REFERENCES "SponsoredListing"("id"),
  "paymentId" TEXT REFERENCES "Payment"("id"),
  "percentage" NUMERIC,               -- the % applied (e.g. 2.0 for 2% commission)
  "baseAmount" NUMERIC,               -- the base amount on which percentage was applied
  "description" TEXT,
  "metadata" JSONB,                   -- extra info
  "recordedAt" TIMESTAMPTZ DEFAULT NOW(),
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_revenue_type" ON "PlatformRevenue"("type");
CREATE INDEX IF NOT EXISTS "idx_revenue_userId" ON "PlatformRevenue"("userId");
CREATE INDEX IF NOT EXISTS "idx_revenue_orderId" ON "PlatformRevenue"("orderId") WHERE "orderId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_revenue_recordedAt" ON "PlatformRevenue"("recordedAt");

-- Enable RLS
ALTER TABLE "PlatformRevenue" ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'PlatformRevenue' AND policyname = 'Allow all on PlatformRevenue') THEN
    CREATE POLICY "Allow all on PlatformRevenue" ON "PlatformRevenue" FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- =============================================================
-- SECTION 12: CONVERSATION TABLE — Chat Grouping (Feature 5)
-- =============================================================
-- Group messages into conversations for easier chat UI

CREATE TABLE IF NOT EXISTS "Conversation" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "type" TEXT NOT NULL,                -- 'buyer_producer', 'producer_transporter', 'buyer_transporter', 'direct'
  "orderId" TEXT REFERENCES "Order"("id"),
  "shipmentId" TEXT REFERENCES "Shipment"("id"),
  "participant1Id" TEXT NOT NULL REFERENCES "User"("id"),
  "participant2Id" TEXT NOT NULL REFERENCES "User"("id"),
  "lastMessageAt" TIMESTAMPTZ DEFAULT NOW(),
  "lastMessageContent" TEXT,
  "lastMessageSenderId" TEXT,
  "unreadCount1" INTEGER DEFAULT 0,    -- unread count for participant1
  "unreadCount2" INTEGER DEFAULT 0,    -- unread count for participant2
  "isActive" BOOLEAN DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Add conversationId to Message table
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "conversationId" TEXT REFERENCES "Conversation"("id");

CREATE INDEX IF NOT EXISTS "idx_conversation_participants" ON "Conversation"("participant1Id", "participant2Id");
CREATE INDEX IF NOT EXISTS "idx_conversation_orderId" ON "Conversation"("orderId") WHERE "orderId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_conversation_shipmentId" ON "Conversation"("shipmentId") WHERE "shipmentId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_conversation_lastMessage" ON "Conversation"("lastMessageAt");
CREATE INDEX IF NOT EXISTS "idx_message_conversationId" ON "Message"("conversationId") WHERE "conversationId" IS NOT NULL;

-- Enable RLS
ALTER TABLE "Conversation" ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'Conversation' AND policyname = 'Allow all on Conversation') THEN
    CREATE POLICY "Allow all on Conversation" ON "Conversation" FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- =============================================================
-- SECTION 13: PRODUCT TABLE — Sponsored Products (Revenue Model)
-- =============================================================
-- Allow individual products to be sponsored (boosted in marketplace)

ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "isSponsored" BOOLEAN DEFAULT FALSE;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "sponsoredExpiry" TIMESTAMPTZ;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "sponsoredPosition" INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS "idx_product_sponsored" ON "Product"("isSponsored") WHERE "isSponsored" = TRUE;

-- =============================================================
-- SECTION 14: REVIEW TABLE — Product & Transporter Reviews
-- =============================================================
-- Support reviews for both products and transporter performance

ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "productId" TEXT REFERENCES "Product"("id");
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "reviewType" TEXT DEFAULT 'user'; -- 'user', 'product', 'transporter', 'shipment'
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "orderId" TEXT REFERENCES "Order"("id");
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "shipmentId" TEXT REFERENCES "Shipment"("id");

-- Transporter-specific review criteria
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "pickupRating" INTEGER;       -- 1-5
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "deliveryRating" INTEGER;     -- 1-5
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "responseTimeRating" INTEGER; -- 1-5
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "overallRating" INTEGER;      -- 1-5 (same as existing `rating`)

CREATE INDEX IF NOT EXISTS "idx_review_productId" ON "Review"("productId") WHERE "productId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_review_orderId" ON "Review"("orderId") WHERE "orderId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_review_type" ON "Review"("reviewType");

-- =============================================================
-- SECTION 15: ORDER TABLE — Delivery Address (already in v1)
-- =============================================================
-- Ensure delivery address fields exist

ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "deliveryAddress" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "deliveryCity" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "deliveryState" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "deliveryPincode" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "deliveryLat" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "deliveryLng" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "deliveryFullAddress" TEXT;

-- =============================================================
-- SECTION 16: USER TABLE — Avatar/Banner (already in v1)
-- =============================================================

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bannerUrl" TEXT;

-- =============================================================
-- SECTION 17: INVENTORY TRIGGER — Auto-update stockReserved
-- =============================================================
-- When an Order is created/updated, recalculate reserved stock
-- for the related Product.

CREATE OR REPLACE FUNCTION update_product_stock_reserved()
RETURNS TRIGGER AS $$
DECLARE
  v_product_id TEXT;
BEGIN
  -- Get the product ID from the new/old order
  IF TG_OP = 'INSERT' THEN
    v_product_id := NEW."productId";
  ELSIF TG_OP = 'UPDATE' THEN
    v_product_id := NEW."productId";
    -- If product changed, also update old product
    IF OLD."productId" IS DISTINCT FROM NEW."productId" THEN
      UPDATE "Product" SET
        "stockReserved" = COALESCE((
          SELECT SUM("quantity") FROM "Order"
          WHERE "productId" = OLD."productId"
            AND status NOT IN ('cancelled', 'delivered', 'disputed')
        ), 0),
        "reservedUpdatedAt" = NOW()
      WHERE "id" = OLD."productId";
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    v_product_id := OLD."productId";
  END IF;

  -- Update the product's stockReserved
  UPDATE "Product" SET
    "stockReserved" = COALESCE((
      SELECT SUM("quantity") FROM "Order"
      WHERE "productId" = v_product_id
        AND status NOT IN ('cancelled', 'delivered', 'disputed')
    ), 0),
    "reservedUpdatedAt" = NOW()
  WHERE "id" = v_product_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if any, then create
DROP TRIGGER IF EXISTS trigger_order_stock_update ON "Order";
CREATE TRIGGER trigger_order_stock_update
  AFTER INSERT OR UPDATE OF "productId", "quantity", "status" OR DELETE ON "Order"
  FOR EACH ROW
  EXECUTE FUNCTION update_product_stock_reserved();

-- Initialize stockReserved for all existing products
UPDATE "Product" p SET
  "stockReserved" = COALESCE((
    SELECT SUM(o."quantity") FROM "Order" o
    WHERE o."productId" = p."id"
      AND o.status NOT IN ('cancelled', 'delivered', 'disputed')
  ), 0),
  "reservedUpdatedAt" = NOW();

-- =============================================================
-- SECTION 18: PICKUP DEADLINE TRIGGER — Auto-set 24hr deadline
-- =============================================================
-- When a transporter is assigned to a shipment, set pickupDeadline
-- to 24 hours from now

CREATE OR REPLACE FUNCTION set_pickup_deadline()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set deadline when transporterId changes from NULL to a value
  IF NEW."transporterId" IS NOT NULL AND (OLD."transporterId" IS NULL OR TG_OP = 'INSERT') THEN
    NEW."assignedAt" := NOW();
    NEW."pickupDeadline" := NOW() + INTERVAL '24 hours';

    -- Update transporter's lastShipmentAssignedAt
    UPDATE "User" SET "lastShipmentAssignedAt" = NOW()
    WHERE "id" = NEW."transporterId";
  END IF;

  -- If pickup is confirmed, clear the deadline
  IF NEW."status" = 'picked_up' AND OLD."status" != 'picked_up' THEN
    NEW."pickupConfirmedAt" := NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_pickup_deadline ON "Shipment";
CREATE TRIGGER trigger_set_pickup_deadline
  BEFORE INSERT OR UPDATE OF "transporterId", "status" ON "Shipment"
  FOR EACH ROW
  EXECUTE FUNCTION set_pickup_deadline();

-- =============================================================
-- SECTION 19: AUTO-CANCEL EXPIRED SHIPMENTS FUNCTION
-- =============================================================
-- Function to auto-cancel shipments past their pickup deadline
-- (Call this periodically via cron or API)

CREATE OR REPLACE FUNCTION auto_cancel_expired_shipments()
RETURNS INTEGER AS $$
DECLARE
  cancelled_count INTEGER := 0;
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT s."id", s."transporterId", s."orderId"
    FROM "Shipment" s
    WHERE s."pickupDeadline" IS NOT NULL
      AND s."pickupDeadline" < NOW()
      AND s."status" IN ('assigned', 'pending')
      AND s."autoCancelledAt" IS NULL
  LOOP
    -- Cancel the shipment
    UPDATE "Shipment" SET
      "status" = 'cancelled',
      "autoCancelledAt" = NOW()
    WHERE "id" = rec."id";

    -- Issue a critical warning to transporter
    INSERT INTO "TransporterWarning" ("transporterId", "shipmentId", "orderId", "warningType", "severity", "message")
    VALUES (
      rec."transporterId",
      rec."id",
      rec."orderId",
      'pickup_missed',
      'critical',
      'Shipment auto-cancelled: 24-hour pickup deadline exceeded'
    );

    -- Update transporter stats
    UPDATE "User" SET
      "warningCount" = "warningCount" + 1,
      "lastWarningAt" = NOW(),
      "totalFailedShipments" = "totalFailedShipments" + 1,
      "consecutiveFailures" = "consecutiveFailures" + 1,
      "pickupSuccessRate" = CASE
        WHEN ("totalCompletedShipments" + "totalFailedShipments") = 0 THEN 0
        ELSE ROUND(("totalCompletedShipments"::NUMERIC / ("totalCompletedShipments" + "totalFailedShipments")) * 100, 2)
      END
    WHERE "id" = rec."transporterId";

    -- Suspend transporter if 3+ consecutive failures
    UPDATE "User" SET
      "isSuspended" = TRUE,
      "suspendedAt" = NOW(),
      "suspensionReason" = 'Auto-suspended: 3+ consecutive pickup failures'
    WHERE "id" = rec."transporterId"
      AND "consecutiveFailures" >= 3;

    cancelled_count := cancelled_count + 1;
  END LOOP;

  RETURN cancelled_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================================
-- SECTION 20: UPDATE TRANSPORTER STATS ON DELIVERY
-- =============================================================
-- When a shipment is delivered, update transporter performance stats

CREATE OR REPLACE FUNCTION update_transporter_stats_on_delivery()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."status" = 'delivered' AND (OLD."status" IS NULL OR OLD."status" != 'delivered') THEN
    UPDATE "User" SET
      "totalCompletedShipments" = "totalCompletedShipments" + 1,
      "consecutiveFailures" = 0,  -- reset on success
      "pickupSuccessRate" = CASE
        WHEN ("totalCompletedShipments" + "totalFailedShipments" + 1) = 0 THEN 100
        ELSE ROUND(("totalCompletedShipments" + 1)::NUMERIC / ("totalCompletedShipments" + "totalFailedShipments" + 1) * 100, 2)
      END,
      "deliverySuccessRate" = CASE
        WHEN ("totalCompletedShipments" + "totalFailedShipments" + 1) = 0 THEN 100
        ELSE ROUND(("totalCompletedShipments" + 1)::NUMERIC / ("totalCompletedShipments" + "totalFailedShipments" + 1) * 100, 2)
      END
    WHERE "id" = NEW."transporterId";
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_transporter_stats ON "Shipment";
CREATE TRIGGER trigger_update_transporter_stats
  AFTER UPDATE OF "status" ON "Shipment"
  FOR EACH ROW
  EXECUTE FUNCTION update_transporter_stats_on_delivery();

-- =============================================================
-- SECTION 21: CONVERSATION UPSERT HELPER FUNCTION
-- =============================================================
-- Find or create a conversation between two users for an order/shipment

CREATE OR REPLACE FUNCTION get_or_create_conversation(
  p_participant1_id TEXT,
  p_participant2_id TEXT,
  p_type TEXT,
  p_order_id TEXT DEFAULT NULL,
  p_shipment_id TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  v_conversation_id TEXT;
BEGIN
  -- Try to find existing conversation
  SELECT "id" INTO v_conversation_id
  FROM "Conversation"
  WHERE ("participant1Id" = p_participant1_id AND "participant2Id" = p_participant2_id
         OR "participant1Id" = p_participant2_id AND "participant2Id" = p_participant1_id)
    AND ("orderId" = p_order_id OR (p_order_id IS NULL AND "orderId" IS NULL))
    AND ("shipmentId" = p_shipment_id OR (p_shipment_id IS NULL AND "shipmentId" IS NULL))
    AND "isActive" = TRUE
  LIMIT 1;

  -- If not found, create one
  IF v_conversation_id IS NULL THEN
    INSERT INTO "Conversation" ("participant1Id", "participant2Id", "type", "orderId", "shipmentId")
    VALUES (p_participant1_id, p_participant2_id, p_type, p_order_id, p_shipment_id)
    RETURNING "id" INTO v_conversation_id;
  END IF;

  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================
-- SECTION 22: UPDATE CONVERSATION ON NEW MESSAGE
-- =============================================================

CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."conversationId" IS NOT NULL THEN
    UPDATE "Conversation" SET
      "lastMessageAt" = NEW."createdAt",
      "lastMessageContent" = NEW."content",
      "lastMessageSenderId" = NEW."senderId",
      "unreadCount1" = CASE
        WHEN "participant1Id" = NEW."receiverId" THEN "unreadCount1" + 1
        ELSE "unreadCount1"
      END,
      "unreadCount2" = CASE
        WHEN "participant2Id" = NEW."receiverId" THEN "unreadCount2" + 1
        ELSE "unreadCount2"
      END,
      "updatedAt" = NOW()
    WHERE "id" = NEW."conversationId";
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_conversation_on_message ON "Message";
CREATE TRIGGER trigger_update_conversation_on_message
  AFTER INSERT ON "Message"
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_on_message();

-- =============================================================
-- SECTION 23: RECORD PLATFORM REVENUE HELPER
-- =============================================================
-- Easy function to record platform revenue from code

CREATE OR REPLACE FUNCTION record_platform_revenue(
  p_type TEXT,
  p_amount NUMERIC,
  p_order_id TEXT DEFAULT NULL,
  p_shipment_id TEXT DEFAULT NULL,
  p_user_id TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_percentage NUMERIC DEFAULT NULL,
  p_base_amount NUMERIC DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  v_revenue_id TEXT;
BEGIN
  INSERT INTO "PlatformRevenue" ("type", "amount", "orderId", "shipmentId", "userId", "description", "percentage", "baseAmount")
  VALUES (p_type, p_amount, p_order_id, p_shipment_id, p_user_id, p_description, p_percentage, p_base_amount)
  RETURNING "id" INTO v_revenue_id;

  RETURN v_revenue_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================
-- SECTION 24: HELPER VIEWS
-- =============================================================

-- View: Order with full breakdown
CREATE OR REPLACE VIEW "OrderBreakdown" AS
SELECT
  o."id" AS order_id,
  o."buyerId",
  o."sellerId",
  o."productId",
  o."quantity",
  o."unitPrice",
  o."productSubtotal",
  o."transportEstimate",
  o."transportBookingFee",
  o."platformCommission",
  o."escrowFee",
  o."totalWithCharges",
  o."advanceAmount",
  o."remainingAmount",
  o."paymentStatus",
  o."status" AS order_status,
  p."name" AS product_name,
  p."unit" AS product_unit,
  ub."name" AS buyer_name,
  us."name" AS seller_name
FROM "Order" o
LEFT JOIN "Product" p ON p."id" = o."productId"
LEFT JOIN "User" ub ON ub."id" = o."buyerId"
LEFT JOIN "User" us ON us."id" = o."sellerId";

-- View: Transporter Performance Dashboard
CREATE OR REPLACE VIEW "TransporterPerformance" AS
SELECT
  u."id" AS transporter_id,
  u."name",
  u."companyName",
  u."phone",
  u."pickupSuccessRate",
  u."deliverySuccessRate",
  u."avgResponseTimeHours",
  u."warningCount",
  u."totalCompletedShipments",
  u."totalFailedShipments",
  u."consecutiveFailures",
  u."isSuspended",
  u."avgRating",
  u."totalReviews",
  u."subscriptionTier"
FROM "User" u
WHERE u."role" = 'transporter';

-- View: Revenue Summary
CREATE OR REPLACE VIEW "RevenueSummary" AS
SELECT
  "type" AS revenue_type,
  COUNT(*) AS transaction_count,
  SUM("amount") AS total_amount,
  AVG("amount") AS avg_amount,
  MIN("amount") AS min_amount,
  MAX("amount") AS max_amount,
  DATE_TRUNC('day', "recordedAt") AS revenue_date
FROM "PlatformRevenue"
GROUP BY "type", DATE_TRUNC('day', "recordedAt");

-- View: Product with Stock Info
CREATE OR REPLACE VIEW "ProductWithStock" AS
SELECT
  p.*,
  (p."quantity" - p."stockReserved") AS "calculatedAvailable",
  u."name" AS seller_name,
  u."companyName" AS seller_company,
  u."farmName" AS seller_farm,
  u."avgRating" AS seller_rating,
  u."subscriptionTier" AS seller_tier,
  u."isSponsored" AS seller_sponsored
FROM "Product" p
LEFT JOIN "User" u ON u."id" = p."sellerId"
WHERE p."isActive" = TRUE;

-- =============================================================
-- SECTION 25: EXPIRE OLD SUBSCRIPTIONS & SPONSORED LISTINGS
-- =============================================================

CREATE OR REPLACE FUNCTION expire_subscriptions_and_listings()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  -- Expire subscriptions
  UPDATE "Subscription" SET
    "status" = 'expired',
    "updatedAt" = NOW()
  WHERE "status" = 'active' AND "expiresAt" < NOW();

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Update user subscriptionTier to 'free' if their subscription expired
  UPDATE "User" u SET
    "subscriptionTier" = 'free',
    "subscriptionExpiry" = NULL,
    "subscriptionAmount" = 0
  WHERE u."subscriptionTier" != 'free'
    AND NOT EXISTS (
      SELECT 1 FROM "Subscription" s
      WHERE s."userId" = u."id"
        AND s."status" = 'active'
        AND s."expiresAt" >= NOW()
    );

  -- Expire sponsored listings
  UPDATE "SponsoredListing" SET
    "status" = 'expired',
    "updatedAt" = NOW()
  WHERE "status" = 'active' AND "expiresAt" < NOW();

  -- Update product sponsored status
  UPDATE "Product" SET
    "isSponsored" = FALSE,
    "sponsoredExpiry" = NULL
  WHERE "isSponsored" = TRUE
    AND "sponsoredExpiry" < NOW();

  -- Update user sponsored status
  UPDATE "User" SET
    "isSponsored" = FALSE,
    "sponsoredExpiry" = NULL
  WHERE "isSponsored" = TRUE
    AND "sponsoredExpiry" < NOW();

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================================
-- SECTION 26: GRANT PERMISSIONS
-- =============================================================
-- Ensure anon and authenticated roles can access all tables

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- =============================================================
-- DONE! AgroBridge V3 migration complete.
--
-- Summary of changes:
-- ===================
-- NEW TABLES:
--   - TransporterWarning (Feature 6: performance warnings)
--   - Payment (Feature 7: split payment records)
--   - Subscription (Revenue: subscription tracking)
--   - SponsoredListing (Revenue: sponsored products/profiles)
--   - Conversation (Feature 5: chat grouping)
--
-- ALTERED TABLES:
--   - Product: +stockReserved, +stockAvailable (GENERATED), +isSponsored, +sponsoredExpiry, +sponsoredPosition
--   - Order: +productSubtotal, +transportEstimate, +transportBookingFee, +platformCommission,
--            +escrowFee, +logisticsCommission, +totalWithCharges, +priceBreakdownJson,
--            +paymentStatus, +advanceAmount, +remainingAmount, +advancePaidAt, +remainingPaidAt,
--            +advancePaymentRef, +remainingPaymentRef, +advancePaymentMethod, +remainingPaymentMethod,
--            +platformFee, +transportCost, +delivery address fields
--   - Shipment: +createdBy, +createdByRole, +assignedAt, +pickupDeadline, +autoCancelledAt,
--              +pickupConfirmedAt, +reassignedFrom, +reassignmentCount, +reassignmentReason,
--              +producerNotes, +isExternal, +external* (8 cols), +externalTransportCost,
--              +logisticsCommissionWaived
--   - Message: +orderId, +shipmentId, +messageType, +attachmentUrl, +chatType,
--              +isSystemMessage, +metadata, +conversationId
--   - User: +pickupSuccessRate, +deliverySuccessRate, +avgResponseTimeHours, +warningCount,
--           +lastWarningAt, +totalCompletedShipments, +totalFailedShipments, +isSuspended,
--           +suspendedAt, +suspensionReason, +lastShipmentAssignedAt, +consecutiveFailures,
--           +subscriptionTier, +subscriptionExpiry, +subscriptionAmount, +subscriptionStartedAt,
--           +subscriptionAutoRenew, +subscriptionPaymentRef, +isSponsored, +sponsoredExpiry,
--           +sponsoredAmount, +sponsoredStartedAt, +avatarUrl, +bannerUrl
--   - Review: +productId, +reviewType, +orderId, +shipmentId, +pickupRating, +deliveryRating,
--             +responseTimeRating, +overallRating
--
-- TRIGGERS:
--   - update_product_stock_reserved (on Order INSERT/UPDATE/DELETE)
--   - set_pickup_deadline (on Shipment before INSERT/UPDATE)
--   - auto_cancel_expired_shipments (callable function)
--   - update_transporter_stats_on_delivery (on Shipment UPDATE)
--   - update_conversation_on_message (on Message INSERT)
--
-- HELPER FUNCTIONS:
--   - get_or_create_conversation()
--   - record_platform_revenue()
--   - auto_cancel_expired_shipments()
--   - expire_subscriptions_and_listings()
--
-- VIEWS:
--   - OrderBreakdown
--   - TransporterPerformance
--   - RevenueSummary
--   - ProductWithStock
-- =============================================================
