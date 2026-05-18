# src/app/api/stats/dashboard/

Dashboard statistics endpoint. Returns all data needed to populate the main dashboard page in a single request.

## Route: `GET /api/stats/dashboard`

### Query Parameters
- `periode` — shorthand: `7d | 30d | 90d` (overrides date_from/date_to)
- `date_from`, `date_to` — custom date range
- `commune_id` — filter all stats by commune
- `maladie_id` — filter all stats by disease

### Response Shape
```json
{
  "statCards": {
    "totalCasActifs": 142,
    "nombreMaladies": 18,
    "alertesActives": 3,
    "scoreSurveillance": 87
  },
  "epidemicMapMarkers": [
    { "commune_id": "uuid", "commune_nom": "string", "lat": 0.0, "lng": 0.0,
      "cas_count": 12, "severity": "rouge | amber | vert" }
  ],
  "epidemicCurve": [
    { "date": "2024-03-01", "nouveaux_cas": 5, "cas_confirmes": 3 }
  ],
  "diseaseDistribution": [
    { "maladie_id": "uuid", "maladie_nom": "string", "cas_count": 45, "percentage": 31.7 }
  ]
}
```

### Surveillance Score Calculation
`score = (cas_investigues / total_cas_confirmes) * 0.5 + (alertes_resolues / total_alertes) * 0.3 + (completude_donnees) * 0.2`
Returned as a percentage (0–100).

### Caching
`export const revalidate = 300` — cached for 5 minutes.
