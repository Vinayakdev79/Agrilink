---
Task ID: 0
Agent: Main Agent
Task: Fix internal server error and implement 11 improvements for AgriLink

Work Log:
- Fixed `.env` file: Added missing NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
- Root cause: env vars were missing, causing server-side Supabase client to fall back to `placeholder.supabase.co`
- Created `/api/upload` route: Handles file uploads with Supabase Storage (primary) + local filesystem fallback
- Updated product image URLs in Supabase DB: All 20 products now point to local image files in `/public/images/`
- Fixed Order POST API: Now saves delivery address fields with graceful fallback when DB columns don't exist
- Updated User API: Maps `avatar` <-> `avatarUrl` for frontend compatibility; stores `bannerUrl` in farmImages with `banner:` prefix
- Created `supabase-migration.sql`: SQL script for adding missing columns + creating storage bucket (user must run in Supabase SQL Editor)
- Delegated producer list redesign to subagent (completed)
- Delegated shipment auto-fill improvement to subagent (completed)
- Delegated transporter pickup date feature to subagent (completed)
- Verified app works: Landing page, auth, dashboard, marketplace, product pages, cart all functioning

Stage Summary:
- Internal server error FIXED - was caused by missing Supabase credentials in .env
- Image upload API created with Supabase Storage + local fallback
- Product images now show in marketplace (mapped to local files)
- Cart system with address, detailed bill, transport cost already existed and works
- Reviews already implemented on product page
- Buyer order details already comprehensive
- Producer profile editing already existed with avatar/banner upload
- Product listing form already had all crop detail fields
- Pickup date already shown in producer dashboard
- 3 subagent improvements completed: producers list redesign, shipment auto-fill, transporter pickup date
- App verified working via Agent Browser testing
