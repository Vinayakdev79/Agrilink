---
Task ID: 1
Agent: Foundation Agent
Task: Implement FOUNDATION changes for AgriLink major features (infrastructure only, no UI changes)

Work Log:
- Read existing project files: worklog.md, store.ts, all API routes, supabase-setup.sql, supabase-server.ts
- Analyzed existing schema to identify which columns already exist vs need to be added
- Created supabase-storage-setup.sql with storage bucket, RLS policies, and safe ALTER TABLE statements
- Updated Zustand store with CartItem interface, cart state, and cart action implementations
- Added avatarUrl, bannerUrl, address, gstNumber fields to AppUser interface
- Created /api/upload route for Supabase Storage file uploads (with type/size validation)
- Updated /api/products POST handler with 11 new fields (imageUrl, images, cropVariety, harvestDate, freshness, isOrganic, pesticidesUsed, moistureContent, shelfLife, storageCondition, certifications)
- Updated /api/shipments POST handler with budgetMin, budgetMax fields
- Updated /api/users PATCH handler with 8 new fields (avatarUrl, bannerUrl, address, farmName, farmSize, farmLocation, yearsExperience, certifications)
- Updated /api/reviews GET to support productId param and include product relation in select
- Updated /api/reviews POST to accept optional productId field
- All modified files pass ESLint with no errors
- Dev server running without errors

Files Created:
1. /home/z/my-project/supabase-storage-setup.sql - Storage bucket + RLS + ALTER TABLE statements
2. /home/z/my-project/src/app/api/upload/route.ts - File upload API route

Files Modified:
1. /home/z/my-project/src/lib/store.ts - Added CartItem, cart state/actions, AppUser new fields
2. /home/z/my-project/src/app/api/products/route.ts - POST handler expanded with product detail fields
3. /home/z/my-project/src/app/api/shipments/route.ts - POST handler expanded with budget fields
4. /home/z/my-project/src/app/api/users/route.ts - PATCH handler expanded with profile/farm fields
5. /home/z/my-project/src/app/api/reviews/route.ts - GET/POST support for productId

Schema Analysis (columns that already existed in supabase-setup.sql):
- Product: All 11 new fields already existed (imageUrl, images, cropVariety, harvestDate, freshness, isOrganic, pesticidesUsed, moistureContent, shelfLife, storageCondition, certifications)
- User: Most fields already existed (address, gstNumber, farmName, farmSize, farmLocation, yearsExperience, certifications). NEW: avatarUrl, bannerUrl
- Shipment: NEW: budgetMin, budgetMax
- Review: NEW: productId
