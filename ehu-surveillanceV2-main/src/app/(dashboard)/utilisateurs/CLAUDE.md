# src/app/(dashboard)/utilisateurs/

User management section. Served at `/utilisateurs`. **Admin only** — all other roles are redirected to `/dashboard`.

## Page Content (`page.tsx`)
A paginated table of all system users with columns:
- Nom complet
- Email
- Rôle (badge: médecin/épidémiologiste/admin)
- Wilaya
- Établissement
- Statut (Actif / Inactif badge)
- Actions (Edit, Deactivate/Activate, Reset Password, Delete)

## Features

### Add User
- "Ajouter un utilisateur" button opens a dialog form
- Fields: nom, prénom, email, rôle, wilaya, établissement, mot de passe temporaire
- Submission: `POST /api/users`

### Bulk Import
- "Importer CSV" button opens a file upload dialog
- CSV columns: nom, prénom, email, rôle, wilaya_code, etablissement_code
- Server parses CSV, creates users with auto-generated temporary passwords
- Returns import summary (X created, Y errors with details)

### Filters
- **Nom** — Full-text search input
- **Rôle** — Dropdown filter
- **Wilaya** — Dropdown filter
- **Statut** — Toggle: Tous / Actifs / Inactifs

## Data Source
`GET /api/users` with filter query params. Pagination: 20 users per page.
