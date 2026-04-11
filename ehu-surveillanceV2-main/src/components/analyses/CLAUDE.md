# src/components/analyses/

Analytics and visualization components. Used on the `/analyses` page.

## Components

### `prevalence-chart.tsx` ("use client")
Recharts `BarChart` showing confirmed case counts (and optionally prevalence per 10,000 population) per disease.
- Toggle between absolute count and rate (per 10k)
- Horizontal bars for easy reading of disease names
- Color gradient based on case count (low=green, high=red)

### `risk-map.tsx` ("use client")
Leaflet choropleth map coloring communes by risk level. Must be dynamically imported with `{ ssr: false }`.
- Risk levels: `faible` (light green), `modere` (amber), `eleve` (orange), `critique` (dark red)
- GeoJSON commune boundaries for Algeria (loaded from `/public/algeria-communes.geojson`)
- Tooltip on hover: commune name, risk level, case count
- Legend in bottom-left corner

### `temporal-analysis.tsx` ("use client")
Recharts `LineChart` showing case trends over time.
- Multiple lines: one per selected disease (if maladie_id not specified) or one overall line
- X-axis: dates in DD/MM or week number (depending on period length)
- Dotted trend line with linear regression overlay

### `analytics-filters.tsx` ("use client")
Advanced filter panel (collapsible) at the top of the analyses page.
- Période: `DateRangePicker` component
- Maladie: multi-select dropdown
- Commune: select with wilaya grouping
- Établissement: select dropdown
- Tranche d'âge: dual-handle range slider
- Sexe: 3-button toggle (Tous / Masculin / Féminin)
- "Appliquer les filtres" button + "Réinitialiser" link
- Emits filter state to parent via `onFilterChange` callback
