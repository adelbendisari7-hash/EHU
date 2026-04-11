# src/components/dashboard/

Dashboard-specific components. Used exclusively on the `/dashboard` page.

## Components

### `stat-cards.tsx` ("use client")
Four KPI stat cards displayed in a responsive grid (1 col mobile, 2 col tablet, 4 col desktop).

Cards:
1. Total cas actifs (blue, trending arrow)
2. Maladies surveillées (purple)
3. Alertes actives (red if > 0, green if 0)
4. Score de surveillance % (progress ring)

Props: `StatCardsData` type from `@/types/api`.

### `epidemic-map.tsx` ("use client")
Leaflet map showing case distribution across Algeria.

- Base tiles: OpenStreetMap
- Initial view: Algeria center (36.7, 3.0), zoom 5
- Markers: colored by severity (green ≤ 3, amber 4–9, red ≥ 10 cases)
- Clicking a marker shows a popup with commune name, case count, and a link to filtered declarations
- Must be dynamically imported with `{ ssr: false }` in the page component

### `epidemic-curve.tsx` ("use client")
Recharts `LineChart` showing new declared cases per day for the last 30 days (or selected period).

- Two lines: nouveaux cas (blue), cas confirmés (green)
- X-axis: dates in DD/MM format
- Responsive via `ResponsiveContainer`

### `disease-distribution.tsx` ("use client")
Recharts `BarChart` showing case counts grouped by disease.

- Horizontal bar chart (easier to read disease names)
- Colored by case count intensity

### `dashboard-filters.tsx` ("use client")
Filter bar at top of dashboard. Emits filter change events to parent via callback props.
- Période quick-select buttons (7j / 30j / 90j)
- Commune select dropdown
- Maladie select dropdown
