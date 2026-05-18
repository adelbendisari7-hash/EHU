# src/app/api/cas/

Case declarations API (`cas_declares` table). Core resource of the surveillance system.

## Routes

### `GET /api/cas`
Returns a paginated list of declared cases.

Query parameters:
- `page` (default: 1), `limit` (default: 20)
- `maladie_id` — filter by disease UUID
- `commune_id` — filter by commune UUID
- `statut` — filter by status: `nouveau|en_cours|confirme|infirme|cloture`
- `date_from`, `date_to` — ISO date strings
- `etablissement_id` — filter by establishment
- `search` — full-text search on patient nom/prénom/identifiant

Access: all authenticated roles. Médecin sees only their own cases (`declared_by = session.userId`).

### `POST /api/cas`
Creates a new case declaration.

Body: validated with `createCasSchema` (see `@/lib/validators`).

Logic (via `cas-service.createCas()`):
1. Check if patient already exists (by `identifiant_patient` or nom+prénom+date_naissance)
2. Create patient if not found, or link to existing patient
3. Create `cas_declares` record with `statut = 'nouveau'`
4. Check if new case triggers an alert threshold (via `alerte-service.checkThresholds()`)
5. Log to `audit_logs`

Returns: created case object with HTTP 201.

Access: médecin and épidémiologiste roles.
