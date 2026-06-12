-- =============================================================
-- AgroBridge - COMPLETE ALL-IN-ONE MIGRATION
-- Creates ALL base tables + ALL V3 feature columns
-- Run this in Supabase SQL Editor
-- Safe to run on fresh DB or on top of existing tables
-- =============================================================

-- =============================================================
-- PART 1: BASE TABLES (if they don't exist)
-- =============================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "role" TEXT DEFAULT 'buyer',
  "companyName" TEXT,
  "gstNumber" TEXT,
  "phone" TEXT,
  "email" TEXT UNIQUE NOT NULL,
  "name" TEXT,
  "password" TEXT,
  "avatar" TEXT,
  "state" TEXT,
  "city" TEXT,
  "address" TEXT,
  "verificationStatus" TEXT DEFAULT 'pending',
  "isOnline" BOOLEAN DEFAULT false,
  "farmName" TEXT,
  "farmSize" TEXT,
  "farmLocation" TEXT,
  "farmImages" TEXT,
  "yearsExperience" INTEGER,
  "certifications" TEXT,
  "totalTransactions" INTEGER DEFAULT 0,
  "latitude" TEXT,
  "longitude" TEXT,
  "avgRating" FLOAT DEFAULT 0,
  "totalReviews" INTEGER DEFAULT 0,
  "avatarUrl" TEXT,
  "bannerUrl" TEXT,
  "pickupSuccessRate" NUMERIC DEFAULT 100,
  "deliverySuccessRate" NUMERIC DEFAULT 100,
  "avgResponseTimeHours" NUMERIC DEFAULT 0,
  "warningCount" INTEGER DEFAULT 0,
  "lastWarningAt" TIMESTAMPTZ,
  "totalCompletedShipments" INTEGER DEFAULT 0,
  "totalFailedShipments" INTEGER DEFAULT 0,
  "isSuspended" BOOLEAN DEFAULT FALSE,
  "suspendedAt" TIMESTAMPTZ,
  "suspensionReason" TEXT,
  "lastShipmentAssignedAt" TIMESTAMPTZ,
  "consecutiveFailures" INTEGER DEFAULT 0,
  "subscriptionTier" TEXT DEFAULT 'free',
  "subscriptionExpiry" TIMESTAMPTZ,
  "subscriptionAmount" NUMERIC DEFAULT 0,
  "subscriptionStartedAt" TIMESTAMPTZ,
  "subscriptionAutoRenew" BOOLEAN DEFAULT FALSE,
  "subscriptionPaymentRef" TEXT,
  "isSponsored" BOOLEAN DEFAULT FALSE,
  "sponsoredExpiry" TIMESTAMPTZ,
  "sponsoredAmount" NUMERIC DEFAULT 0,
  "sponsoredStartedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PRODUCT TABLE
CREATE TABLE IF NOT EXISTS "Product" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "sellerId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "category" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "quantity" FLOAT NOT NULL,
  "unit" TEXT NOT NULL,
  "pricePerUnit" FLOAT NOT NULL,
  "minOrderQty" FLOAT,
  "location" TEXT NOT NULL,
  "state" TEXT,
  "qualityGrade" TEXT,
  "images" TEXT,
  "imageUrl" TEXT,
  "harvestDate" TIMESTAMPTZ,
  "freshness" TEXT,
  "cropVariety" TEXT,
  "isOrganic" BOOLEAN DEFAULT false,
  "pesticidesUsed" TEXT,
  "moistureContent" TEXT,
  "shelfLife" TEXT,
  "storageCondition" TEXT,
  "certifications" TEXT,
  "isActive" BOOLEAN DEFAULT true,
  "stockReserved" NUMERIC DEFAULT 0,
  "reservedUpdatedAt" TIMESTAMPTZ,
  "isSponsored" BOOLEAN DEFAULT FALSE,
  "sponsoredExpiry" TIMESTAMPTZ,
  "sponsoredPosition" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Add generated column (try, fallback to regular if fails)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Product' AND column_name = 'stockAvailable') THEN
    ALTER TABLE "Product" ADD COLUMN "stockAvailable" NUMERIC GENERATED ALWAYS AS ("quantity" - "stockReserved") STORED;
  END IF;
EXCEPTION WHEN OTHERS THEN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Product' AND column_name = 'stockAvailable') THEN
    ALTER TABLE "Product" ADD COLUMN "stockAvailable" NUMERIC DEFAULT 0;
  END IF;
END $$;

-- 3. BUYER REQUIREMENT TABLE
CREATE TABLE IF NOT EXISTS "BuyerRequirement" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "buyerId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "productType" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "quantityNeeded" FLOAT NOT NULL,
  "unit" TEXT NOT NULL,
  "deliveryLocation" TEXT NOT NULL,
  "deliveryState" TEXT,
  "deadline" TIMESTAMPTZ,
  "maxBudget" FLOAT,
  "description" TEXT,
  "status" TEXT DEFAULT 'open',
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ORDER TABLE (with ALL V3 columns included)
CREATE TABLE IF NOT EXISTS "Order" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "buyerId" TEXT NOT NULL REFERENCES "User"("id"),
  "sellerId" TEXT NOT NULL REFERENCES "User"("id"),
  "productId" TEXT NOT NULL REFERENCES "Product"("id"),
  "quantity" FLOAT NOT NULL,
  "unitPrice" FLOAT NOT NULL,
  "totalPrice" FLOAT NOT NULL,
  "status" TEXT DEFAULT 'negotiating',
  "productSubtotal" NUMERIC,
  "transportEstimate" NUMERIC DEFAULT 0,
  "transportBookingFee" NUMERIC DEFAULT 0,
  "platformCommission" NUMERIC DEFAULT 0,
  "escrowFee" NUMERIC DEFAULT 0,
  "logisticsCommission" NUMERIC DEFAULT 0,
  "totalWithCharges" NUMERIC,
  "priceBreakdownJson" JSONB,
  "paymentStatus" TEXT DEFAULT 'pending',
  "advanceAmount" NUMERIC,
  "remainingAmount" NUMERIC,
  "advancePaidAt" TIMESTAMPTZ,
  "remainingPaidAt" TIMESTAMPTZ,
  "advancePaymentRef" TEXT,
  "remainingPaymentRef" TEXT,
  "advancePaymentMethod" TEXT,
  "remainingPaymentMethod" TEXT,
  "platformFee" NUMERIC DEFAULT 0,
  "transportCost" NUMERIC DEFAULT 0,
  "deliveryAddress" TEXT,
  "deliveryCity" TEXT,
  "deliveryState" TEXT,
  "deliveryPincode" TEXT,
  "deliveryLat" TEXT,
  "deliveryLng" TEXT,
  "deliveryFullAddress" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 5. SHIPMENT TABLE (with ALL V3 columns included)
CREATE TABLE IF NOT EXISTS "Shipment" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "orderId" TEXT UNIQUE NOT NULL REFERENCES "Order"("id"),
  "transporterId" TEXT REFERENCES "User"("id"),
  "origin" TEXT NOT NULL,
  "destination" TEXT NOT NULL,
  "distance" FLOAT,
  "status" TEXT DEFAULT 'pending',
  "pickupDate" TIMESTAMPTZ,
  "deliveryDate" TIMESTAMPTZ,
  "actualDelivery" TIMESTAMPTZ,
  "vehicleType" TEXT,
  "vehicleNumber" TEXT,
  "driverName" TEXT,
  "driverPhone" TEXT,
  "deliveryProof" TEXT,
  "exactPickupAddress" TEXT,
  "exactDropAddress" TEXT,
  "pickupLatitude" TEXT,
  "pickupLongitude" TEXT,
  "dropLatitude" TEXT,
  "dropLongitude" TEXT,
  "expectedPickupDate" TIMESTAMPTZ,
  "currentLatitude" TEXT,
  "currentLongitude" TEXT,
  "lastTrackingUpdate" TIMESTAMPTZ,
  "createdBy" TEXT,
  "createdByRole" TEXT DEFAULT 'producer',
  "assignedAt" TIMESTAMPTZ,
  "pickupDeadline" TIMESTAMPTZ,
  "autoCancelledAt" TIMESTAMPTZ,
  "pickupConfirmedAt" TIMESTAMPTZ,
  "reassignedFrom" TEXT,
  "reassignmentCount" INTEGER DEFAULT 0,
  "reassignmentReason" TEXT,
  "producerNotes" TEXT,
  "isExternal" BOOLEAN DEFAULT FALSE,
  "externalTransporterName" TEXT,
  "externalCompanyName" TEXT,
  "externalDriverName" TEXT,
  "externalVehicleNumber" TEXT,
  "externalMobileNumber" TEXT,
  "externalPickupDate" TIMESTAMPTZ,
  "externalDeliveryDate" TIMESTAMPTZ,
  "externalTransportCost" NUMERIC DEFAULT 0,
  "logisticsCommissionWaived" BOOLEAN DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TRANSPORT BID TABLE
CREATE TABLE IF NOT EXISTS "TransportBid" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "shipmentId" TEXT NOT NULL REFERENCES "Shipment"("id") ON DELETE CASCADE,
  "transporterId" TEXT NOT NULL REFERENCES "User"("id"),
  "bidAmount" FLOAT NOT NULL,
  "estimatedDays" INTEGER,
  "vehicleType" TEXT,
  "comments" TEXT,
  "status" TEXT DEFAULT 'pending',
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 7. MESSAGE TABLE (with ALL V3 columns included)
CREATE TABLE IF NOT EXISTS "Message" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "senderId" TEXT NOT NULL REFERENCES "User"("id"),
  "receiverId" TEXT NOT NULL REFERENCES "User"("id"),
  "content" TEXT NOT NULL,
  "isRead" BOOLEAN DEFAULT false,
  "orderId" TEXT,
  "shipmentId" TEXT,
  "messageType" TEXT DEFAULT 'text',
  "attachmentUrl" TEXT,
  "chatType" TEXT DEFAULT 'order',
  "isSystemMessage" BOOLEAN DEFAULT FALSE,
  "metadata" JSONB,
  "conversationId" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 8. REVIEW TABLE (with ALL V3 columns included)
CREATE TABLE IF NOT EXISTS "Review" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "reviewerId" TEXT NOT NULL REFERENCES "User"("id"),
  "targetId" TEXT NOT NULL REFERENCES "User"("id"),
  "rating" INTEGER NOT NULL,
  "comment" TEXT,
  "productId" TEXT,
  "reviewType" TEXT DEFAULT 'user',
  "orderId" TEXT,
  "shipmentId" TEXT,
  "pickupRating" INTEGER,
  "deliveryRating" INTEGER,
  "responseTimeRating" INTEGER,
  "overallRating" INTEGER,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 9. PLATFORM STATS TABLE
CREATE TABLE IF NOT EXISTS "PlatformStats" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "totalUsers" INTEGER DEFAULT 0,
  "totalProducts" INTEGER DEFAULT 0,
  "totalOrders" INTEGER DEFAULT 0,
  "totalShipments" INTEGER DEFAULT 0,
  "totalRevenue" FLOAT DEFAULT 0,
  "activeListings" INTEGER DEFAULT 0,
  "verifiedUsers" INTEGER DEFAULT 0,
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================
-- PART 2: V3 NEW TABLES
-- =============================================================

-- 10. TRANSPORTER WARNING TABLE
CREATE TABLE IF NOT EXISTS "TransporterWarning" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "transporterId" TEXT NOT NULL REFERENCES "User"("id"),
  "shipmentId" TEXT REFERENCES "Shipment"("id"),
  "orderId" TEXT REFERENCES "Order"("id"),
  "warningType" TEXT NOT NULL,
  "severity" TEXT DEFAULT 'warning',
  "message" TEXT,
  "issuedAt" TIMESTAMPTZ DEFAULT NOW(),
  "resolvedAt" TIMESTAMPTZ,
  "isResolved" BOOLEAN DEFAULT FALSE
);

