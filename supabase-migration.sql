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

-- 2. Add avatarUrl and bannerUrl columns to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bannerUrl" TEXT;

-- 3. Add productId to Review table for product-specific reviews
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "productId" TEXT REFERENCES "Product"("id");

-- 4. Migrate existing avatar data to avatarUrl
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

-- =====================================================
-- DONE! Your AgriLink database is fully updated.
-- =====================================================
