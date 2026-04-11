# src/components/maps/

Reusable Leaflet map components. All components in this folder are Client Components (`"use client"`) because Leaflet requires browser APIs (window, document).

## CRITICAL: SSR Prevention
**Always dynamically import map components** to avoid Next.js SSR errors:
```tsx
const EpidemicMap = dynamic(() => import('@/components/maps/leaflet-map'), { ssr: false })
```
Never import map components directly in Server Components or page files without `dynamic()`.

## Components

### `leaflet-map.tsx` ("use client")
Base Leaflet map wrapper component.
- Default tiles: OpenStreetMap (`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`)
- Default center: Algeria (36.7539, 3.0588), zoom 5
- Props: `center`, `zoom`, `style` (CSS), `children` (for markers/layers)
- Handles Leaflet CSS import (required: `import 'leaflet/dist/leaflet.css'`)
- Fixes the default Leaflet marker icon issue in Next.js (icon URL rewrite)

### `choropleth-map.tsx` ("use client")
Choropleth map for risk visualization on the analyses page.
- Loads Algeria commune GeoJSON boundaries
- Colors each commune polygon based on `risk_level` prop
- Color scale: `#27AE60` (faible) → `#F39C12` (modere) → `#E67E22` (eleve) → `#E74C3C` (critique)
- Hover tooltip: commune name, risk level, case count
- Legend component included

### `cluster-markers.tsx` ("use client")
Grouped case markers using Leaflet.markercluster.
- Individual markers colored by severity: green (1–3 cases), amber (4–9), red (10+)
- Clusters show aggregate count
- Click on cluster zooms in; click on marker shows popup with case details
