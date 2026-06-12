# Task 8-9: Cart Panel & Product Page Updates

## Task 8: Update Cart Panel

### Pricing Corrections (CRITICAL):
- **Removed automatic GST calculation** - GST is NOT automatically added
- **Removed automatic transport cost from total** - Transport shown as ESTIMATE only, not in bill
- Clear price breakdown in checkout:
  - Product Cost (subtotal)
  - Platform Fee (2% of subtotal) - IS added
  - Transport Booking Fee (₹30 flat) - IS added
  - Estimated Transport Cost (shown as estimate, NOT added to total)
  - **Total Payable = Subtotal + Platform Fee + Transport Booking Fee**

### Split Payment System:
- Advance Payment (50%) of Total Payable → paid now
- Remaining Payment (50%) of Total Payable → paid after delivery confirmation
- "Pay ₹X Now" button for 50% advance
- Orders created with paymentStatus = 'advance_paid', status = 'confirmed'

### Checkout Dialog Updates:
- Kept delivery address form and MapPicker
- Updated bill breakdown with corrected pricing
- Shows advance payment amount prominently
- Added note about remaining 50% due upon delivery
- Sends payment breakdown to the API

### Cart Items:
- Shows available quantity on each cart item
- Low stock warning if quantity < 10
- Validates quantity doesn't exceed available stock at checkout
- Visual warning when quantity exceeds stock

## Task 9: Update Product Page

### Pricing Corrections:
- Product price shows ONLY actual pricePerUnit (producer's price)
- No auto-calculated GST or transport in delivery estimate
- Simplified delivery estimate:
  - From: [product location]
  - Est. Delivery: 2-5 business days
  - Est. Transport Cost: ₹X (3.5% of order value, estimate only)
  - Platform Fee: 2% (calculated at checkout)

### Similar Products Section Redesign:
- Modern grid cards (2 cols mobile, 3-4 desktop) instead of horizontal scroll
- Cards show: image, name, price, available quantity, producer name, category badge, quick "Add to Cart"

### Other Products From This Producer Section:
- Same grid layout as similar products
- Cards show: image, name, price, available quantity, "Same Producer" indicator, category, quick "Add to Cart"

### Reviews Section:
- Includes `productId` in review API call
- Fetches reviews filtered by productId first, falls back to seller reviews
- Kept existing interactive star rating and review form

### Available Quantity Display:
- "X units available" prominently near pricing
- Low stock warning if quantity < 10

## API Updates

### Orders API (`/api/orders/route.ts`):
- Added support for new payment breakdown fields from cart
- Fields: platformFee, transportBookingFee, totalPayable, advancePayment, remainingPayment, estimatedTransportCost, paymentStatus, status
- Graceful fallback when DB columns don't exist

## Files Modified
- `/src/components/agrilink/cart-panel.tsx` - Complete rewrite
- `/src/components/agrilink/product-page.tsx` - Complete rewrite
- `/src/app/api/orders/route.ts` - Updated POST handler
- `/home/z/my-project/worklog.md` - Appended work log
