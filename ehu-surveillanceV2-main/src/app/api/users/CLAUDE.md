# src/app/api/users/

User management API. Admin only for all mutating operations.

## Routes

### `GET /api/users`
Returns paginated list of users (without `password_hash`).

Query parameters:
- `search` — search by nom, prénom, or email
- `role` — `medecin | epidemiologiste | admin`
- `wilaya_id`
- `is_active` — `true | false`
- `page`, `limit` (default: 20)

Access: admin only.

### `POST /api/users`
Creates a new user account.

Body:
```json
{
  "nom": "string",
  "prenom": "string",
  "email": "string",
  "role": "medecin | epidemiologiste | admin",
  "etablissement_id": "uuid",
  "wilaya_id": "uuid",
  "password": "string (min 8 chars)"
}
```

Logic:
1. Check email uniqueness — return 409 if already exists
2. Hash password with `bcrypt.hash(password, 12)`
3. Create user record with `is_active = true`
4. Send welcome email via Resend

Access: admin only.

### `POST /api/users/import` (bulk CSV import)
Body: multipart/form-data with a CSV file.
CSV columns: `nom, prenom, email, role, wilaya_code, etablissement_code`
Auto-generates secure temporary passwords, sends welcome emails.
Returns: `{ created: N, errors: [{row, reason}] }`
