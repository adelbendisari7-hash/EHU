# src/app/api/etablissements/

Health establishments reference data API.

## Routes

### `GET /api/etablissements`
Returns list of health establishments.

Query parameters:
- `wilaya_id` — filter by wilaya (primary use case: populating establishment dropdown after wilaya selection in login and forms)
- `type` — filter by type: `CHU | EHU | EPH | EPSP | clinique_privee | cabinet | laboratoire`
- `is_active` — boolean, defaults to `true`
- `search` — search by establishment name

Response fields per establishment:
- `id` (UUID)
- `nom`
- `type`
- `commune` (nested: id, nom)
- `wilaya` (nested: id, nom, code)
- `adresse`
- `is_active`

Access: all authenticated roles (also used in the login form before authentication).

Note: The login form calls this endpoint without authentication to populate the establishment dropdown. This endpoint therefore has a **public GET** handler — no auth required for GET.

## Caching
`export const revalidate = 3600` — cached for 1 hour.
On admin mutations (`/api/etablissements` POST/PATCH from the parametres page), call `revalidateTag('etablissements')`.
