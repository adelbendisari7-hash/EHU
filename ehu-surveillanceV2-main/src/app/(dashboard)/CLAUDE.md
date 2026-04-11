# src/app/(dashboard)/

Route group for all authenticated application pages. The group shares a common shell layout defined in `(dashboard)/layout.tsx`.

## Layout Structure
- **Sidebar** — 256px wide, background #1B4F8A (EHU Blue). Collapsible to 64px icon-only mode. Contains navigation links filtered by user role.
- **Topbar** — 56px tall, white background. Contains: breadcrumb navigation, global search input, notification bell, and user avatar dropdown.
- **Main content area** — Remaining space, scrollable, with `p-6` padding.

## Authentication Protection
All pages in this group require authentication. Protection is enforced via:
1. NextAuth.js middleware (`middleware.ts` at the project root) — redirects unauthenticated users to `/login`
2. `getServerSession()` in individual pages for role-based access control

## Sub-Routes
- `dashboard/` — Main KPI dashboard and epidemic overview
- `declarations/` — Case declaration list, new declaration form, individual case detail
- `investigations/` — Epidemiological investigation list
- `analyses/` — Advanced analytics and charts
- `alertes/` — Health alerts management
- `utilisateurs/` — User management (admin only)
- `parametres/` — System settings (admin only)
- `profil/` — Authenticated user's own profile

## Conventions
- Server Components by default; add `"use client"` only for interactive components
- Role checks: use `getServerSession()` and redirect to `/dashboard` or show 403 if role insufficient
- Active sidebar link highlighted based on current pathname
