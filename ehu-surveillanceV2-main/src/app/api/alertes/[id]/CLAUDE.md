# src/app/api/alertes/[id]/

Single alert API. The `id` URL parameter is the alert UUID.

## Routes

### `GET /api/alertes/:id`
Returns full alert details including:
- Type, statut, description
- Maladie details (nested)
- Commune + wilaya (nested)
- Linked cases list (cas_id, patient identifiant, statut)
- Recommandations list
- Timeline: created_at, any status updates, resolved_at
- Resolved by (user, if resolved)

Access: all authenticated roles.

### `PATCH /api/alertes/:id`
Updates alert status or content.

Body:
```json
{
  "statut": "resolue | archivee",
  "resolution_note": "string (required when statut = resolue)",
  "recommandations": ["string", ...] // optional update
}
```

Status transitions:
- `active → resolue` — requires `resolution_note`. Sets `resolved_at = now()` and `resolved_by = session.userId`.
- `resolue → archivee` — no note required. Sets `archived_at = now()`.
- `active → archivee` — not allowed directly; must resolve first.

On resolve: sends notification to all users who received the original alert notification, informing them the alert has been resolved.

Access: épidémiologiste and admin only.
