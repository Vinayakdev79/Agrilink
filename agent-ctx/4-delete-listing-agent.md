# Task 4: Add delete listing option to producer dashboard UI

## Summary
Enhanced the existing delete listing feature in the producer dashboard to meet the specified requirements: subtle hover-revealed icon button, confirmation dialog with product name, and local list removal on success.

## Changes Made
**File**: `/home/z/my-project/src/components/agrilink/producer-dashboard.tsx`

1. **State refactoring** (line ~1659):
   - Replaced `deleteListingId: string | null` with `deleteTarget: { id: string; name: string } | null` — tracks both product ID and name for the confirmation dialog
   - Added `isDeleting: boolean` state for loading indicator

2. **Handler update** (line ~1661):
   - `handleDeleteListing` is now parameterless (reads from `deleteTarget`)
   - On success: removes product from local `products` state via `setProducts(prev => prev.filter(p => p.id !== deleteTarget.id))` instead of re-fetching all data
   - Shows success/error toast
   - Manages `isDeleting` state with try/finally

3. **Delete button redesign** (line ~2244):
   - Changed from full ghost button with "Delete" text to subtle icon-only button
   - Uses `size="icon"` with `h-8 w-8` for compact size
   - Appears only on card hover: `opacity-0 group-hover:opacity-100 transition-all duration-200`
   - Added `group relative` class to the product card for hover context
   - Added `aria-label={`Delete ${product.name}`}` for accessibility
   - Subtle color: `text-muted-foreground/50` default, `hover:text-red-400 hover:bg-red-500/10` on hover

4. **AlertDialog enhancement** (line ~2259):
   - Shows product name: "Are you sure you want to delete **{name}**? This action cannot be undone."
   - Both Cancel and Delete buttons disabled while `isDeleting`
   - Delete button shows spinner + "Deleting..." during operation

## Observations
- The Add Product dialog **already has** delivery handling options (deliveryOption, deliveryFee, freeDelivery) — implemented by a prior subagent (Task A). No future task is needed for this.
- The DELETE API endpoint was already implemented at `/api/products` with soft-delete behavior.
- The previous implementation (Task A) had a basic working version; this task refined it to match the exact UX requirements.

## Lint & Dev Server
- ESLint: 0 new errors
- Dev server: running cleanly on port 3000