-- 11. PAYMENT TABLE
CREATE TABLE IF NOT EXISTS "Payment" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "orderId" TEXT NOT NULL REFERENCES "Order"("id"),
  "paymentType" TEXT NOT NULL,
  "amount" NUMERIC NOT NULL,
  "currency" TEXT DEFAULT 'INR',
  "status" TEXT DEFAULT 'pending',
  "paymentMethod" TEXT,
  "paymentRef" TEXT,
  "gatewayResponse" JSONB,
  "paidAt" TIMESTAMPTZ,
  "failedAt" TIMESTAMPTZ,
  "refundedAt" TIMESTAMPTZ,
  "refundRef" TEXT,
  "description" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 12. SUBSCRIPTION TABLE
CREATE TABLE IF NOT EXISTS "Subscription" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"("id"),
  "tier" TEXT NOT NULL,
  "roleType" TEXT NOT NULL,
  "amount" NUMERIC NOT NULL,
  "durationDays" INTEGER NOT NULL,
  "startedAt" TIMESTAMPTZ DEFAULT NOW(),
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "status" TEXT DEFAULT 'active',
  "autoRenew" BOOLEAN DEFAULT FALSE,
  "paymentRef" TEXT,
  "paymentId" TEXT REFERENCES "Payment"("id"),
  "cancelledAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 13. SPONSORED LISTING TABLE
