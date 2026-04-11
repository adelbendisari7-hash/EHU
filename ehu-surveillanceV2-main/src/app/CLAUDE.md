# src/app/

Next.js 14 App Router root directory. All routes, layouts, and API handlers are defined here.

## Key Files
- `layout.tsx` — Root layout: wraps the entire app with `<html>`, `<body>`, providers (NextAuth SessionProvider, React Query), and global font setup
- `page.tsx` — Root page: immediately redirects to `/login` (or `/dashboard` if authenticated)
- `globals.css` — Global CSS: Tailwind directives (`@tailwind base/components/utilities`), CSS variables for the design system, and brand color overrides

## Route Groups
- `(auth)/` — Unauthenticated pages (login, forgot-password, reset-password). No sidebar or topbar.
- `(dashboard)/` — Authenticated pages (all main app screens). Includes sidebar + topbar layout.

## API Routes
- `api/` — All Next.js Route Handlers (using the `route.ts` convention)

## Conventions
- React Server Components (RSC) are the default — no `"use client"` unless hooks or browser APIs are required
- Layouts (`layout.tsx`) are used to wrap groups of pages with shared UI or auth checks
- Loading states: use `loading.tsx` files for Suspense-based skeleton screens
- Error boundaries: use `error.tsx` files for route-level error handling
- `not-found.tsx` handles 404 states within the app
