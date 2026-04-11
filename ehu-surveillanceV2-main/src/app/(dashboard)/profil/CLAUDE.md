# src/app/(dashboard)/profil/

User profile page. Served at `/profil`. Accessible by all authenticated users (each user views their own profile).

## Page Layout
Two-column layout:
- **Left (280px)** — Profile card: avatar (uploaded or default), nom complet, rôle badge, établissement name, wilaya, member since date
- **Right (flex-1)** — Editable sections in a form

## Editable Fields
- **Prénom** and **Nom**
- **Téléphone** — phone number (optional)
- **Avatar** — upload new profile photo (drag-and-drop or click; uploads to S3/R2 via `/api/fichiers/upload`)

## Read-Only Fields (cannot be changed by user)
- **Email** — contact admin to change
- **Rôle** — contact admin to change
- **Établissement** — contact admin to change

## Change Password Section
Separate card below the main form:
- Current password (for verification)
- New password (min 8 chars, 1 uppercase, 1 number)
- Confirm new password

## Behavior
- Profile info update: `PATCH /api/users/:id` (own user only)
- Password change: `PATCH /api/users/:id/password` (separate endpoint, requires current password verification)
- On success: success toast notification
- Avatar upload: immediate preview before save; uploaded to S3/R2; URL stored in `users.avatar_url`
