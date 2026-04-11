# src/components/parametres/

Settings management components. Used on the `/parametres/*` sub-pages. Admin-facing UI.

## Components

### `maladies-table.tsx` ("use client")
CRUD table for notifiable diseases (MDO).
Columns: code MDO, nom, catégorie badge, seuil d'alerte, statut toggle, actions (edit, delete).
Inline toggle for `is_active` using shadcn/ui `Switch`.
"Ajouter" button opens a dialog form with fields: nom, code_mdo, catégorie (select), seuil_alerte (number input), is_active toggle.
API: `POST /api/maladies`, `PATCH /api/maladies/:id`.

### `etablissements-table.tsx` ("use client")
CRUD table for health establishments.
Columns: nom, type badge, commune, wilaya, statut toggle, actions (edit).
"Ajouter" button opens a dialog form.
Wilaya and commune selects are hierarchically linked (commune filtered by selected wilaya).
API: `POST /api/etablissements`, `PATCH /api/etablissements/:id`.

### `wilayas-table.tsx` ("use client")
View/manage wilayas and communes.
Left panel: list of 48 wilayas (code + nom).
Right panel: clicking a wilaya shows its communes list with is_active toggle.
Mostly read-only after initial seed; adding/editing wilayas is rare.
API: `PATCH /api/communes/:id` for toggling is_active.

## Conventions
- All dialogs use shadcn/ui `Dialog` with `DialogTrigger`, `DialogContent`, `DialogHeader`
- On successful mutation: close dialog, show success toast, refetch table data (via SWR `mutate()` or React Query `invalidateQueries()`)
- On error: show error toast with the API error message
