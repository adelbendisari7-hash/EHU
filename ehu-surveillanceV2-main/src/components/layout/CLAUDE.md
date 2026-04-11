# src/components/layout/

App shell components. Used in `src/app/(dashboard)/layout.tsx` to construct the authenticated page wrapper.

## Components

### `sidebar.tsx` ("use client")
- Width: 256px expanded, 64px collapsed (icon-only mode)
- Background: `#1B4F8A` (EHU Blue)
- Contains: EHU logo at top, navigation menu items (from `@/constants/navigation`), user avatar + name at bottom
- Navigation items are filtered based on `session.user.role` — médecin sees fewer items
- Active link highlighted with a lighter blue background
- Collapse/expand toggle button at the bottom
- Persists collapsed state in `localStorage`

### `topbar.tsx` ("use client")
- Height: 56px, background: white, bottom border
- Contains (left to right):
  1. Mobile menu hamburger button
  2. Breadcrumb navigation (from current pathname)
  3. Global search input (searches cases, patients, alerts)
  4. Notification bell (with unread count badge)
  5. User avatar dropdown (Profile, Settings, Logout)

### `mobile-sidebar.tsx` ("use client")
- Full-height drawer overlay for mobile/tablet viewports
- Uses shadcn/ui `Sheet` component
- Same content as sidebar.tsx
- Triggered by topbar hamburger button

### `breadcrumb.tsx`
- Generates breadcrumb trail from the current URL pathname
- Maps URL segments to French display labels (e.g., `declarations` → "Déclarations")
- Uses shadcn/ui `Breadcrumb` components
