# src/components/notifications/

Notification components for the in-app notification system. Displayed in the topbar.

## Components

### `notification-bell.tsx` ("use client")
Bell icon button in the topbar with an unread count badge.

Behavior:
- Fetches unread notification count from `GET /api/notifications?is_read=false&limit=1`
- Polls every 30 seconds using SWR `refreshInterval: 30000`
- Displays a red badge with the unread count (shows "9+" if > 9)
- On click: toggles the `NotificationList` dropdown panel

Badge disappears when unread count reaches 0.

### `notification-list.tsx` ("use client")
Dropdown panel showing recent notifications.

Layout:
- Fixed width 380px, max-height 480px, scrollable
- Header: "Notifications" title + "Tout marquer comme lu" button
- List of `NotificationItem` sub-components (5 most recent unread, then older)
- Footer: "Voir toutes les notifications" link (navigates to a `/notifications` page if implemented)

Each notification item displays:
- Type icon (bell for alert, file for new case, user for user action)
- Titre (bold) + message (truncated to 2 lines)
- Relative timestamp ("il y a 5 min", "hier", etc.)
- Unread items have a blue dot indicator
- Clicking an item: marks as read + navigates to the related entity (case/alert/investigation)

## Real-Time Strategy
Current: polling every 30 seconds.
Future upgrade: WebSocket via Supabase Realtime or Pusher for instant notifications.
