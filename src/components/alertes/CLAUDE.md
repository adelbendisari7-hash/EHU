# src/components/alertes/

Alert display and management components. Used on the `/alertes` and `/alertes/:alerteId` pages.

## Components

### `alerte-card.tsx`
Summary card for a single alert displayed in the alerts list.
- Left colored border based on type (red=épidémique, amber=seuil, blue=information)
- Content: type badge, maladie name, commune/wilaya, case count, date created, assigned épidémiologiste name
- Footer: status badge, "Voir le détail" link
- Hover state with subtle shadow lift

### `alerte-list.tsx` ("use client")
List of alert cards with tab-based filtering (Actives / Résolues / Archivées).
- Uses shadcn/ui `Tabs` for the status filter
- Renders a grid of `AlerteCard` components
- Empty state when no alerts match the filter

### `alerte-badge.tsx`
Stateless component. Returns a styled `Badge` for an alert type:
- `epidemique` → red background, "Épidémique"
- `seuil` → amber background, "Seuil"
- `information` → blue background, "Information"

### `alerte-detail.tsx` ("use client")
Full alert detail view (used within the `[alerteId]` page).
- Header with type badge and status
- Detail grid: maladie, commune, wilaya, case count, threshold, date
- Linked cases list (compact table)
- Recommendations list (bulleted, editable by épidémiologiste)
- Resolution timeline (chronological)
- Action buttons: Résoudre (opens dialog for resolution note), Archiver
