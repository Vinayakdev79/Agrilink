# Task 5-a: Cart Panel Map Integration

## Summary
Updated `/home/z/my-project/src/components/agrilink/cart-panel.tsx` to integrate the MapPicker component in the CheckoutDialog's delivery address section.

## Changes Made

1. **Removed unused import**: Removed `Map` from `lucide-react` imports (it was only used in the placeholder).

2. **Added MapPicker import**: Added `import { MapPicker } from '@/components/agrilink/map-picker'`.

3. **Added state variables** in `CheckoutDialog`:
   - `deliveryLat` - stores selected latitude
   - `deliveryLng` - stores selected longitude
   - `mapAddress` - stores the full reverse-geocoded address

4. **Replaced Map Placeholder** with actual `<MapPicker>` component:
   - Uses `deliveryLat`, `deliveryLng`, `mapAddress` as props
   - `onLocationSelect` callback auto-fills address fields (addressLine1, city, state) from map selection
   - Red marker color (`#ef4444`), 220px height, labeled "Delivery Location"

5. **Enhanced order POST body** in `handlePlaceOrder`:
   - Added `deliveryAddress` (combined addressLine1 + addressLine2)
   - Added `deliveryCity`, `deliveryState`, `deliveryPincode`
   - Added `deliveryLat`, `deliveryLng` (optional, only if map was used)
   - Added `deliveryFullAddress` (full map reverse-geocoded address, optional)

## Verification
- Ran `bun run lint` - no new errors introduced in cart-panel.tsx
- All existing functionality preserved (manual address fields remain intact)
- Map is an addition, not a replacement
