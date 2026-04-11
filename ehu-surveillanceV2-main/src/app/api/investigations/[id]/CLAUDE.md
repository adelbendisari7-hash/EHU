# src/app/api/investigations/[id]/

Single investigation CRUD. The `id` URL parameter is the investigation UUID (not the case ID).

## Routes

### `GET /api/investigations/:id`
Returns the full investigation object including:
- Linked case summary (cas_id, maladie, patient identifiant, commune)
- Assigned épidémiologiste
- All contacts (from the contacts sub-resource)
- `mesures_controle` (JSONB array of control measure objects)
- `zone_geographique` (JSONB GeoJSON polygon of the affected area)
- `conclusion` (text, set when closing)
- Timeline of status changes

Access: épidémiologiste and admin.

### `PATCH /api/investigations/:id`
Partial update of investigation fields.

Updatable fields:
- `statut` — workflow: `en_attente → en_cours → terminee`
- `epidemiologiste_id` — reassign to another épidémiologiste (admin only)
- `mesures_controle` — JSONB array, full replacement
- `zone_geographique` — GeoJSON polygon (from Leaflet draw)
- `conclusion` — required when setting statut to `terminee`
- `notes` — free text notes

Business rule: `conclusion` is required when transitioning to `terminee`. Returns 400 if missing.

Access: épidémiologiste (own investigations), admin.

## Nested Routes
- `/contacts` — See `contacts/CLAUDE.md` for the contact tracing sub-resource
