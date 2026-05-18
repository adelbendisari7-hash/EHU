# src/app/api/investigations/

Epidemiological investigations API. Each investigation is a 1:1 relationship with a declared case (`cas_declares`).

## Routes

### `GET /api/investigations`
Returns paginated list of investigations.

Query parameters:
- `page`, `limit`
- `statut` — `en_attente|en_cours|terminee`
- `cas_id` — get investigation for a specific case (returns array of 1 or empty)
- `date_from`, `date_to`
- `maladie_id`
- `epidemiologiste_id`

Access: épidémiologiste and admin only.

### `POST /api/investigations`
Creates a new investigation linked to a case.

Body:
```json
{
  "cas_id": "uuid",
  "epidemiologiste_id": "uuid (optional, defaults to session user)",
  "notes_initiales": "string (optional)"
}
```

Business rule: A case can have at most one investigation. Returns 409 Conflict if an investigation already exists for the given `cas_id`.

Logic:
1. Validate case exists and is in status `en_cours` or `confirme`
2. Create investigation with `statut = 'en_attente'`
3. Update case status to `en_cours` if it was `nouveau`

Access: épidémiologiste and admin.

## Nested Resource
See `[id]/contacts/` for contact tracing sub-resource.