CREATE TABLE IF NOT EXISTS "SponsoredListing" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"("id"),
  "productId" TEXT REFERENCES "Product"("id"),
  "amount" NUMERIC NOT NULL,
  "durationDays" INTEGER DEFAULT 7,
  "startedAt" TIMESTAMPTZ DEFAULT NOW(),
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "status" TEXT DEFAULT 'active',
  "position" INTEGER DEFAULT 0,
  "impressions" INTEGER DEFAULT 0,
  "clicks" INTEGER DEFAULT 0,
  "paymentRef" TEXT,
  "paymentId" TEXT REFERENCES "Payment"("id"),
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 14. CONVERSATION TABLE
CREATE TABLE IF NOT EXISTS "Conversation" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "type" TEXT NOT NULL,
  "orderId" TEXT REFERENCES "Order"("id"),
  "shipmentId" TEXT REFERENCES "Shipment"("id"),
  "participant1Id" TEXT NOT NULL REFERENCES "User"("id"),
  "participant2Id" TEXT NOT NULL REFERENCES "User"("id"),
  "lastMessageAt" TIMESTAMPTZ DEFAULT NOW(),
  "lastMessageContent" TEXT,
  "lastMessageSenderId" TEXT,
  "unreadCount1" INTEGER DEFAULT 0,
  "unreadCount2" INTEGER DEFAULT 0,
  "isActive" BOOLEAN DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 15. PLATFORM REVENUE TABLE
CREATE TABLE IF NOT EXISTS "PlatformRevenue" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "type" TEXT NOT NULL,
  "amount" NUMERIC NOT NULL,
  "currency" TEXT DEFAULT 'INR',
  "orderId" TEXT REFERENCES "Order"("id"),
  "shipmentId" TEXT REFERENCES "Shipment"("id"),
  "userId" TEXT REFERENCES "User"("id"),
  "subscriptionId" TEXT REFERENCES "Subscription"("id"),
  "sponsoredListingId" TEXT REFERENCES "SponsoredListing"("id"),
  "paymentId" TEXT REFERENCES "Payment"("id"),
  "percentage" NUMERIC,
  "baseAmount" NUMERIC,
  "description" TEXT,
  "metadata" JSONB,
  "recordedAt" TIMESTAMPTZ DEFAULT NOW(),
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================
-- PART 3: ADD MISSING COLUMNS TO EXISTING TABLES
-- (Safe - only adds if column doesn't exist)
-- =============================================================

-- Product: missing V3 columns
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Product' AND column_name = 'stockReserved') THEN
    ALTER TABLE "Product" ADD COLUMN "stockReserved" NUMERIC DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Product' AND column_name = 'reservedUpdatedAt') THEN
    ALTER TABLE "Product" ADD COLUMN "reservedUpdatedAt" TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Product' AND column_name = 'isSponsored') THEN
    ALTER TABLE "Product" ADD COLUMN "isSponsored" BOOLEAN DEFAULT FALSE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Product' AND column_name = 'sponsoredExpiry') THEN
    ALTER TABLE "Product" ADD COLUMN "sponsoredExpiry" TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Product' AND column_name = 'sponsoredPosition') THEN
    ALTER TABLE "Product" ADD COLUMN "sponsoredPosition" INTEGER DEFAULT 0;
  END IF;
END $$;

-- Order: missing V3 columns
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'productSubtotal') THEN
    ALTER TABLE "Order" ADD COLUMN "productSubtotal" NUMERIC;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'transportEstimate') THEN
    ALTER TABLE "Order" ADD COLUMN "transportEstimate" NUMERIC DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'transportBookingFee') THEN
    ALTER TABLE "Order" ADD COLUMN "transportBookingFee" NUMERIC DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'platformCommission') THEN
    ALTER TABLE "Order" ADD COLUMN "platformCommission" NUMERIC DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'escrowFee') THEN
    ALTER TABLE "Order" ADD COLUMN "escrowFee" NUMERIC DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'logisticsCommission') THEN
    ALTER TABLE "Order" ADD COLUMN "logisticsCommission" NUMERIC DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'totalWithCharges') THEN
    ALTER TABLE "Order" ADD COLUMN "totalWithCharges" NUMERIC;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'priceBreakdownJson') THEN
    ALTER TABLE "Order" ADD COLUMN "priceBreakdownJson" JSONB;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'paymentStatus') THEN
    ALTER TABLE "Order" ADD COLUMN "paymentStatus" TEXT DEFAULT 'pending';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'advanceAmount') THEN
    ALTER TABLE "Order" ADD COLUMN "advanceAmount" NUMERIC;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'remainingAmount') THEN
    ALTER TABLE "Order" ADD COLUMN "remainingAmount" NUMERIC;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'advancePaidAt') THEN
    ALTER TABLE "Order" ADD COLUMN "advancePaidAt" TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'remainingPaidAt') THEN
    ALTER TABLE "Order" ADD COLUMN "remainingPaidAt" TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'advancePaymentRef') THEN
    ALTER TABLE "Order" ADD COLUMN "advancePaymentRef" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'remainingPaymentRef') THEN
    ALTER TABLE "Order" ADD COLUMN "remainingPaymentRef" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'advancePaymentMethod') THEN
    ALTER TABLE "Order" ADD COLUMN "advancePaymentMethod" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'remainingPaymentMethod') THEN
    ALTER TABLE "Order" ADD COLUMN "remainingPaymentMethod" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'platformFee') THEN
    ALTER TABLE "Order" ADD COLUMN "platformFee" NUMERIC DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'transportCost') THEN
    ALTER TABLE "Order" ADD COLUMN "transportCost" NUMERIC DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'deliveryAddress') THEN
    ALTER TABLE "Order" ADD COLUMN "deliveryAddress" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'deliveryCity') THEN
    ALTER TABLE "Order" ADD COLUMN "deliveryCity" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'deliveryState') THEN
    ALTER TABLE "Order" ADD COLUMN "deliveryState" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'deliveryPincode') THEN
    ALTER TABLE "Order" ADD COLUMN "deliveryPincode" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'deliveryLat') THEN
    ALTER TABLE "Order" ADD COLUMN "deliveryLat" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'deliveryLng') THEN
    ALTER TABLE "Order" ADD COLUMN "deliveryLng" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'deliveryFullAddress') THEN
    ALTER TABLE "Order" ADD COLUMN "deliveryFullAddress" TEXT;
  END IF;
