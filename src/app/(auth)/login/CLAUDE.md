# src/app/(auth)/login/

Login page for the EHU surveillance system. Served at the `/login` URL.

## Fields
1. **Établissement** — Dropdown (populated from `/api/etablissements`). Required.
2. **Email** — Text input with email validation.
3. **Mot de passe** — Password input with toggle visibility.
4. **Rôle** — Radio group with three options: Médecin, Épidémiologiste, Admin.

## Behavior
- On submit, calls `signIn('credentials', { email, password, role, etablissementId })` from NextAuth.js
- On success, redirects to `/dashboard`
- On failure, shows inline error message: "Email ou mot de passe incorrect"
- "Mot de passe oublié ?" link routes to `/forgot-password`

## Components Used
- `LoginForm` from `@/components/auth/login-form`
- `RoleSelector` from `@/components/auth/role-selector`
- shadcn/ui: `Button`, `Input`, `Label`, `Select`

## Conventions
- The page itself is a Server Component; the form is a Client Component (`"use client"`)
- Full-width primary button (#1B4F8A) at the bottom of the form
- Minimum password display: show 8-character minimum hint under the field
