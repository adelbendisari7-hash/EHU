# src/app/(auth)/forgot-password/

Forgot password page. Allows users to request a password reset email. Served at `/forgot-password`.

## Fields
- **Email** — Single email input. The user enters the address associated with their account.

## Behavior
- On submit, calls `POST /api/auth/forgot-password` with `{ email }`
- The API generates a secure reset token, stores its hash in the database with a 1-hour expiry, and sends a reset link via Resend email
- After submission (success or failure), shows a generic confirmation message: "Si cet email existe, un lien de réinitialisation a été envoyé." (prevents user enumeration)
- "Retour à la connexion" link routes back to `/login`

## Security Notes
- Always show the same confirmation message regardless of whether the email exists (prevents user enumeration attacks)
- Tokens expire after 1 hour
- Tokens are single-use: invalidated immediately after use
