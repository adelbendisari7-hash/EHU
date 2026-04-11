# src/app/(auth)/

Route group for all unauthenticated pages. The parentheses in the folder name mean this group does not affect the URL path — `/login` is served at `/login`, not `/(auth)/login`.

## Pages
- `login/` — Main login screen
- `forgot-password/` — Request a password reset email
- `reset-password/` — Set a new password via reset token

## Layout
All pages in this group share a full-screen centered layout defined in `(auth)/layout.tsx`:
- Background: gradient from `brand-50` to white
- Content: white card, 420px wide, rounded corners, drop shadow
- EHU logo centered above the card
- No sidebar, no topbar

## Conventions
- If a user is already authenticated and navigates to any of these pages, redirect them to `/dashboard`
- Use `getServerSession()` in layout or page to check auth status server-side
- Forms use React Hook Form + Zod for validation
- Error messages displayed inline (not toast) for form validation errors
