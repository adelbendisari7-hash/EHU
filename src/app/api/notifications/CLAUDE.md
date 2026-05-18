# src/app/api/notifications/

User notifications API. Manages in-app notifications for the authenticated user.

## Routes

### `GET /api/notifications`
Returns the authenticated user's notifications, ordered by `created_at` descending (unread first).

Query parameters:
- `is_read` — `true | false` to filter read/unread
- `limit` — default 20, max 50
- `page`

Response fields per notification:
- `id` (UUID)
- `type`: `nouvelle_declaration | changement_statut | nouvelle_alerte | alerte_resolue | nouveau_contact | rapport_pret`
- `titre` — short notification title
- `message` — full notification message
- `entity_type` — related entity: `cas | alerte | investigation`
- `entity_id` — UUID of the related entity (for deep linking)
- `is_read` — boolean
- `created_at`

Also returns `unread_count` for the notification bell badge.

### `PATCH /api/notifications/:id`
Marks a single notification as read. Sets `read_at = now()`, `is_read = true`.

### `PATCH /api/notifications/read-all`
Marks all of the authenticated user's unread notifications as read.

## Real-Time Updates
The notification bell polls `GET /api/notifications?is_read=false&limit=5` every 30 seconds via SWR's `refreshInterval` option.
WebSocket upgrade is a future enhancement.
