# src/app/api/stats/

Statistics and analytics API routes. Provides aggregated data for the dashboard and analytics pages.

## Sub-Routes
- `dashboard/` — Summary statistics for the main dashboard KPIs and charts
- `analyses/` — Advanced analytics with full filtering support

## General Conventions
- All stats endpoints are GET-only (read-only aggregations)
- Data is derived from the `cas_declares` table with JOINs to patients, maladies, communes
- Responses are cached where appropriate using Next.js `revalidate` (dashboard: 300s, analyses: 60s)
- Filters are passed as URL query parameters
- All date calculations use Algeria timezone (Africa/Algiers, UTC+1)
- Access: épidémiologiste and admin. Médecin has limited access to dashboard stats only.

## Common Query Parameters Across Stats Endpoints
- `date_from` — ISO date string (start of period)
- `date_to` — ISO date string (end of period)
- `maladie_id` — filter by disease UUID
- `commune_id` — filter by commune UUID
- `wilaya_id` — filter by wilaya UUID
- `etablissement_id` — filter by establishment UUID
