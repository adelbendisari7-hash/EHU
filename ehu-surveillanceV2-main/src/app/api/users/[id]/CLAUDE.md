# src/app/api/users/[id]/

Individual user API. The `id` URL parameter is the user UUID.

## Routes

### `GET /api/users/:id`
Returns user details (without `password_hash`).
Access: admin can get any user. Authenticated user can get their own record (used by the profile page).

### `PATCH /api/users/:id`
Partial update of user fields.

Updatable by admin: nom, prénom, email, rôle, établissement_id, wilaya_id, is_active.
Updatable by own user (profile page): nom, prénom, téléphone, avatar_url.
A user cannot change their own role — admin only.

Body validated with `updateUserSchema`.

Returns updated user (without password_hash).

### `POST /api/users/:id/reset-password`
Admin action: sends a password reset email to the user.
Does not change the password immediately — sends a reset link via Resend.
The user must click the link and set a new password via the reset-password flow.
Access: admin only (or the user themselves if re-implemented as self-service).

### `PATCH /api/users/:id/password`
User self-service password change (used from the profile page).
Body: `{ currentPassword: string, newPassword: string }`
Verifies `currentPassword` against stored hash before updating.
Access: own user only.

### `DELETE /api/users/:id`
Soft delete: sets `is_active = false`. User can no longer log in.
Does not hard-delete the record (preserves audit trail and foreign key integrity).
Admin only. Cannot delete own account.
