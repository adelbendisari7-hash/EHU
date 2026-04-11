# src/app/api/auth/

Authentication API routes. Handles sign-in, sign-out, and password management flows.

## Routes

### `[...nextauth]/route.ts`
NextAuth.js v5 catch-all handler. Handles all `/api/auth/*` requests (signin, signout, session, callback, csrf).

### `forgot-password/route.ts` (POST — public)
- Body: `{ email: string }`
- Generates a cryptographically secure token (`crypto.randomBytes(32).toString('hex')`)
- Stores the token hash (SHA-256) in `password_reset_tokens` table with `expires_at = now() + 1 hour`
- Sends reset email via Resend with link: `{BASE_URL}/reset-password?token={plainToken}`
- Always returns 200 (prevents user enumeration)

### `reset-password/route.ts` (POST — public)
- Body: `{ token: string, newPassword: string }`
- Validates token: looks up hash, checks not expired, checks not already used
- Hashes new password with bcrypt (12 salt rounds)
- Updates `users.password_hash`, marks token as used (`used_at = now()`)
- Returns 200 on success, 400 if token invalid/expired

### `reset-password/route.ts` (GET — public)
- Query: `?token=<token>`
- Validates if token is still valid (exists, not expired, not used)
- Returns `{ valid: true }` or `{ valid: false, reason: '...' }`

## Security
- bcrypt hash rounds: 12 (balance between security and performance)
- JWT expiry: 1 hour (access token) + 30 days (refresh token via rotating sessions)
- Tokens are SHA-256 hashed before storage (plain token only in the email link)