END $$;

-- Shipment: missing V3 columns
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Shipment' AND column_name = 'createdBy') THEN
    ALTER TABLE "Shipment" ADD COLUMN "createdBy" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Shipment' AND column_name = 'createdByRole') THEN
    ALTER TABLE "Shipment" ADD COLUMN "createdByRole" TEXT DEFAULT 'producer';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Shipment' AND column_name = 'assignedAt') THEN
    ALTER TABLE "Shipment" ADD COLUMN "assignedAt" TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Shipment' AND column_name = 'pickupDeadline') THEN
    ALTER TABLE "Shipment" ADD COLUMN "pickupDeadline" TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Shipment' AND column_name = 'autoCancelledAt') THEN
    ALTER TABLE "Shipment" ADD COLUMN "autoCancelledAt" TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Shipment' AND column_name = 'pickupConfirmedAt') THEN
    ALTER TABLE "Shipment" ADD COLUMN "pickupConfirmedAt" TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Shipment' AND column_name = 'reassignedFrom') THEN
    ALTER TABLE "Shipment" ADD COLUMN "reassignedFrom" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Shipment' AND column_name = 'reassignmentCount') THEN
    ALTER TABLE "Shipment" ADD COLUMN "reassignmentCount" INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Shipment' AND column_name = 'reassignmentReason') THEN
    ALTER TABLE "Shipment" ADD COLUMN "reassignmentReason" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Shipment' AND column_name = 'producerNotes') THEN
    ALTER TABLE "Shipment" ADD COLUMN "producerNotes" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Shipment' AND column_name = 'isExternal') THEN
    ALTER TABLE "Shipment" ADD COLUMN "isExternal" BOOLEAN DEFAULT FALSE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Shipment' AND column_name = 'externalTransporterName') THEN
    ALTER TABLE "Shipment" ADD COLUMN "externalTransporterName" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Shipment' AND column_name = 'externalCompanyName') THEN
    ALTER TABLE "Shipment" ADD COLUMN "externalCompanyName" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Shipment' AND column_name = 'externalDriverName') THEN
    ALTER TABLE "Shipment" ADD COLUMN "externalDriverName" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Shipment' AND column_name = 'externalVehicleNumber') THEN
    ALTER TABLE "Shipment" ADD COLUMN "externalVehicleNumber" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Shipment' AND column_name = 'externalMobileNumber') THEN
    ALTER TABLE "Shipment" ADD COLUMN "externalMobileNumber" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Shipment' AND column_name = 'externalPickupDate') THEN
    ALTER TABLE "Shipment" ADD COLUMN "externalPickupDate" TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Shipment' AND column_name = 'externalDeliveryDate') THEN
    ALTER TABLE "Shipment" ADD COLUMN "externalDeliveryDate" TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Shipment' AND column_name = 'externalTransportCost') THEN
    ALTER TABLE "Shipment" ADD COLUMN "externalTransportCost" NUMERIC DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Shipment' AND column_name = 'logisticsCommissionWaived') THEN
    ALTER TABLE "Shipment" ADD COLUMN "logisticsCommissionWaived" BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Message: missing V3 columns
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Message' AND column_name = 'orderId') THEN
    ALTER TABLE "Message" ADD COLUMN "orderId" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Message' AND column_name = 'shipmentId') THEN
    ALTER TABLE "Message" ADD COLUMN "shipmentId" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Message' AND column_name = 'messageType') THEN
    ALTER TABLE "Message" ADD COLUMN "messageType" TEXT DEFAULT 'text';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Message' AND column_name = 'attachmentUrl') THEN
    ALTER TABLE "Message" ADD COLUMN "attachmentUrl" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Message' AND column_name = 'chatType') THEN
    ALTER TABLE "Message" ADD COLUMN "chatType" TEXT DEFAULT 'order';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Message' AND column_name = 'isSystemMessage') THEN
    ALTER TABLE "Message" ADD COLUMN "isSystemMessage" BOOLEAN DEFAULT FALSE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Message' AND column_name = 'metadata') THEN
    ALTER TABLE "Message" ADD COLUMN "metadata" JSONB;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Message' AND column_name = 'conversationId') THEN
    ALTER TABLE "Message" ADD COLUMN "conversationId" TEXT;
  END IF;
END $$;

-- Review: missing V3 columns
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Review' AND column_name = 'productId') THEN
    ALTER TABLE "Review" ADD COLUMN "productId" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Review' AND column_name = 'reviewType') THEN
    ALTER TABLE "Review" ADD COLUMN "reviewType" TEXT DEFAULT 'user';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Review' AND column_name = 'orderId') THEN
    ALTER TABLE "Review" ADD COLUMN "orderId" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Review' AND column_name = 'shipmentId') THEN
    ALTER TABLE "Review" ADD COLUMN "shipmentId" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Review' AND column_name = 'pickupRating') THEN
    ALTER TABLE "Review" ADD COLUMN "pickupRating" INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Review' AND column_name = 'deliveryRating') THEN
    ALTER TABLE "Review" ADD COLUMN "deliveryRating" INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Review' AND column_name = 'responseTimeRating') THEN
    ALTER TABLE "Review" ADD COLUMN "responseTimeRating" INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Review' AND column_name = 'overallRating') THEN
    ALTER TABLE "Review" ADD COLUMN "overallRating" INTEGER;
  END IF;
END $$;

