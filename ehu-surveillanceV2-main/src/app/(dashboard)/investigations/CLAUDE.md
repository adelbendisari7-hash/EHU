# src/app/(dashboard)/investigations/

List of all epidemiological investigations across all cases. Served at `/investigations`.

## Access Control
Accessible by **épidémiologiste** and **admin** only. Médecin role is redirected to `/dashboard`.

## Page Content
A filterable, paginated table of all investigations with columns:
- N° investigation
- Cas lié (patient identifiant + maladie)
- Commune / Wilaya
- Statut (badge)
- Date ouverture
- Épidémiologiste assigné
- Actions (View, Assign)

## Filters
- **Statut**: `en_attente` / `en_cours` / `terminee`
- **Date**: date range picker
- **Maladie**: dropdown
- **Épidémiologiste**: dropdown (admin only)
- **Commune / Wilaya**: dropdown

## Behavior
- Clicking a row navigates to `/declarations/:casId/investigation`
- Assign button (admin): opens a dialog to assign an épidémiologiste to the investigation
- Data fetched from `GET /api/investigations` with query params for filters

## Investigation Statuses
- `en_attente` — Investigation created but not yet started
- `en_cours` — Investigation actively in progress
- `terminee` — Investigation closed with a conclusion
