# src/app/api/contacts/

Global contacts endpoint for cross-investigation queries. In most cases, contacts should be accessed via the nested route `/api/investigations/:id/contacts` instead.

## When to Use This Endpoint
- When searching for a contact person across multiple investigations (e.g., the same individual appears as a contact in more than one investigation)
- For generating system-wide contact surveillance reports
- For admin-level contact tracing dashboards

## Routes

### `GET /api/contacts`
Returns contacts with optional cross-investigation filters.

Query parameters:
- `nom` + `prenom` — search by name across all investigations
- `telephone` — search by phone number
- `investigation_id` — filter to a specific investigation (same as using the nested route)
- `statut` — filter by follow-up status
- `date_from`, `date_to` — filter by `date_dernier_contact`

Returns contacts with their linked investigation and case information.

Access: épidémiologiste and admin only.

## Note
Direct POST/PATCH/DELETE on contacts should always go through the nested investigation route (`/api/investigations/:id/contacts`) to maintain data integrity and proper authorization context.
