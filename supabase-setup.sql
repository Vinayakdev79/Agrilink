-- =====================================================
-- AgriLink - Supabase Database Setup
-- Run this SQL in your Supabase SQL Editor
-- =====================================================

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
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

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

-- 4. ORDER TABLE
CREATE TABLE IF NOT EXISTS "Order" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "buyerId" TEXT NOT NULL REFERENCES "User"("id"),
  "sellerId" TEXT NOT NULL REFERENCES "User"("id"),
  "productId" TEXT NOT NULL REFERENCES "Product"("id"),
  "quantity" FLOAT NOT NULL,
  "unitPrice" FLOAT NOT NULL,
  "totalPrice" FLOAT NOT NULL,
  "status" TEXT DEFAULT 'negotiating',
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 5. SHIPMENT TABLE
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

-- 7. MESSAGE TABLE
CREATE TABLE IF NOT EXISTS "Message" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "senderId" TEXT NOT NULL REFERENCES "User"("id"),
  "receiverId" TEXT NOT NULL REFERENCES "User"("id"),
  "content" TEXT NOT NULL,
  "isRead" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 8. REVIEW TABLE
CREATE TABLE IF NOT EXISTS "Review" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "reviewerId" TEXT NOT NULL REFERENCES "User"("id"),
  "targetId" TEXT NOT NULL REFERENCES "User"("id"),
  "rating" INTEGER NOT NULL,
  "comment" TEXT,
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

-- =====================================================
-- ENABLE ROW LEVEL SECURITY & ALLOW ANON ACCESS
-- =====================================================

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BuyerRequirement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Shipment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TransportBid" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Review" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PlatformStats" ENABLE ROW LEVEL SECURITY;

-- Allow full access for anon and authenticated users
-- (We'll tighten this later with proper auth)
CREATE POLICY "Allow all on User" ON "User" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on Product" ON "Product" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on BuyerRequirement" ON "BuyerRequirement" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on Order" ON "Order" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on Shipment" ON "Shipment" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on TransportBid" ON "TransportBid" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on Message" ON "Message" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on Review" ON "Review" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on PlatformStats" ON "PlatformStats" FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS "idx_product_seller" ON "Product"("sellerId");
CREATE INDEX IF NOT EXISTS "idx_product_category" ON "Product"("category");
CREATE INDEX IF NOT EXISTS "idx_product_state" ON "Product"("state");
CREATE INDEX IF NOT EXISTS "idx_order_buyer" ON "Order"("buyerId");
CREATE INDEX IF NOT EXISTS "idx_order_seller" ON "Order"("sellerId");
CREATE INDEX IF NOT EXISTS "idx_shipment_transporter" ON "Shipment"("transporterId");
CREATE INDEX IF NOT EXISTS "idx_shipment_status" ON "Shipment"("status");
CREATE INDEX IF NOT EXISTS "idx_message_sender" ON "Message"("senderId");
CREATE INDEX IF NOT EXISTS "idx_message_receiver" ON "Message"("receiverId");
CREATE INDEX IF NOT EXISTS "idx_review_target" ON "Review"("targetId");
CREATE INDEX IF NOT EXISTS "idx_user_role" ON "User"("role");
CREATE INDEX IF NOT EXISTS "idx_user_email" ON "User"("email");

-- =====================================================
-- DONE! Your AgriLink database is ready.
-- =====================================================
