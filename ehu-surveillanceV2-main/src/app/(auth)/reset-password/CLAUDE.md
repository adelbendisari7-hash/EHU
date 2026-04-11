# src/app/(auth)/reset-password/

Reset password page. Allows users to set a new password after clicking the link from their reset email. Served at `/reset-password?token=<reset_token>`.

## URL Parameter
- `token` — Query parameter containing the password reset token from the email link. Validated server-side before rendering the form.

## Fields
- **Nouveau mot de passe** — Password input. Minimum 8 characters, must include at least one uppercase letter and one number.
- **Confirmer le mot de passe** — Confirmation field. Must match the new password.

## Behavior
- On page load, validate the token via `GET /api/auth/reset-password?token=<token>`. If invalid or expired, show an error state with a link to `/forgot-password`.
- On submit, calls `POST /api/auth/reset-password` with `{ token, newPassword }`
- On success, shows confirmation message and redirects to `/login` after 3 seconds
- On failure (token expired/used), shows error with link to request a new reset

## Conventions
- Token validation happens server-side in the page component (RSC) for immediate feedback
- The password form itself is a Client Component for real-time confirmation matching
