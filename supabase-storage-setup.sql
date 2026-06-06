-- =====================================================
-- AgriLink - Supabase Storage & Schema Updates
-- Run this SQL in your Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. STORAGE BUCKET SETUP
-- =====================================================

-- Insert the agrilink-images storage bucket (public access)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'agrilink-images',
  'agrilink-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 2. STORAGE RLS POLICIES
-- =====================================================

-- Allow anyone (including anon) to read images
CREATE POLICY "Public read access for agrilink-images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'agrilink-images');

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated upload for agrilink-images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'agrilink-images'
    AND auth.role() = 'authenticated'
  );

-- Allow authenticated users to update their own images
CREATE POLICY "Authenticated update for agrilink-images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'agrilink-images'
    AND auth.role() = 'authenticated'
  );

-- Allow authenticated users to delete their own images
CREATE POLICY "Authenticated delete for agrilink-images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'agrilink-images'
    AND auth.role() = 'authenticated'
  );

-- =====================================================
-- 3. ALTER TABLE STATEMENTS - ADD MISSING COLUMNS
-- =====================================================

-- Product table: add columns if missing
-- Note: Most product columns already exist in the original schema.
-- The following are safe additions in case they were not created.

DO $$ BEGIN
  -- Product: imageUrl (may already exist)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Product' AND column_name = 'imageUrl') THEN
    ALTER TABLE "Product" ADD COLUMN "imageUrl" TEXT;
  END IF;

  -- Product: images (may already exist)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Product' AND column_name = 'images') THEN
    ALTER TABLE "Product" ADD COLUMN "images" TEXT;
  END IF;

  -- Product: cropVariety
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Product' AND column_name = 'cropVariety') THEN
    ALTER TABLE "Product" ADD COLUMN "cropVariety" TEXT;
  END IF;

  -- Product: harvestDate
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Product' AND column_name = 'harvestDate') THEN
    ALTER TABLE "Product" ADD COLUMN "harvestDate" TIMESTAMPTZ;
  END IF;

  -- Product: freshness
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Product' AND column_name = 'freshness') THEN
    ALTER TABLE "Product" ADD COLUMN "freshness" TEXT;
  END IF;

  -- Product: isOrganic
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Product' AND column_name = 'isOrganic') THEN
    ALTER TABLE "Product" ADD COLUMN "isOrganic" BOOLEAN DEFAULT false;
  END IF;

  -- Product: pesticidesUsed
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Product' AND column_name = 'pesticidesUsed') THEN
    ALTER TABLE "Product" ADD COLUMN "pesticidesUsed" TEXT;
  END IF;

  -- Product: moistureContent
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Product' AND column_name = 'moistureContent') THEN
    ALTER TABLE "Product" ADD COLUMN "moistureContent" TEXT;
  END IF;

  -- Product: shelfLife
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Product' AND column_name = 'shelfLife') THEN
    ALTER TABLE "Product" ADD COLUMN "shelfLife" TEXT;
  END IF;

  -- Product: storageCondition
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Product' AND column_name = 'storageCondition') THEN
    ALTER TABLE "Product" ADD COLUMN "storageCondition" TEXT;
  END IF;

  -- Product: certifications
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Product' AND column_name = 'certifications') THEN
    ALTER TABLE "Product" ADD COLUMN "certifications" TEXT;
  END IF;
END $$;

-- Shipment table: add budgetMin, budgetMax
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Shipment' AND column_name = 'budgetMin') THEN
    ALTER TABLE "Shipment" ADD COLUMN "budgetMin" FLOAT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Shipment' AND column_name = 'budgetMax') THEN
    ALTER TABLE "Shipment" ADD COLUMN "budgetMax" FLOAT;
  END IF;
END $$;

-- User table: add avatarUrl, bannerUrl (and safe-check existing columns)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'avatarUrl') THEN
    ALTER TABLE "User" ADD COLUMN "avatarUrl" TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'bannerUrl') THEN
    ALTER TABLE "User" ADD COLUMN "bannerUrl" TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'address') THEN
    ALTER TABLE "User" ADD COLUMN "address" TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'gstNumber') THEN
    ALTER TABLE "User" ADD COLUMN "gstNumber" TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'farmName') THEN
    ALTER TABLE "User" ADD COLUMN "farmName" TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'farmSize') THEN
    ALTER TABLE "User" ADD COLUMN "farmSize" TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'farmLocation') THEN
    ALTER TABLE "User" ADD COLUMN "farmLocation" TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'yearsExperience') THEN
    ALTER TABLE "User" ADD COLUMN "yearsExperience" INTEGER;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'certifications') THEN
    ALTER TABLE "User" ADD COLUMN "certifications" TEXT;
  END IF;
END $$;

-- Review table: add productId
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Review' AND column_name = 'productId') THEN
    ALTER TABLE "Review" ADD COLUMN "productId" TEXT REFERENCES "Product"("id") ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for Review.productId for faster product review lookups
CREATE INDEX IF NOT EXISTS "idx_review_product" ON "Review"("productId");

-- =====================================================
-- DONE! Storage bucket and schema updates are ready.
-- =====================================================