-- User: missing V3 columns
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'avatarUrl') THEN
    ALTER TABLE "User" ADD COLUMN "avatarUrl" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'bannerUrl') THEN
    ALTER TABLE "User" ADD COLUMN "bannerUrl" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'pickupSuccessRate') THEN
    ALTER TABLE "User" ADD COLUMN "pickupSuccessRate" NUMERIC DEFAULT 100;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'deliverySuccessRate') THEN
    ALTER TABLE "User" ADD COLUMN "deliverySuccessRate" NUMERIC DEFAULT 100;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'avgResponseTimeHours') THEN
    ALTER TABLE "User" ADD COLUMN "avgResponseTimeHours" NUMERIC DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'warningCount') THEN
    ALTER TABLE "User" ADD COLUMN "warningCount" INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'lastWarningAt') THEN
    ALTER TABLE "User" ADD COLUMN "lastWarningAt" TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'totalCompletedShipments') THEN
    ALTER TABLE "User" ADD COLUMN "totalCompletedShipments" INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'totalFailedShipments') THEN
    ALTER TABLE "User" ADD COLUMN "totalFailedShipments" INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'isSuspended') THEN
    ALTER TABLE "User" ADD COLUMN "isSuspended" BOOLEAN DEFAULT FALSE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'suspendedAt') THEN
    ALTER TABLE "User" ADD COLUMN "suspendedAt" TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'suspensionReason') THEN
    ALTER TABLE "User" ADD COLUMN "suspensionReason" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'lastShipmentAssignedAt') THEN
    ALTER TABLE "User" ADD COLUMN "lastShipmentAssignedAt" TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'consecutiveFailures') THEN
    ALTER TABLE "User" ADD COLUMN "consecutiveFailures" INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'subscriptionTier') THEN
    ALTER TABLE "User" ADD COLUMN "subscriptionTier" TEXT DEFAULT 'free';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'subscriptionExpiry') THEN
    ALTER TABLE "User" ADD COLUMN "subscriptionExpiry" TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'subscriptionAmount') THEN
    ALTER TABLE "User" ADD COLUMN "subscriptionAmount" NUMERIC DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'subscriptionStartedAt') THEN
    ALTER TABLE "User" ADD COLUMN "subscriptionStartedAt" TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'subscriptionAutoRenew') THEN
    ALTER TABLE "User" ADD COLUMN "subscriptionAutoRenew" BOOLEAN DEFAULT FALSE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'subscriptionPaymentRef') THEN
    ALTER TABLE "User" ADD COLUMN "subscriptionPaymentRef" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'isSponsored') THEN
    ALTER TABLE "User" ADD COLUMN "isSponsored" BOOLEAN DEFAULT FALSE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'sponsoredExpiry') THEN
    ALTER TABLE "User" ADD COLUMN "sponsoredExpiry" TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'sponsoredAmount') THEN
    ALTER TABLE "User" ADD COLUMN "sponsoredAmount" NUMERIC DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'sponsoredStartedAt') THEN
    ALTER TABLE "User" ADD COLUMN "sponsoredStartedAt" TIMESTAMPTZ;
  END IF;
END $$;

-- =============================================================
-- PART 4: UPDATE EXISTING DATA
-- =============================================================

UPDATE "Order" SET "productSubtotal" = "unitPrice" * "quantity" WHERE "productSubtotal" IS NULL;
UPDATE "Order" SET "totalWithCharges" = "totalPrice" WHERE "totalWithCharges" IS NULL;
UPDATE "Order" SET "paymentStatus" = CASE
    WHEN status = 'delivered' THEN 'full_paid'
    WHEN status IN ('confirmed', 'shipped') THEN 'advance_paid'
    ELSE 'pending'
  END
WHERE "paymentStatus" IS NULL OR "paymentStatus" = 'pending';
UPDATE "Order" SET
  "advanceAmount" = FLOOR("totalPrice" * 0.5 * 100) / 100,
  "remainingAmount" = CEIL("totalPrice" * 0.5 * 100) / 100
WHERE "advanceAmount" IS NULL AND "totalPrice" > 0;

UPDATE "Product" p SET "stockReserved" = COALESCE((
    SELECT SUM(o."quantity") FROM "Order" o
    WHERE o."productId" = p."id" AND o.status NOT IN ('cancelled', 'delivered', 'disputed')
  ), 0), "reservedUpdatedAt" = NOW();

-- =============================================================
-- PART 5: ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- =============================================================

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BuyerRequirement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Shipment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TransportBid" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Review" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PlatformStats" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TransporterWarning" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Payment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Subscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SponsoredListing" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Conversation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PlatformRevenue" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (idempotent)
DO $$ BEGIN
  -- User
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'User' AND policyname = 'Allow all on User') THEN
    CREATE POLICY "Allow all on User" ON "User" FOR ALL USING (true) WITH CHECK (true);
  END IF;
  -- Product
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'Product' AND policyname = 'Allow all on Product') THEN
    CREATE POLICY "Allow all on Product" ON "Product" FOR ALL USING (true) WITH CHECK (true);
  END IF;
  -- BuyerRequirement
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'BuyerRequirement' AND policyname = 'Allow all on BuyerRequirement') THEN
    CREATE POLICY "Allow all on BuyerRequirement" ON "BuyerRequirement" FOR ALL USING (true) WITH CHECK (true);
  END IF;
  -- Order
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'Order' AND policyname = 'Allow all on Order') THEN
    CREATE POLICY "Allow all on Order" ON "Order" FOR ALL USING (true) WITH CHECK (true);
  END IF;
  -- Shipment
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'Shipment' AND policyname = 'Allow all on Shipment') THEN
    CREATE POLICY "Allow all on Shipment" ON "Shipment" FOR ALL USING (true) WITH CHECK (true);
  END IF;
  -- TransportBid
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'TransportBid' AND policyname = 'Allow all on TransportBid') THEN
    CREATE POLICY "Allow all on TransportBid" ON "TransportBid" FOR ALL USING (true) WITH CHECK (true);
  END IF;
  -- Message
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'Message' AND policyname = 'Allow all on Message') THEN
    CREATE POLICY "Allow all on Message" ON "Message" FOR ALL USING (true) WITH CHECK (true);
  END IF;
  -- Review
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'Review' AND policyname = 'Allow all on Review') THEN
    CREATE POLICY "Allow all on Review" ON "Review" FOR ALL USING (true) WITH CHECK (true);
  END IF;
  -- PlatformStats
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'PlatformStats' AND policyname = 'Allow all on PlatformStats') THEN
    CREATE POLICY "Allow all on PlatformStats" ON "PlatformStats" FOR ALL USING (true) WITH CHECK (true);
  END IF;
  -- TransporterWarning
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'TransporterWarning' AND policyname = 'Allow all on TransporterWarning') THEN
    CREATE POLICY "Allow all on TransporterWarning" ON "TransporterWarning" FOR ALL USING (true) WITH CHECK (true);
  END IF;
  -- Payment
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'Payment' AND policyname = 'Allow all on Payment') THEN
    CREATE POLICY "Allow all on Payment" ON "Payment" FOR ALL USING (true) WITH CHECK (true);
  END IF;
  -- Subscription
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'Subscription' AND policyname = 'Allow all on Subscription') THEN
    CREATE POLICY "Allow all on Subscription" ON "Subscription" FOR ALL USING (true) WITH CHECK (true);
  END IF;
  -- SponsoredListing
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'SponsoredListing' AND policyname = 'Allow all on SponsoredListing') THEN
    CREATE POLICY "Allow all on SponsoredListing" ON "SponsoredListing" FOR ALL USING (true) WITH CHECK (true);
  END IF;
  -- Conversation
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'Conversation' AND policyname = 'Allow all on Conversation') THEN
    CREATE POLICY "Allow all on Conversation" ON "Conversation" FOR ALL USING (true) WITH CHECK (true);
  END IF;
  -- PlatformRevenue
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'PlatformRevenue' AND policyname = 'Allow all on PlatformRevenue') THEN
    CREATE POLICY "Allow all on PlatformRevenue" ON "PlatformRevenue" FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- =============================================================
