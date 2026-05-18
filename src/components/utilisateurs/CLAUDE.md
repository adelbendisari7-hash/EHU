# src/components/utilisateurs/

User management components. Used on the `/utilisateurs` and `/utilisateurs/:userId` pages. Admin-facing UI.

## Components

### `user-table.tsx` ("use client")
Data table of all system users using shadcn/ui `Table`.
Columns: avatar + nom complet, email, rôle badge, wilaya, établissement, statut badge (Actif/Inactif), actions.

Actions per row (dropdown menu):
- Modifier → navigates to `/utilisateurs/:userId`
- Réinitialiser mot de passe → calls `POST /api/users/:id/reset-password`, shows success toast
- Désactiver / Activer → calls `PATCH /api/users/:id` with `{ is_active: false/true }`
- Supprimer → opens `ConfirmDialog`, then calls `DELETE /api/users/:id`

### `user-form.tsx` ("use client")
Create/edit user form in a shadcn/ui `Dialog`.

Fields: prénom, nom, email, rôle (select), wilaya (select), établissement (select filtered by wilaya), mot de passe (only on create; hidden on edit).

Validation: `createUserSchema` or `updateUserSchema` from `@/lib/validators`.
Submission: `POST /api/users` (create) or `PATCH /api/users/:id` (edit).

### `user-filters.tsx` ("use client")
Filter bar for the users table.
- Search input (nom/email)
- Rôle filter (select)
- Wilaya filter (select)
- Statut toggle (Tous / Actifs / Inactifs)

Emits filter state via `onFilterChange` callback prop.
