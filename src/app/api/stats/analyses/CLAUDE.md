# src/app/api/stats/analyses/

Advanced analytics endpoint. Returns detailed statistical data for the analyses page with full filtering support.

## Route: `GET /api/stats/analyses`

### Query Parameters
- `date_from`, `date_to` — required date range
- `maladie_id` — filter by disease (supports comma-separated multiple: `?maladie_id=uuid1,uuid2`)
- `commune_id`, `wilaya_id`
- `etablissement_id`
- `age_min`, `age_max` — age range filter (in years)
- `sexe` — `M | F | all`
- `groupBy` — `maladie | commune | semaine | mois` (affects how data is grouped)

### Response Shape
```json
{
  "prevalenceByDisease": [
    { "maladie_id": "uuid", "maladie_nom": "string", "total": 120, "confirmes": 87, "prevalence_per_10k": 4.2 }
  ],
  "riskByCommune": [
    { "commune_id": "uuid", "commune_nom": "string", "wilaya_nom": "string",
      "lat": 0.0, "lng": 0.0, "risk_level": "faible | modere | eleve | critique",
      "cas_count": 8 }
  ],
  "temporalTrends": [
    { "period": "2024-W10", "maladie_nom": "string", "cas_count": 15 }
  ],
  "ageSexPyramid": [
    { "age_group": "0-9", "masculin": 12, "feminin": 8 }
  ],
  "summary": {
    "total_cas": 450, "periode_jours": 90, "communes_touchees": 14
  }
}
```

### Caching
`export const revalidate = 60` — cached for 1 minute (more dynamic than dashboard stats).
