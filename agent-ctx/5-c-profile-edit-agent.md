# Task 5-c: Producer Profile Editing Capability

## Task Summary
Added profile editing capability to the Producer Profile page so that the producer can edit their own profile when viewing their own page.

## Changes Made

### File Modified: `/home/z/my-project/src/components/agrilink/producer-profile-page.tsx`

#### 1. New Imports Added
- `useRef` from React
- `Upload, Pencil, Camera, Loader2, X, Plus` from lucide-react
- `AvatarImage` from avatar component
- `Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter` from dialog
- `Input` from input component
- `Label` from label component
- `Textarea` from textarea component
- `MapPicker` from map-picker component

#### 2. ProducerData Interface Updated
- Added `avatarUrl?: string` field
- Added `bannerUrl?: string` field

#### 3. Component State & Logic
- Added `user` from useAppStore destructuring
- Added `isOwner` flag: `user?.id === selectedProducerId`
- Added edit state: `editOpen`, `editForm`, `editLat`, `editLng`, `uploadingAvatar`, `uploadingBanner`, `saving`
- Added refs: `avatarInputRef`, `bannerInputRef`

#### 4. Edit Functions
- `openEdit()` - Pre-fills edit form with current producer data
- `handleSave()` - PATCHes `/api/users` with updated data, updates local Zustand store
- `handleAvatarUpload()` - Uploads to `/api/upload` (folder: 'avatars'), PATCHes user with `avatarUrl`
- `handleBannerUpload()` - Uploads to `/api/upload` (folder: 'banners'), PATCHes user with `bannerUrl`
- `handleFarmImageUpload()` - Uploads to `/api/upload` (folder: 'farm-images'), appends to existing images

#### 5. UI Changes
- **Top bar**: Added "Edit Profile" button (green) when `isOwner` is true
- **Banner**: Shows actual image when `bannerUrl` exists, adds "Change Banner" camera overlay button for owner
- **Avatar**: Shows actual image via AvatarImage when `avatarUrl` exists, adds camera icon overlay on hover for owner
- **Farm Gallery**: Added "Add Images" upload button for owner
- **Edit Dialog**: Full form with sections for Basic Info, Farm Details, Location (with MapPicker), and Certifications

#### 6. All existing viewing functionality preserved
- All tabs (overview, products, reviews, contact) remain unchanged
- Edit features only visible when `isOwner === true`
- Non-owner visitors see the same page as before

## Lint Results
- No errors in producer-profile-page.tsx
- Pre-existing errors only in start-server.js and a warning in map-picker.tsx

## Dev Server
- Running normally, no compilation errors
