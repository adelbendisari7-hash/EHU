# src/app/api/alertes/

Health alerts API. Manages epidemic, threshold, and informational alerts.

## Routes

### `GET /api/alertes`
Returns paginated list of alerts.

Query parameters:
- `type` — `epidemique | seuil | information`
- `statut` — `active | resolue | archivee`
- `commune_id`, `wilaya_id`
- `maladie_id`
- `date_from`, `date_to`
- `page`, `limit` (default: 20)

Access: all authenticated roles.

### `POST /api/alertes`
Creates a new alert (manual creation).

Body:
```json
{
  "type": "epidemique | seuil | information",
  "maladie_id": "uuid",
  "commune_id": "uuid",
  "description": "string",
  "recommandations": ["string", ...],
  "cas_ids": ["uuid", ...] // optional: linked cases
}
```

Access: épidémiologiste and admin only.

## Auto-Trigger Logic
Alerts are automatically created by `alerte-service.checkThresholds()` which is called:
1. After every new case declaration (`POST /api/cas`)
2. After every case status change to `confirme`

Threshold check: if `COUNT(cas WHERE maladie_id = X AND commune_id = Y AND date > now()-7days AND statut IN ['en_cours','confirme']) >= maladies.seuil_alerte` → create `seuil` or `epidemique` alert.

## Notifications on Alert Creation
When a new alert is created (manual or auto), `notification-service.notifyAlert()` sends:
- Email via Resend to all épidémiologistes and admins
- In-app notification stored in `notifications` table for all relevant users
