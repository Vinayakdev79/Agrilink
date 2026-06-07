-- Add delivery address columns to Order table
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "deliveryAddress" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "deliveryCity" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "deliveryState" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "deliveryPincode" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "deliveryLat" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "deliveryLng" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "deliveryFullAddress" TEXT;

-- Add avatarUrl and bannerUrl to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bannerUrl" TEXT;

-- Add productId to Review table for product-specific reviews
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "productId" TEXT REFERENCES "Product"("id");
