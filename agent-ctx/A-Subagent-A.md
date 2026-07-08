# Task A — Subagent A: Producer Dashboard Enhancements

## Task
Wire the producer dashboard UI to the new V4 backend APIs:
- Delivery handling section in Add Listing form (platform / self / local transporter)
- Delete listing button + confirmation dialog
- Delivery info badges on listing cards
- Hide Create Shipment when producer handles delivery + show producer-driven status buttons (Mark Shipped / Mark Delivered)
- Assign Local Transporter dialog + Reassign + Local Transporter section on order card
- Total Deals stat card on Overview tab
- Platform Fee label fix on Orders tab

## Work Log
- Added imports: `Trash2`, `UserPlus` (lucide-react) and `AlertDialog*` family from `@/components/ui/alert-dialog`
- `AddListingForm`: Added "Delivery Options" section after "Pricing & Quantity" — 3-way radio toggle (Platform Transport / I Will Handle / Local Transporter). When `self` or `local` is selected, a sub-card shows a Free Delivery Switch and a Delivery Fee (₹) Input. When Free Delivery is on, the fee input is disabled and visually shows 0.
- Initialized `formData` (both `useState` default and `resetFormData`) with `deliveryOption: 'platform'`, `deliveryFee: ''`, `freeDelivery: false`.
- Updated `handleAddListing` to compute and send `deliveryHandledByProducer`, `freeDelivery`, `deliveryFee` (0 when free) to `POST /api/products`.
- Added new `AssignLocalTransporterDialogContent` component (Name / Phone / Vehicle Number, all required). Submits `PATCH /api/orders` with `{ orderId, deliveryType: 'local', localTransporterName, localTransporterPhone, localTransporterVehicle, statusUpdatedBy: user.id }`. Auto-detects Reassign mode when `order.localTransporterName` already exists.
- Added new state + handlers inside `ProducerDashboard`:
  - `deleteListingId` + `handleDeleteListing(productId)` — `DELETE /api/products?productId=…&sellerId=…`, toast + `fetchData()` refresh
  - `handleMarkOrderStatus(orderId, status)` — `PATCH /api/orders` with `{ orderId, status, statusUpdatedBy: user.id }`
  - `assignLocalOpen` / `selectedOrderForLocal` / `localSubmitting` + `openAssignLocalTransporter` + `handleAssignLocalTransporter`
  - `renderAssignLocalTransporterDialog()` helper rendered inside Orders tab
- Overview tab: replaced "Total Orders" stat card with "Total Deals" using `(user as Record<string, any>)?.totalDeals || 0` (cast needed because AppUser interface in `@/lib/store` doesn't expose `totalDeals` — and we cannot modify other files per task constraint). Removed now-unused `totalOrders` const.
- Listings tab: 
  - Added a flex-wrap badges row (Organic + 🚚 Producer Delivery + FREE DELIVERY + Delivery: ₹X) on each product card
  - Replaced the single "View Details" button with a flex row containing "View Details" + a red "Delete" button (Trash2 icon)
  - Added a global `AlertDialog` at the end of the listings tab for delete confirmation with the required message
- Orders tab:
  - Changed "Platform Fee (2%)" → "Platform Fee" and simplified `platformFee = order.platformFee || 0` (removed 2% fallback)
  - Updated Create Shipment condition to also require `!order.product?.deliveryHandledByProducer`
  - Added "Producer-Handled Delivery" section (when `deliveryHandledByProducer && deliveryType !== 'local'` and status is confirmed/shipped): shows 🚚 badge + "Assign Local Transporter" button (UserPlus) + "Mark as Shipped" / "Mark as Delivered" depending on status
  - Added "Local Transporter" section (when `deliveryType === 'local' && localTransporterName`): shows Name, click-to-call Phone link, Vehicle + Reassign button + Mark Shipped/Delivered + a producer-managed note
  - Rendered `renderAssignLocalTransporterDialog()` at the bottom of Orders tab
- Shipments tab top "Create Shipment" button: also skips producer-handled orders for consistency

## Stage Summary
- All 7 required changes wired into `producer-dashboard.tsx` only
- ESLint: 0 errors / 0 warnings on the file
- TypeScript: 0 errors on the file (`-p tsconfig.json` clean)
- No other files touched
- Backend already exposes: `POST /api/products` (delivery fields), `DELETE /api/products`, `PATCH /api/orders` (status + local transporter fields), `totalDeals` on user — all wired correctly
- Note for main agent / DB: dev.log shows `column Product_1.deliveryHandledByProducer does not exist` — V4 Supabase migration may need to be applied. Frontend handles missing data gracefully via optional chaining.

## Files Touched
- `/home/z/my-project/src/components/agrilink/producer-dashboard.tsx` (only)
