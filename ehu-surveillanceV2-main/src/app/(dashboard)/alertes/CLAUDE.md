# src/app/(dashboard)/alertes/

Health alerts management section. Served at `/alertes`.

## Alert Types
- **Épidémique** (red) — Epidemic threshold exceeded; requires immediate action
- **Seuil** (amber) — Warning threshold reached; monitoring required
- **Information** (blue) — Informational alert; no immediate action required

## Alert Statuses
- `active` — Alert is current and unresolved
- `resolue` — Alert has been resolved
- `archivee` — Alert has been archived

## Page Content (`page.tsx`)
- Tab bar: Actives / Résolues / Archivées
- Alert cards list showing: type badge, maladie, commune/wilaya, case count, date created, assigned épidémiologiste
- Filter bar: by type, maladie, commune
- "Créer une alerte" button (épidémiologiste + admin only) opens a creation dialog
- Clicking an alert card navigates to `/alertes/:alerteId`

## Auto-Trigger Logic
Alerts are automatically created by the system (via `alerte-service.ts`) when:
- A disease's case count in a commune exceeds `maladies.seuil_alerte` within a rolling 7-day window

## Access Control
- All authenticated users can view alerts
- Only épidémiologiste and admin can create, resolve, or archive alerts
