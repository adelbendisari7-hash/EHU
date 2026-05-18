# src/app/(dashboard)/dashboard/

Main dashboard page. Served at `/dashboard`. The primary landing screen after login.

## Displayed Content
1. **Stat Cards (4)** — Total cases (active), number of monitored diseases, active alerts count, and surveillance score percentage. Data from `/api/stats/dashboard`.
2. **Epidemic Map** — Leaflet map (340px tall) showing case distribution across wilayas/communes as colored markers (green/amber/red by severity). Dynamic import with `{ ssr: false }`.
3. **Epidemic Curve** — Recharts line chart showing new declared cases over the last 30 days.
4. **Disease Distribution Chart** — Recharts bar chart showing case counts by disease for the selected period.

## Filters
A filter bar at the top allows filtering all dashboard data by:
- **Période** — Date range picker (last 7d / 30d / 90d / custom)
- **Commune** — Dropdown populated from `/api/communes`
- **Maladie** — Dropdown populated from `/api/maladies`

## Data Fetching
- Initial data fetched server-side via RSC from `/api/stats/dashboard`
- Client-side re-fetch on filter changes using SWR or React Query
- Revalidate every 5 minutes via `revalidate: 300` or polling

## Components Used
- `StatCards` from `@/components/dashboard/stat-cards`
- `EpidemicMap` from `@/components/dashboard/epidemic-map` (dynamic, no SSR)
- `EpidemicCurve` from `@/components/dashboard/epidemic-curve`
- `DiseaseDistribution` from `@/components/dashboard/disease-distribution`
- `DashboardFilters` from `@/components/dashboard/dashboard-filters`
