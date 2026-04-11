# src/app/(dashboard)/utilisateurs/[userId]/

Individual user detail and edit page. Served at `/utilisateurs/:userId`. **Admin only**.

## Page Layout
Two-column layout:
- **Left (320px)** — User summary card: avatar, name, role badge, status badge, join date, last login
- **Right (flex-1)** — Editable form with tabs: Informations / Activité / Permissions

## Editable Fields
- Nom, Prénom
- Email
- Rôle (select: médecin/épidémiologiste/admin)
- Wilaya (select from 48 wilayas)
- Établissement (select filtered by chosen wilaya)

## Read-Only Fields
- Date de création
- Dernière connexion
- Identifiant UUID

## Actions
- **Activer / Désactiver** — Toggles `is_active` field. Deactivated users cannot log in. Uses `PATCH /api/users/:id` with `{ is_active: false/true }`.
- **Réinitialiser le mot de passe** — Sends a password reset email via Resend. Uses `POST /api/users/:id/reset-password`.
- **Supprimer** — Soft delete (sets `is_active = false`). Opens a confirmation dialog before proceeding. Requires admin to type the user's email to confirm.

## Data Source
`GET /api/users/:id` returns full user object without `password_hash`.
