# src/components/declarations/cas-detail/

Sub-components for the individual case detail page (`/declarations/:casId`). These components together compose the full case detail view.

## Components

### `case-header.tsx`
Top banner displaying case metadata and actions.
- Case identifiant (bold), maladie name, statut badge, date déclaration
- Actions dropdown (shadcn/ui `DropdownMenu`): Edit, Changer statut, Exporter PDF, Supprimer
- Role-aware: only shows actions the current user is permitted to perform
- Not a client component unless the actions dropdown requires it

### `patient-sidebar.tsx`
Fixed 280px left sidebar with patient information card.
- Patient identifiant, nom complet, âge (calculated from date_naissance), sexe badge
- Commune, wilaya, adresse
- "Voir dossier patient" link (navigates to `/patients/:patientId` if implemented)
- Attached files list with download links

### `tab-infos-patient.tsx`
Tab 1 content: full patient demographic details in a structured layout (grid of label-value pairs).

### `tab-donnees-cliniques.tsx`
Tab 2 content: clinical data — symptômes list, date début symptômes, hospitalisation status, médecin déclarant, établissement, observations text.

### `tab-resultats-labo.tsx` ("use client")
Tab 3 content: laboratory results.
- Upload zone for new lab result files (PDF/image)
- List of uploaded fichiers with preview/download
- File upload calls `POST /api/fichiers/upload`

### `tab-investigation.tsx`
Tab 4 content: summary of the linked investigation (if exists) with a "Voir l'investigation complète" button linking to `/declarations/:casId/investigation`. Shows contact count, investigation status, assigned épidémiologiste.
