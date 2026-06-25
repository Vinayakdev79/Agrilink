# Task ID: C — Subagent C

## Task
Wire cart-panel.tsx, marketplace-page.tsx, product-page.tsx to V4 backend — new revenue model (₹1000/>₹10k platform fee), conditional transport booking fee, producer delivery fee, delivery badges.

## Files Modified (only these 3)
- `src/components/agrilink/cart-panel.tsx`
- `src/components/agrilink/marketplace-page.tsx`
- `src/components/agrilink/product-page.tsx`

## Work Log

### cart-panel.tsx
1. **Constants & imports**: Removed `PLATFORM_FEE_RATE = 0.02`. Added `import { computePlatformFee } from '@/lib/razorpay'`. Kept `TRANSPORT_BOOKING_FEE = 30` (now applied only when platform arranges transport). Kept `TRANSPORT_ESTIMATE_RATE = 0.035` for the estimate-only display.
2. **Cart totals (CartPanel)**: 
   - `platformFee = computePlatformFee(subtotal)` (₹1000 if subtotal > ₹10,000 else ₹0)
   - `deliveryFeeTotal = cart.reduce(...)` — sums `item.deliveryFee` only for items with `deliveryHandledByProducer` and not `freeDelivery`
   - `transportBookingFee = cart.some(item => !item.deliveryHandledByProducer) ? TRANSPORT_BOOKING_FEE : 0`
   - `totalPayable = subtotal + platformFee + transportBookingFee + deliveryFeeTotal`
   - Added `allFreeDelivery` derived flag (cart.length > 0 && every item is either platform-arranged or free-delivery producer).
3. **handlePlaceOrder per-item POST body**: Computes `itemPlatformFee = computePlatformFee(itemSubtotal)`, `itemTransportBookingFee = item.deliveryHandledByProducer ? 0 : TRANSPORT_BOOKING_FEE`, `itemDeliveryFee = item.deliveryHandledByProducer && !item.freeDelivery ? (item.deliveryFee || 0) : 0`, derives `itemTotal/itemAdvance/itemRemaining`. Body now includes:
   - `platformFee: itemPlatformFee`
   - `transportBookingFee: itemTransportBookingFee`
   - `totalPayable: itemTotal`
   - `advancePayment: itemAdvance`
   - `remainingPayment: itemRemaining`
   - `deliveryType: item.deliveryHandledByProducer ? 'producer' : 'platform'`
   - `deliveryFee: itemDeliveryFee`
4. **CheckoutDialog**: Extended props with `deliveryFeeTotal` + `allFreeDelivery`. Caller (`<CheckoutDialog />`) passes the new props.
5. **Bill breakdown (both in cart footer and checkout dialog)**:
   - Platform Fee row now shows "(FREE)" suffix + emerald "FREE" value when 0, else "₹{fee}".
   - Transport Booking Fee row shows "(producer handles)" note + "FREE" badge when 0.
   - Added a new "Delivery Fee" row showing FREE / ₹{deliveryFeeTotal} / "—" depending on cart contents.
6. **Per-item delivery badge in cart item card** (below the "Available" row):
   - amber "🚚 FREE DELIVERY" when `deliveryHandledByProducer && freeDelivery`
   - emerald "🚚 Delivery: ₹{fee}" when `deliveryHandledByProducer && !freeDelivery && deliveryFee > 0`
   - emerald "🚚 Producer Delivery" when `deliveryHandledByProducer && !freeDelivery && deliveryFee === 0`
   - sky "🚚 Platform Transport" otherwise

### marketplace-page.tsx
1. Added `Truck` to lucide-react imports.
2. Extended the `Product` interface with optional V4 fields: `deliveryHandledByProducer?`, `deliveryFee?`, `freeDelivery?`.
3. `addToCart({...})` call in `handleAddToCart` now includes:
   - `deliveryHandledByProducer: product.deliveryHandledByProducer || false`
   - `deliveryFee: product.deliveryFee || 0`
   - `freeDelivery: product.freeDelivery || false`
4. Top-left badges overlay on product cards: wrapped row in `flex-wrap`. Added:
   - emerald "🚚 FREE Delivery" when `deliveryHandledByProducer && freeDelivery`
   - teal "🚚 Delivery ₹{fee}" when `deliveryHandledByProducer && !freeDelivery && deliveryFee > 0`

### product-page.tsx
1. Added `import { computePlatformFee } from '@/lib/razorpay'` (Truck was already imported).
2. Extended the local `Product` interface with the V4 delivery fields.
3. Both `addToCart({...})` calls (main product + quick-add for similar/producer products) now include the 3 delivery fields.
4. Added derived values near `totalPrice`:
   - `computedPlatformFee = product ? computePlatformFee(totalPrice) : 0`
   - `producerDeliveryFee = product && product.deliveryHandledByProducer && !product.freeDelivery ? (product.deliveryFee || 0) : 0`
5. **Delivery Estimate card** updated:
   - Platform Fee row now uses `computedPlatformFee`: shows emerald "FREE" with "No fee on orders ≤ ₹10,000" subtext when 0, otherwise "₹{fee}" with "Flat fee on orders > ₹10,000" subtext.
   - Added a new "Delivery Fee" row showing FREE / ₹{producerDeliveryFee} / "Arranged by AgroBridge (₹30 booking fee at checkout)" depending on delivery mode.
6. **New "Delivery Options" card** below the Delivery Estimate card with three states:
   - emerald-highlighted: "🚚 FREE Delivery by Producer"
   - teal-highlighted: "🚚 Delivery by Producer — ₹{fee}"
   - emerald: "🚚 Delivery by Producer" (no fee)
   - sky-highlighted: "🚚 Transport arranged via AgroBridge" (default, when not producer-handled)

## Verification
- `bun run lint`: only 4 pre-existing `no-require-imports` errors in `start-server.js` (not my file). 0 new errors in the 3 files I touched.
- `bunx tsc -p tsconfig.json --noEmit`: only 3 pre-existing framer-motion `Variants` typing errors (verified by `git stash` baseline — same 3 errors existed before my changes, just at slightly different line numbers because I added lines). 0 new errors introduced.

## Stage Summary
- All 3 target files wired to V4 backend revenue model + delivery handling.
- All V4 fields optional-chained so UI renders correctly even if the Supabase V4 migration hasn't been applied yet.
- Cart subtotal/advance/remaining now reflect the new revenue model end-to-end (cart panel → checkout dialog → POST /api/orders body), and the per-item breakdown matches the backend's expected fields.
- Marketplace product cards and product page now surface the producer-handled delivery option before buyers add to cart, and the cart shows the per-item delivery mode so buyers understand the fee breakdown.
