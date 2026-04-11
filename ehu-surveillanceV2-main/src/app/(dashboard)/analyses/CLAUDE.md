# src/app/(dashboard)/analyses/

Advanced analytics dashboard. Served at `/analyses`. Accessible by épidémiologiste and admin roles.

## Charts and Visualizations

1. **Prevalence by Disease** — Recharts bar chart showing confirmed case counts per disease for the selected period
2. **Risk Choropleth Map** — Leaflet map with communes colored by risk level (green/amber/red) based on case density. Dynamic import `{ ssr: false }`.
3. **Temporal Epidemic Curves** — Multi-line Recharts chart showing case trends over time, one line per disease or per commune
4. **Age/Sex Pyramid** — Bar chart showing case distribution by age group and gender

## Advanced Filters
A collapsible filter panel at the top provides:
- **Période** — Custom date range picker
- **Maladie** — Multi-select dropdown
- **Commune / Wilaya** — Hierarchical dropdown
- **Établissement** — Dropdown
- **Tranche d'âge** — Range slider (0–100 years, grouped by decade)
- **Sexe** — Toggle: Tous / Masculin / Féminin

## Export
- **Export PDF** button: generates a report with all visible charts (jsPDF + html2canvas)
- **Export Excel** button: exports raw filtered data (SheetJS/xlsx)
- Patient data is pseudonymized in all exports (no direct identifiers)

## Data Source
All data fetched from `GET /api/stats/analyses` with filter query params.
