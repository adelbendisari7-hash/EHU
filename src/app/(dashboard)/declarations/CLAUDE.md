# src/app/(dashboard)/declarations/

Case declarations section. Handles the full lifecycle of declaring and managing epidemiological cases.

## Pages
- `page.tsx` — Paginated list of all declared cases (`/declarations`). Shows a table with columns: identifiant patient, maladie, établissement, commune, date déclaration, statut. Includes filter bar and "Nouvelle déclaration" button.
- `new/page.tsx` — New case declaration form (`/declarations/new`). 3-section form (A: patient, B: disease, C: clinical).
- `[casId]/page.tsx` — Individual case detail (`/declarations/:casId`). Two-column layout with patient sidebar + tabbed content.
- `[casId]/investigation/page.tsx` — Epidemiological investigation screen for a specific case.
- `[casId]/edit/page.tsx` — Edit form for an existing case.

## Case Statuses (workflow)
`nouveau` → `en_cours` → `confirmé` / `infirmé` → `clôturé`

## Access Control
- `medecin`: can view own cases only, can create new cases
- `epidemiologiste`: can view all cases, can update status
- `admin`: full access

## Components Used
- `CasListTable` from `@/components/declarations/cas-list-table`
- `CasFilters` from `@/components/declarations/cas-filters`
- `CasStatusBadge` from `@/components/declarations/cas-status-badge`
- `DeclarationForm` from `@/components/declarations/declaration-form`
