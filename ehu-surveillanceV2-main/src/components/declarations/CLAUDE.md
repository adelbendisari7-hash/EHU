# src/components/declarations/

Components for the case declarations feature. Used across the `/declarations` route group.

## Components

### `declaration-form.tsx` ("use client")
Main wrapper for the 3-section case declaration form. Manages overall form state via React Hook Form's `useForm()`. Renders the three section components and the submit button.

### `patient-info-section.tsx` ("use client")
Form Section A: patient information fields (nom, prénom, date_naissance, sexe, commune, adresse). Includes deduplication check on blur.

### `disease-info-section.tsx` ("use client")
Form Section B: disease information (maladie select, dates, source de notification).

### `medical-info-section.tsx` ("use client")
Form Section C: medical/clinical info (établissement, symptômes multi-select, hospitalisation toggle, médecin déclarant, observations).

### `cas-list-table.tsx` ("use client")
Paginated data table of declared cases using shadcn/ui `Table`.
Columns: identifiant, patient name, maladie, commune, date déclaration, statut badge, actions.
Clicking a row navigates to `/declarations/:casId`.

### `cas-filters.tsx` ("use client")
Filter bar for the declarations list. Fields: search text, maladie select, statut select, date range picker, commune select.

### `cas-status-badge.tsx`
Stateless display component. Returns a colored shadcn/ui `Badge` for a given case status:
- `nouveau` → gray
- `en_cours` → blue
- `confirme` → green
- `infirme` → red
- `cloture` → slate

## Sub-directory
- `cas-detail/` — Components for the individual case detail page (tabs, sidebar, header)
