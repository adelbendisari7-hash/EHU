# src/app/api/communes/

Communes reference data API. Algeria has 1541 communes across 48 wilayas.

## Routes

### `GET /api/communes`
Returns list of communes.

Query parameters:
- `wilaya_id` — filter communes by wilaya UUID (most common use: after user selects a wilaya in a form)
- `wilaya_code` — filter by wilaya code (01–58) as an alternative to UUID
- `search` — search by commune name (for autocomplete inputs)
- `is_active` — boolean, defaults to `true`

Response fields per commune:
- `id` (UUID)
- `nom`
- `wilaya_id`
- `wilaya_nom`
- `wilaya_code`
- `latitude`, `longitude` (centroid coordinates for map placement)

Access: all authenticated roles. Communes are public reference data.

## Usage Across the App
- Case declaration form: commune dropdown (filtered by patient's wilaya)
- Patient form: commune of residence
- Investigations: zone_geographique selection
- Analyses page: commune filter
- Map components: commune markers and choropleth coloring

## Caching
`export const revalidate = 3600` — heavily cached for 1 hour (communes change very rarely).
This data is seeded once from official Algeria administrative data and rarely needs updating.
