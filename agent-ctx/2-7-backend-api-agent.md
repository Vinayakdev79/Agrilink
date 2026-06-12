# Task 2-7: Backend API Updates

## Agent: Backend API Agent
## Task ID: 2-7

### Work Completed

#### Task 2: Upload API Route (`/api/upload`)
- Created `src/app/api/upload/route.ts`
- Accepts POST with FormData (file + folder name)
- Validates file type (image/jpeg, image/png, image/webp)
- Validates file size (5MB max)
- Uploads to Supabase Storage bucket `agrilink-images`
- File path: `{folder}/{timestamp}_{originalFilename}`
- Returns public URL and path

#### Task 3: Products API PATCH (`/api/products`)
- Added PATCH handler to `src/app/api/products/route.ts`
- Accepts: `{ productId, quantity, isActive }`
- Updates product quantity (for inventory management) and isActive status
- Returns updated product

#### Task 4: Orders API Updates (`/api/orders`)
- POST (create order):
  - Calculates 2% platform commission on totalPrice
  - Calculates advance amount = 50% of totalPrice
  - Calculates remaining amount = 50% of totalPrice
  - Saves paymentStatus = 'advance_paid', advanceAmount, remainingAmount, platformFee
  - Deducts ordered quantity from Product.quantity
  - Creates PlatformRevenue entry for commission
  - Returns order with payment details
- PATCH (update order status):
  - When status = 'cancelled': restores deducted quantity to Product
  - When status = 'delivered': sets paymentStatus = 'full_paid', remainingPaidAt, updates transporter's totalCompletedShipments
- Graceful fallback when payment/delivery columns don't exist in DB

#### Task 5: Shipments API Updates (`/api/shipments`)
- POST:
  - Supports external transporter fields: isExternal, externalTransporterName, externalCompanyName, externalDriverName, externalVehicleNumber, externalMobileNumber, externalPickupDate, externalDeliveryDate
  - If isExternal is true, transporterId is not required
  - When transporterId provided: sets assignedAt, calculates pickupDeadline (assignedAt + 24 hours)
- PATCH:
  - When status = 'picked_up': updates transporter's totalCompletedShipments
  - Logs warning if > 24hrs since assignedAt without pickup
  - Assigning transporterId for first time: sets assignedAt and pickupDeadline
  - Supports external transporter field updates
- Graceful fallback when new columns don't exist

#### Task 6: Reviews API Updates (`/api/reviews`)
- POST: Accepts optional `productId` field, includes in insert
- GET: Supports filtering by `?productId=xxx`
- Graceful fallback when productId column doesn't exist

#### Task 7: Revenue API (`/api/revenue`)
- Created `src/app/api/revenue/route.ts`
- GET with filters: type, userId, startDate, endDate
- Returns revenue summary: totalRevenue, totalRecords, totalByType, monthlyBreakdown
- Graceful fallback (empty results) when PlatformRevenue table doesn't exist

### Migration SQL Updated
- Updated `supabase-migration.sql` with all new columns and PlatformRevenue table
- Updated `/api/migrate/route.ts` to return current migration SQL
- All new DB features use graceful fallback patterns (try with new fields, retry without)

### Files Modified
- `src/app/api/upload/route.ts` (new)
- `src/app/api/products/route.ts` (updated - added PATCH)
- `src/app/api/orders/route.ts` (updated - commission, payments, status handling)
- `src/app/api/shipments/route.ts` (updated - external transporter, deadlines)
- `src/app/api/reviews/route.ts` (updated - productId support)
- `src/app/api/revenue/route.ts` (new)
- `src/app/api/migrate/route.ts` (updated - new migration SQL)
- `supabase-migration.sql` (updated - new columns and tables)