-- PART 6: INDEXES
-- =============================================================

CREATE INDEX IF NOT EXISTS "idx_product_seller" ON "Product"("sellerId");
CREATE INDEX IF NOT EXISTS "idx_product_category" ON "Product"("category");
CREATE INDEX IF NOT EXISTS "idx_product_state" ON "Product"("state");
CREATE INDEX IF NOT EXISTS "idx_product_stockAvailable" ON "Product"("stockAvailable") WHERE "stockAvailable" > 0;
CREATE INDEX IF NOT EXISTS "idx_product_sponsored" ON "Product"("isSponsored") WHERE "isSponsored" = TRUE;
CREATE INDEX IF NOT EXISTS "idx_order_buyer" ON "Order"("buyerId");
CREATE INDEX IF NOT EXISTS "idx_order_seller" ON "Order"("sellerId");
CREATE INDEX IF NOT EXISTS "idx_shipment_transporter" ON "Shipment"("transporterId");
CREATE INDEX IF NOT EXISTS "idx_shipment_status" ON "Shipment"("status");
CREATE INDEX IF NOT EXISTS "idx_shipment_createdBy" ON "Shipment"("createdBy");
CREATE INDEX IF NOT EXISTS "idx_shipment_pickupDeadline" ON "Shipment"("pickupDeadline") WHERE "pickupDeadline" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_shipment_isExternal" ON "Shipment"("isExternal") WHERE "isExternal" = TRUE;
CREATE INDEX IF NOT EXISTS "idx_message_sender" ON "Message"("senderId");
CREATE INDEX IF NOT EXISTS "idx_message_receiver" ON "Message"("receiverId");
CREATE INDEX IF NOT EXISTS "idx_message_orderId" ON "Message"("orderId") WHERE "orderId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_message_shipmentId" ON "Message"("shipmentId") WHERE "shipmentId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_message_chatType" ON "Message"("chatType");
CREATE INDEX IF NOT EXISTS "idx_message_conversationId" ON "Message"("conversationId") WHERE "conversationId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_review_target" ON "Review"("targetId");
CREATE INDEX IF NOT EXISTS "idx_review_productId" ON "Review"("productId") WHERE "productId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_review_orderId" ON "Review"("orderId") WHERE "orderId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_review_type" ON "Review"("reviewType");
CREATE INDEX IF NOT EXISTS "idx_user_role" ON "User"("role");
CREATE INDEX IF NOT EXISTS "idx_user_email" ON "User"("email");
CREATE INDEX IF NOT EXISTS "idx_user_sponsored" ON "User"("isSponsored") WHERE "isSponsored" = TRUE;
CREATE INDEX IF NOT EXISTS "idx_user_subscription" ON "User"("subscriptionTier") WHERE "subscriptionTier" != 'free';
CREATE INDEX IF NOT EXISTS "idx_user_suspended" ON "User"("isSuspended") WHERE "isSuspended" = TRUE;
CREATE INDEX IF NOT EXISTS "idx_warning_transporter" ON "TransporterWarning"("transporterId");
CREATE INDEX IF NOT EXISTS "idx_warning_type" ON "TransporterWarning"("warningType");
CREATE INDEX IF NOT EXISTS "idx_warning_severity" ON "TransporterWarning"("severity");
CREATE INDEX IF NOT EXISTS "idx_warning_resolved" ON "TransporterWarning"("isResolved") WHERE "isResolved" = FALSE;
CREATE INDEX IF NOT EXISTS "idx_payment_orderId" ON "Payment"("orderId");
CREATE INDEX IF NOT EXISTS "idx_payment_status" ON "Payment"("status");
CREATE INDEX IF NOT EXISTS "idx_payment_type" ON "Payment"("paymentType");
CREATE INDEX IF NOT EXISTS "idx_subscription_userId" ON "Subscription"("userId");
CREATE INDEX IF NOT EXISTS "idx_subscription_status" ON "Subscription"("status");
CREATE INDEX IF NOT EXISTS "idx_subscription_expiresAt" ON "Subscription"("expiresAt");
CREATE INDEX IF NOT EXISTS "idx_sponsored_userId" ON "SponsoredListing"("userId");
CREATE INDEX IF NOT EXISTS "idx_sponsored_productId" ON "SponsoredListing"("productId") WHERE "productId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_sponsored_status" ON "SponsoredListing"("status");
CREATE INDEX IF NOT EXISTS "idx_conversation_participants" ON "Conversation"("participant1Id", "participant2Id");
CREATE INDEX IF NOT EXISTS "idx_conversation_orderId" ON "Conversation"("orderId") WHERE "orderId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_conversation_shipmentId" ON "Conversation"("shipmentId") WHERE "shipmentId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_conversation_lastMessage" ON "Conversation"("lastMessageAt");
CREATE INDEX IF NOT EXISTS "idx_revenue_type" ON "PlatformRevenue"("type");
CREATE INDEX IF NOT EXISTS "idx_revenue_userId" ON "PlatformRevenue"("userId");
CREATE INDEX IF NOT EXISTS "idx_revenue_recordedAt" ON "PlatformRevenue"("recordedAt");

-- =============================================================
-- PART 7: TRIGGERS & FUNCTIONS
-- Note: Using unique dollar-quote tags ($fn1$, $fn2$, etc.)
-- instead of $$ to avoid delimiter confusion in Supabase SQL Editor
-- =============================================================

