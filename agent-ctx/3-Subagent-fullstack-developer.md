# Task 3: Remove Demo Account + Enforce Single Admin

## Summary

### 3a: Remove demo account login option
- **Result**: No demo account or "try demo" login option was found anywhere. Verified both `auth-page.tsx` and `landing-page.tsx`. No changes needed.

### 3b: Enforce single admin account
Implemented three-layer protection:

1. **New API endpoint** — `/api/admin/exists` (GET)
   - File: `src/app/api/admin/exists/route.ts`
   - Queries the User table for existing admin accounts
   - Returns `{ adminExists: boolean, adminEmail: string | null }`

2. **Modified role-select-page.tsx** — Dynamic admin role card
   - File: `src/components/agrilink/role-select-page.tsx`
   - Added Admin role back to the roles array (was previously completely hidden)
   - Added `useEffect` on mount to call `/api/admin/exists`
   - When admin exists: card is disabled (Lock icon, reduced opacity, cursor-not-allowed, replaced description with error message)
   - When no admin exists: card is fully clickable, allowing the first admin to be created
   - Client-side guard in `handleRoleSelect` shows toast error if admin already exists

3. **Auth API POST route** — Already had server-side enforcement (verified, no changes needed)
   - File: `src/app/api/auth/route.ts`
   - Lines 16-34: Rejects new admin signup if admin exists (with exception for the existing admin re-registering)
   - Lines 52-65: Blocks upgrading existing non-admin user to admin if another admin already exists

## Files Changed
- **Created**: `src/app/api/admin/exists/route.ts`
- **Modified**: `src/components/agrilink/role-select-page.tsx`
- **Verified (no changes needed)**: `src/components/agrilink/auth-page.tsx`, `src/components/agrilink/landing-page.tsx`, `src/app/api/auth/route.ts`

## Lint Status
- 0 new errors introduced (only pre-existing start-server.js errors remain)
- Dev server running cleanly on port 3000
