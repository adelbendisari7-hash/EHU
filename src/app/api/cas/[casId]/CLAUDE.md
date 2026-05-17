# src/app/api/cas/[casId]/

Individual case API. The `casId` URL parameter must be a valid UUID.

## Routes

### `GET /api/cas/:casId`
Returns the full case object including:
- Patient info (nested)
- Maladie details (nested)
- Établissement (nested)
- Linked investigation summary (if exists)
- Fichiers (attached documents)

Access: all authenticated roles. Médecin can only access own cases.

### `PATCH /api/cas/:casId`
Partial update of case fields.

Body: validated with `updateCasSchema` (all fields optional).

Special handling for `statut` changes:
- Enforces workflow: `nouveau→en_cours→confirme/infirme→cloture`
- Backward transitions not allowed (except admin)
- On `confirme` transition: auto-creates an investigation record if none exists
- Logs status changes to `audit_logs` with `before` and `after` values

Access: médecin (own cases only), épidémiologiste, admin.

### `DELETE /api/cas/:casId`
Hard delete of a case. Admin only.

Cascades: deletes linked fichiers, investigation, contacts.
Logs deletion to `audit_logs`.

Returns 204 No Content on success.

## URL Validation
The `casId` parameter is validated as a UUID at the start of each handler. Returns 400 if invalid format, 404 if not found.