-- Inventory trigger
CREATE OR REPLACE FUNCTION update_product_stock_reserved()
RETURNS TRIGGER AS $fn1$
DECLARE v_product_id TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN v_product_id := NEW."productId";
  ELSIF TG_OP = 'UPDATE' THEN
    v_product_id := NEW."productId";
    IF OLD."productId" IS DISTINCT FROM NEW."productId" THEN
      UPDATE "Product" SET "stockReserved" = COALESCE((SELECT SUM("quantity") FROM "Order" WHERE "productId" = OLD."productId" AND status NOT IN ('cancelled','delivered','disputed')),0), "reservedUpdatedAt" = NOW() WHERE "id" = OLD."productId";
    END IF;
  ELSIF TG_OP = 'DELETE' THEN v_product_id := OLD."productId";
  END IF;
  UPDATE "Product" SET "stockReserved" = COALESCE((SELECT SUM("quantity") FROM "Order" WHERE "productId" = v_product_id AND status NOT IN ('cancelled','delivered','disputed')),0), "reservedUpdatedAt" = NOW() WHERE "id" = v_product_id;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$fn1$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_order_stock_update ON "Order";
CREATE TRIGGER trigger_order_stock_update AFTER INSERT OR UPDATE OF "productId","quantity","status" OR DELETE ON "Order" FOR EACH ROW EXECUTE FUNCTION update_product_stock_reserved();

-- Pickup deadline trigger
CREATE OR REPLACE FUNCTION set_pickup_deadline()
RETURNS TRIGGER AS $fn2$
BEGIN
  IF NEW."transporterId" IS NOT NULL AND (OLD."transporterId" IS NULL OR TG_OP = 'INSERT') THEN
    NEW."assignedAt" := NOW();
    NEW."pickupDeadline" := NOW() + INTERVAL '24 hours';
    UPDATE "User" SET "lastShipmentAssignedAt" = NOW() WHERE "id" = NEW."transporterId";
  END IF;
  IF NEW."status" = 'picked_up' AND (OLD."status" IS NULL OR OLD."status" != 'picked_up') THEN
    NEW."pickupConfirmedAt" := NOW();
  END IF;
  RETURN NEW;
END;
$fn2$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_pickup_deadline ON "Shipment";
CREATE TRIGGER trigger_set_pickup_deadline BEFORE INSERT OR UPDATE OF "transporterId","status" ON "Shipment" FOR EACH ROW EXECUTE FUNCTION set_pickup_deadline();

-- Auto-cancel expired shipments
CREATE OR REPLACE FUNCTION auto_cancel_expired_shipments()
RETURNS INTEGER AS $fn3$
DECLARE cancelled_count INTEGER := 0; rec RECORD;
BEGIN
  FOR rec IN SELECT s."id", s."transporterId", s."orderId" FROM "Shipment" s WHERE s."pickupDeadline" IS NOT NULL AND s."pickupDeadline" < NOW() AND s."status" IN ('assigned','pending') AND s."autoCancelledAt" IS NULL LOOP
    UPDATE "Shipment" SET "status"='cancelled',"autoCancelledAt"=NOW() WHERE "id"=rec."id";
    INSERT INTO "TransporterWarning" ("transporterId","shipmentId","orderId","warningType","severity","message") VALUES (rec."transporterId",rec."id",rec."orderId",'pickup_missed','critical','24-hour pickup deadline exceeded');
    UPDATE "User" SET "warningCount"="warningCount"+1,"lastWarningAt"=NOW(),"totalFailedShipments"="totalFailedShipments"+1,"consecutiveFailures"="consecutiveFailures"+1 WHERE "id"=rec."transporterId";
    UPDATE "User" SET "isSuspended"=TRUE,"suspendedAt"=NOW(),"suspensionReason"='3+ consecutive failures' WHERE "id"=rec."transporterId" AND "consecutiveFailures">=3;
    cancelled_count := cancelled_count + 1;
  END LOOP;
  RETURN cancelled_count;
END;
$fn3$ LANGUAGE plpgsql;

-- Transporter stats on delivery
CREATE OR REPLACE FUNCTION update_transporter_stats_on_delivery()
RETURNS TRIGGER AS $fn4$
BEGIN
  IF NEW."status"='delivered' AND (OLD."status" IS NULL OR OLD."status"!='delivered') THEN
    UPDATE "User" SET "totalCompletedShipments"="totalCompletedShipments"+1,"consecutiveFailures"=0,"pickupSuccessRate"=CASE WHEN ("totalCompletedShipments"+"totalFailedShipments"+1)=0 THEN 100 ELSE ROUND(("totalCompletedShipments"+1)::NUMERIC/("totalCompletedShipments"+"totalFailedShipments"+1)*100,2) END,"deliverySuccessRate"=CASE WHEN ("totalCompletedShipments"+"totalFailedShipments"+1)=0 THEN 100 ELSE ROUND(("totalCompletedShipments"+1)::NUMERIC/("totalCompletedShipments"+"totalFailedShipments"+1)*100,2) END WHERE "id"=NEW."transporterId";
  END IF;
  RETURN NEW;
END;
$fn4$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_transporter_stats ON "Shipment";
CREATE TRIGGER trigger_update_transporter_stats AFTER UPDATE OF "status" ON "Shipment" FOR EACH ROW EXECUTE FUNCTION update_transporter_stats_on_delivery();

-- Conversation upsert
CREATE OR REPLACE FUNCTION get_or_create_conversation(p1 TEXT, p2 TEXT, p_type TEXT, p_order_id TEXT DEFAULT NULL, p_shipment_id TEXT DEFAULT NULL)
RETURNS TEXT AS $fn5$
DECLARE v_conversation_id TEXT;
BEGIN
  SELECT "id" INTO v_conversation_id FROM "Conversation" WHERE ("participant1Id"=p1 AND "participant2Id"=p2 OR "participant1Id"=p2 AND "participant2Id"=p1) AND ("orderId"=p_order_id OR (p_order_id IS NULL AND "orderId" IS NULL)) AND ("shipmentId"=p_shipment_id OR (p_shipment_id IS NULL AND "shipmentId" IS NULL)) AND "isActive"=TRUE LIMIT 1;
  IF v_conversation_id IS NULL THEN INSERT INTO "Conversation" ("participant1Id","participant2Id","type","orderId","shipmentId") VALUES (p1,p2,p_type,p_order_id,p_shipment_id) RETURNING "id" INTO v_conversation_id; END IF;
  RETURN v_conversation_id;
END;
$fn5$ LANGUAGE plpgsql;

