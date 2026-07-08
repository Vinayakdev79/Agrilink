# Task 5: Add Producer Delivery Options for Product Listings

## Summary
Added three delivery options when creating/editing a product listing: self-delivery, local transporter, and buyer-arranges transport (default). Updated all relevant frontend components and backend APIs.

## Files Changed

### 1. `/home/z/my-project/src/lib/store.ts`
- Added `deliveryType`, `localTransporterName`, `localTransporterPhone`, `localTransporterVehicle` fields to the `CartItem` interface

### 2. `/home/z/my-project/src/components/agrilink/producer-dashboard.tsx`
- **Add Listing Form**: Added local transporter detail inputs (Name, Phone, Vehicle Number) that appear when "Local Transporter" delivery option is selected
- **Form State**: Added `localTransporterName`, `localTransporterPhone`, `localTransporterVehicle` to both `formData` initial state and `resetFormData`
- **handleAddListing**: Now sends `deliveryType` field ('platform', 'producer', or 'local') mapped from the form's `deliveryOption`, plus `localTransporterName/Phone/Vehicle` when delivery option is 'local'

### 3. `/home/z/my-project/src/app/api/products/route.ts`
- **withProductDefaults**: Added defaults for `deliveryType` ('platform'), `localTransporterName` (null), `localTransporterPhone` (null), `localTransporterVehicle` (null)
- **POST handler**: Now accepts `deliveryType`, `localTransporterName`, `localTransporterPhone`, `localTransporterVehicle` and includes them in insert data with fallback
- **PATCH handler**: Now accepts and updates `deliveryType`, `localTransporterName`, `localTransporterPhone`, `localTransporterVehicle`
- **Fallback logic**: Extended retry-without-V4-columns logic to also delete `deliveryType` and local transporter fields

### 4. `/home/z/my-project/src/components/agrilink/marketplace-page.tsx`
- **Product interface**: Added `deliveryType`, `localTransporterName`, `localTransporterPhone`, `localTransporterVehicle` fields
- **addToCart**: Now passes `deliveryType` and local transporter fields to cart store
- **Delivery badges**: Added two new badges:
  - "Producer's Transporter" (amber) when `deliveryType === 'local'`
  - "Delivery by Producer" (emerald) when producer handles but no fee and not local

### 5. `/home/z/my-project/src/components/agrilink/product-page.tsx`
- **Product interface**: Added `deliveryType`, `localTransporterName`, `localTransporterPhone`, `localTransporterVehicle` fields
- **addToCart (both handlers)**: Now passes `deliveryType` and local transporter fields to cart store
- **Delivery Options Card**: Added comprehensive "Producer's Transporter" display when `deliveryType === 'local'`:
  - Amber-themed card with transporter info
  - Shows transporter name, phone (clickable tel: link), vehicle number
  - Shows delivery fee or free delivery label
- **Import**: Added `Phone` from lucide-react for transporter phone display

### 6. `/home/z/my-project/src/components/agrilink/cart-panel.tsx`
- **handlePlaceOrder**: Now passes `deliveryType` (from cart item or derived from `deliveryHandledByProducer`), and `localTransporterName/Phone/Vehicle` when `deliveryType === 'local'`
- **Delivery badge**: Added "Producer's Transporter" badge (amber) for local transporter items, prioritized over the existing producer delivery badges

### 7. `/home/z/my-project/src/components/agrilink/buyer-dashboard.tsx`
- **Verified**: Already correctly hides "Create Shipment" button when `deliveryType` is 'producer' or 'local' (or when `deliveryHandledByProducer` is true). No changes needed.

## Lint Status
- 0 new errors introduced (only pre-existing `start-server.js` require-import errors remain)
- Dev server running cleanly on port 3000
