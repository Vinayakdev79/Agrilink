-- =====================================================
-- AgriLink - Supabase Database & Storage Updates
-- Run this SQL in your Supabase SQL Editor
-- =====================================================

-- 1. Add delivery address columns to Order table
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "deliveryAddress" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "deliveryCity" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "deliveryState" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "deliveryPincode" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "deliveryLat" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "deliveryLng" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "deliveryFullAddress" TEXT;

-- 2. Add payment fields to Order table
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentStatus" TEXT DEFAULT 'advance_paid';
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "advanceAmount" FLOAT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "remainingAmount" FLOAT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "platformFee" FLOAT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "remainingPaidAt" TIMESTAMPTZ;

-- 3. Add avatarUrl and bannerUrl columns to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bannerUrl" TEXT;

-- 4. Add productId to Review table for product-specific reviews
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "productId" TEXT REFERENCES "Product"("id");

-- 5. Add assignedAt and pickupDeadline to Shipment table
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "assignedAt" TIMESTAMPTZ;
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "pickupDeadline" TIMESTAMPTZ;

-- 6. Add external transporter fields to Shipment table
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "isExternal" BOOLEAN DEFAULT false;
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "externalTransporterName" TEXT;
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "externalCompanyName" TEXT;
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "externalDriverName" TEXT;
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "externalVehicleNumber" TEXT;
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "externalMobileNumber" TEXT;
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "externalPickupDate" TIMESTAMPTZ;
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "externalDeliveryDate" TIMESTAMPTZ;

-- 7. Create PlatformRevenue table
CREATE TABLE IF NOT EXISTS "PlatformRevenue" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "orderId" TEXT REFERENCES "Order"("id"),
  "type" TEXT NOT NULL,
  "amount" FLOAT NOT NULL,
  "userId" TEXT REFERENCES "User"("id"),
  "description" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Enable RLS on PlatformRevenue
ALTER TABLE "PlatformRevenue" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on PlatformRevenue" ON "PlatformRevenue" FOR ALL USING (true) WITH CHECK (true);

-- 9. Migrate existing avatar data to avatarUrl
UPDATE "User" SET "avatarUrl" = "avatar" WHERE "avatar" IS NOT NULL AND "avatarUrl" IS NULL;

-- =====================================================
-- STORAGE BUCKET SETUP
-- Run this in the Supabase Dashboard > Storage
-- OR use the SQL below:
-- =====================================================

-- Insert the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('agrilink-images', 'agrilink-images', true, 5242880)
ON CONFLICT (id) DO NOTHING;

-- Allow public reads from the bucket
CREATE POLICY "Public read access" ON storage.objects
  FOR SELECT USING (bucket_id = 'agrilink-images');

-- Allow authenticated uploads
CREATE POLICY "Authenticated uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'agrilink-images' AND auth.role() = 'authenticated');

-- Allow anon uploads (for development - tighten in production)
CREATE POLICY "Anon uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'agrilink-images');

-- Allow updates
CREATE POLICY "Allow updates" ON storage.objects
  FOR UPDATE USING (bucket_id = 'agrilink-images');

-- Allow deletes
CREATE POLICY "Allow deletes" ON storage.objects
  FOR DELETE USING (bucket_id = 'agrilink-images');

-- 10. Add subscription and sponsored fields to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "subscriptionTier" TEXT DEFAULT 'free';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "subscriptionExpiry" TIMESTAMPTZ;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "subscriptionAmount" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isSponsored" BOOLEAN DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "sponsoredExpiry" TIMESTAMPTZ;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "sponsoredAmount" FLOAT;

-- =====================================================
-- DONE! Your AgriLink database is fully updated.
-- =====================================================
