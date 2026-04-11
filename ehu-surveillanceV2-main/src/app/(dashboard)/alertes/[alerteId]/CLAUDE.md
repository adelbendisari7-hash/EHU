# src/app/(dashboard)/alertes/[alerteId]/

Alert detail page. Served at `/alertes/:alerteId`. The `alerteId` URL parameter is a UUID.

## Displayed Content

### Alert Header
- Type badge (épidémique/seuil/information) with color
- Alert title (auto-generated: "Alerte {type} — {maladie} — {commune}")
- Status badge and creation date

### Alert Details
- **Commune / Wilaya** affected
- **Maladie** concerned with link to the disease configuration
- **Case count** that triggered the alert
- **Threshold** (`seuil_alerte` from the disease configuration)
- **Linked cases** — list of cases that contributed to this alert

### Recommendations List
- Bulleted list of recommended public health actions
- Predefined recommendations loaded from disease config; editable by épidémiologiste

### Resolution Timeline
- Chronological log: when the alert was triggered, any status updates, when resolved

## Actions (épidémiologiste and admin only)
- **Résoudre** — Marks alert as `resolue`, sets `resolved_at` timestamp, opens a resolution note dialog
- **Archiver** — Marks alert as `archivee` (only applicable to already-resolved alerts)

## Data Source
`GET /api/alertes/:id` returns full alert with linked cases and timeline.