-- Update conversation on message
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $fn6$
BEGIN
  IF NEW."conversationId" IS NOT NULL THEN
    UPDATE "Conversation" SET "lastMessageAt"=NEW."createdAt","lastMessageContent"=NEW."content","lastMessageSenderId"=NEW."senderId","unreadCount1"=CASE WHEN "participant1Id"=NEW."receiverId" THEN "unreadCount1"+1 ELSE "unreadCount1" END,"unreadCount2"=CASE WHEN "participant2Id"=NEW."receiverId" THEN "unreadCount2"+1 ELSE "unreadCount2" END,"updatedAt"=NOW() WHERE "id"=NEW."conversationId";
  END IF;
  RETURN NEW;
END;
$fn6$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_conversation_on_message ON "Message";
CREATE TRIGGER trigger_update_conversation_on_message AFTER INSERT ON "Message" FOR EACH ROW EXECUTE FUNCTION update_conversation_on_message();

-- Record platform revenue helper
CREATE OR REPLACE FUNCTION record_platform_revenue(p_type TEXT, p_amount NUMERIC, p_order_id TEXT DEFAULT NULL, p_shipment_id TEXT DEFAULT NULL, p_user_id TEXT DEFAULT NULL, p_description TEXT DEFAULT NULL, p_percentage NUMERIC DEFAULT NULL, p_base_amount NUMERIC DEFAULT NULL)
RETURNS TEXT AS $fn7$
DECLARE v_revenue_id TEXT;
BEGIN
  INSERT INTO "PlatformRevenue" ("type","amount","orderId","shipmentId","userId","description","percentage","baseAmount") VALUES (p_type,p_amount,p_order_id,p_shipment_id,p_user_id,p_description,p_percentage,p_base_amount) RETURNING "id" INTO v_revenue_id;
  RETURN v_revenue_id;
END;
$fn7$ LANGUAGE plpgsql;

-- Expire subscriptions/listings
CREATE OR REPLACE FUNCTION expire_subscriptions_and_listings()
RETURNS INTEGER AS $fn8$
DECLARE v_count INTEGER := 0;
BEGIN
  UPDATE "Subscription" SET "status"='expired',"updatedAt"=NOW() WHERE "status"='active' AND "expiresAt"<NOW();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  UPDATE "User" u SET "subscriptionTier"='free',"subscriptionExpiry"=NULL,"subscriptionAmount"=0 WHERE u."subscriptionTier"!='free' AND NOT EXISTS (SELECT 1 FROM "Subscription" s WHERE s."userId"=u."id" AND s."status"='active' AND s."expiresAt">=NOW());
  UPDATE "SponsoredListing" SET "status"='expired',"updatedAt"=NOW() WHERE "status"='active' AND "expiresAt"<NOW();
  UPDATE "Product" SET "isSponsored"=FALSE,"sponsoredExpiry"=NULL WHERE "isSponsored"=TRUE AND "sponsoredExpiry"<NOW();
  UPDATE "User" SET "isSponsored"=FALSE,"sponsoredExpiry"=NULL WHERE "isSponsored"=TRUE AND "sponsoredExpiry"<NOW();
  RETURN v_count;
END;
$fn8$ LANGUAGE plpgsql;

-- =============================================================
-- PART 8: VIEWS
-- =============================================================

CREATE OR REPLACE VIEW "OrderBreakdown" AS
SELECT o."id" AS order_id, o."buyerId", o."sellerId", o."productId", o."quantity", o."unitPrice", o."productSubtotal", o."transportEstimate", o."transportBookingFee", o."platformCommission", o."escrowFee", o."totalWithCharges", o."advanceAmount", o."remainingAmount", o."paymentStatus", o."status" AS order_status, p."name" AS product_name, p."unit" AS product_unit, ub."name" AS buyer_name, us."name" AS seller_name
FROM "Order" o LEFT JOIN "Product" p ON p."id"=o."productId" LEFT JOIN "User" ub ON ub."id"=o."buyerId" LEFT JOIN "User" us ON us."id"=o."sellerId";

CREATE OR REPLACE VIEW "TransporterPerformance" AS
SELECT u."id" AS transporter_id, u."name", u."companyName", u."phone", u."pickupSuccessRate", u."deliverySuccessRate", u."avgResponseTimeHours", u."warningCount", u."totalCompletedShipments", u."totalFailedShipments", u."consecutiveFailures", u."isSuspended", u."avgRating", u."totalReviews", u."subscriptionTier"
FROM "User" u WHERE u."role"='transporter';

CREATE OR REPLACE VIEW "RevenueSummary" AS
SELECT "type" AS revenue_type, COUNT(*) AS transaction_count, SUM("amount") AS total_amount, AVG("amount") AS avg_amount, MIN("amount") AS min_amount, MAX("amount") AS max_amount, DATE_TRUNC('day',"recordedAt") AS revenue_date FROM "PlatformRevenue" GROUP BY "type", DATE_TRUNC('day',"recordedAt");

CREATE OR REPLACE VIEW "ProductWithStock" AS
SELECT p.*, (p."quantity"-p."stockReserved") AS "calculatedAvailable", u."name" AS seller_name, u."companyName" AS seller_company, u."farmName" AS seller_farm, u."avgRating" AS seller_rating, u."subscriptionTier" AS seller_tier, u."isSponsored" AS seller_sponsored
FROM "Product" p LEFT JOIN "User" u ON u."id"=p."sellerId" WHERE p."isActive"=TRUE;

-- =============================================================
-- PART 9: GRANT PERMISSIONS
-- =============================================================

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- =============================================================
-- PART 10: STORAGE BUCKET
-- =============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('agrilink-images', 'agrilink-images', true, 5242880)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Public read agrilink-images') THEN
    CREATE POLICY "Public read agrilink-images" ON storage.objects FOR SELECT USING (bucket_id = 'agrilink-images');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Anon upload agrilink-images') THEN
    CREATE POLICY "Anon upload agrilink-images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'agrilink-images');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Allow updates agrilink-images') THEN
    CREATE POLICY "Allow updates agrilink-images" ON storage.objects FOR UPDATE USING (bucket_id = 'agrilink-images');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Allow deletes agrilink-images') THEN
    CREATE POLICY "Allow deletes agrilink-images" ON storage.objects FOR DELETE USING (bucket_id = 'agrilink-images');
  END IF;
END $$;

-- =============================================================
-- DONE! AgroBridge complete database is ready.
-- 15 tables, 6 triggers, 7 functions, 4 views, storage bucket.
-- =============================================================
