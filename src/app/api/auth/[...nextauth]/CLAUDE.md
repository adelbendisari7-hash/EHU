# src/app/api/auth/[...nextauth]/

NextAuth.js v5 catch-all route handler. The single `route.ts` file here exports `GET` and `POST` handlers from the NextAuth configuration.

## Configuration (defined in `src/lib/auth.ts`, used here)

### Provider
**CredentialsProvider** — custom email + password + role authentication.

Authorize function:
1. Finds user by email in the database
2. Verifies password with `bcrypt.compare(password, user.password_hash)`
3. Verifies the selected role matches `user.role`
4. Checks `user.is_active === true`
5. Returns the user object (without password_hash) on success, or `null` on failure

### JWT Claims
The JWT token includes:
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "role": "medecin | epidemiologiste | admin",
  "etablissementId": "uuid",
  "wilayadId": "uuid",
  "nom": "string",
  "prenom": "string"
}
```

### Session Strategy
`strategy: "jwt"` — sessions are stateless JWTs, not stored in the database.

### Callbacks
- `jwt` callback: enriches token with custom claims from the user object
- `session` callback: exposes custom claims to the client via `session.user`

### Session Expiry
- JWT maxAge: 3600 seconds (1 hour)
- Auto-refresh on activity via `updateAge` strategy
