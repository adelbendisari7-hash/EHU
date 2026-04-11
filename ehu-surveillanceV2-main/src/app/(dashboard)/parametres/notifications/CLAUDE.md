# src/app/(dashboard)/parametres/notifications/

Configure notification settings and templates. Served at `/parametres/notifications`. Admin only.

## Settings Sections

### Email Alert Thresholds
- Global override for alert email triggers (can be set per-maladie in the maladies page)
- Minimum interval between repeated alerts for the same disease/commune (e.g., 24 hours)
- Recipients: list of email addresses to CC on epidemic-level alerts

### Push Notification Preferences
- Enable/disable browser push notifications system-wide
- Per-role configuration: which roles receive which notification types
- Notification types: nouvelle déclaration, changement de statut, nouvelle alerte, nouveau contact

### Email Templates
- Preview and edit the HTML/text templates used by Resend for:
  - `welcome_email` — New user account creation
  - `reset_password` — Password reset link
  - `alert_notification` — Epidemic alert email
  - `report_ready` — Export/report completion notification
- Templates use placeholder variables: `{{user_name}}`, `{{alert_type}}`, `{{disease_name}}`, etc.

## Storage
Notification settings stored in a `system_config` table as key-value pairs (JSON values). Email templates stored in `email_templates` table.

## Email Provider
Uses Resend. API key configured via `RESEND_API_KEY` environment variable. From address: `surveillance@ehu-oran.dz`.
