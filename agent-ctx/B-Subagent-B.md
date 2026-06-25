# Task B — Subagent B: Buyer Dashboard Razorpay + V4 Delivery Wiring

## Task
Wire `buyer-dashboard.tsx` to the new V4 backend:
1. Replace direct `PATCH /api/orders` Pay Remaining flow with a real Razorpay 3-step flow (create-order → checkout → verify) using the existing `openRazorpayCheckout` helper.
2. Pass `remainingAmount` to `handlePayRemaining`, add a "Secured by Razorpay" tooltip text below the button.
3. Hide the "Create Shipment" button when producer handles delivery (`deliveryHandledByProducer` or `deliveryType` is `'producer'` / `'local'`); show an info banner instead. For `deliveryType === 'local'`, render a Local Transporter details card (Name, click-to-call Phone, Vehicle).
4. Show delivery fee / free delivery info in the `PaymentBreakdown` component.
5. Keep buyer Overview stat cards unchanged (per task description).

## Work Log
- Added imports: `ShieldCheck` from `lucide-react` and `openRazorpayCheckout` from `@/lib/razorpay-client`.
- Rewrote `handlePayRemaining(orderId, amount)`:
  - Step 1 — `POST /api/payments/razorpay/create-order` with `{ type: 'remaining', orderId, amount, userId, description }`; reads `{ orderId, amount (paise), demoMode, keyId }`.
  - Step 2 — `openRazorpayCheckout({ orderId, amount, keyId, demoMode, name, description, prefill, onSuccess, onDismiss })` wrapped in a `Promise<void>` so the outer `try/catch` can react.
  - Step 3 — inside `onSuccess`, `POST /api/payments/razorpay/verify` with `{ type, razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId, userId, amount }`; on success toast + `fetchData()`.
  - `onDismiss` resolves the promise with an info toast (Payment cancelled).
  - `finally` always clears `payingRemaining`.
- Updated the "Pay Remaining ₹…" button `onClick` to `handlePayRemaining(order.id, remainingAmount)` so the actual outstanding 50% amount is sent to Razorpay (previously the function only took the orderId and just flipped the status without charging).
- Added a small "Secured by Razorpay" line with a `ShieldCheck` icon below the Pay Remaining button — works as the demo/production indicator without needing a separate fetch.
- Replaced the single "Create Shipment" condition with two branches:
  - `Create Shipment` button now requires `!order.product?.deliveryHandledByProducer && (!order.deliveryType || order.deliveryType === 'platform')` (preserves prior behaviour for normal platform-transport orders).
  - When `order.product?.deliveryHandledByProducer || order.deliveryType === 'producer' || order.deliveryType === 'local'` (and order is confirmed without a shipment), a green info banner is rendered: "🚚 This order is being delivered by the producer. Shipment creation is not required." For `deliveryType === 'local'`, the message is customised to "🚚 Producer's Local Transporter is handling delivery".
- Added a "Local Transporter Details" card (teal border) shown whenever `order.deliveryType === 'local'` and any of `localTransporterName` / `localTransporterPhone` / `localTransporterVehicle` are present. Shows Name (User icon), Phone as a click-to-call `tel:` link (Phone icon), and Vehicle (Truck icon) in a responsive 1–3 column grid, with an "External · Producer-managed" badge.
- Enhanced `PaymentBreakdown` component:
  - Added `isFreeDelivery = order.freeDelivery || order.product?.freeDelivery` and `deliveryFee = order.deliveryFee || 0`.
  - `total` now includes `+ (isFreeDelivery ? 0 : deliveryFee)` when no `totalPayable` is set, so the breakdown total reflects delivery cost.
  - Added a Delivery Fee row between Transport Booking Fee and Total:
    - If `isFreeDelivery` → `<Badge>FREE</Badge>` (emerald).
    - Else if `deliveryFee > 0` → "₹{deliveryFee}" amount row.
    - Otherwise renders nothing (preserves the original layout for platform-transport orders without a delivery fee).
- Did NOT modify any of the Overview stat cards (per task description #4: buyers don't have `totalDeals`; "Delivered" card kept as the count of delivered orders).
- Did NOT modify any other files. Targeted edits only.

## Stage Summary
- ESLint: 0 new errors introduced in `buyer-dashboard.tsx` (the only lint errors remaining are pre-existing `no-require-imports` warnings in `start-server.js`, which is not my file).
- TypeScript: 0 errors in `buyer-dashboard.tsx` (clean under `-p tsconfig.json`).
- Frontend handles missing V4 fields gracefully via optional chaining (`order.product?.deliveryHandledByProducer`, `order.deliveryType`, `order.deliveryFee`, `order.localTransporterName`, etc.).
- The Pay Remaining flow now goes through real Razorpay verification (signature check + persistence of `paymentStatus='full_paid'`, `remainingPaidAt`, `razorpayRemainingOrderId/PaymentId`, and `PlatformRevenue` entry) on the backend. In dev (no RAZORPAY_KEY_ID) it auto-succeeds via demo mode — no modal opens, the helper fakes a paymentId/signature and the verify endpoint records the demo payment.
- Note for main agent / DB: `dev.log` still shows `column Product_1.deliveryHandledByProducer does not exist` for `GET /api/orders?role=buyer` — this is the same V4 Supabase migration issue Subagent A flagged. Frontend renders correctly when the column is absent because every V4 field access is optional-chained.

## Files Touched
- `/home/z/my-project/src/components/agrilink/buyer-dashboard.tsx` (only)
