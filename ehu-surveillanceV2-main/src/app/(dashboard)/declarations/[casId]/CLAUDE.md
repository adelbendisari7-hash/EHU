# src/app/(dashboard)/declarations/[casId]/

Dynamic route for an individual declared case. The `casId` URL parameter is a UUID.

## Pages
- `page.tsx` — Case detail view (`/declarations/:casId`). Two-column layout:
  - **Left sidebar (280px, fixed)** — Patient info card: identifiant, nom, prénom, âge, sexe, commune, adresse. Sticky on scroll.
  - **Right content (flex-1)** — Tabbed interface with 4 tabs:
    1. Informations Patient
    2. Données Cliniques
    3. Résultats Laboratoire
    4. Investigation
- `investigation/page.tsx` — Full epidemiological investigation screen
- `edit/page.tsx` — Edit form pre-filled with existing case data

## Actions Available (based on role)
- **Médecin (own cases only)**: edit, add lab results
- **Épidémiologiste**: change status, start investigation, edit
- **Admin**: all actions including delete

## Data Fetching
Case data fetched server-side from `GET /api/cas/:casId` which returns the full case with patient, maladie, établissement, and investigation data.

## Case Header
Displays: case identifiant, maladie name, status badge, date declared, and an actions dropdown (Edit, Change Status, Export PDF, Delete).
