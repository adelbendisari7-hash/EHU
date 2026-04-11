# src/app/(dashboard)/parametres/

System settings section. Served at `/parametres`. **Admin only** — all other roles are redirected to `/dashboard`.

## Overview Page (`page.tsx`)
A settings navigation overview with cards for each sub-section:
- **Maladies MDO** — Manage the list of notifiable diseases
- **Établissements** — Manage health establishments
- **Wilayas & Communes** — View and manage geographic reference data
- **Notifications** — Configure alert thresholds and notification preferences

## Sub-Pages
- `maladies/` — CRUD for maladies à déclaration obligatoire
- `etablissements/` — CRUD for health establishments
- `wilayas/` — View/manage 48 wilayas and 1541 communes
- `notifications/` — Notification settings and templates

## Layout
Uses a secondary sidebar (left nav) with links to each sub-section, keeping the admin in the settings context while navigating between sub-pages.

## Conventions
- All settings changes are logged in `audit_logs` with `userId`, `action`, `entity`, `entityId`, `before`, `after`
- Changes to reference data (maladies, wilayas) may require cache invalidation for `/api/maladies` and `/api/communes` (these are cached with `revalidate: 3600`)
