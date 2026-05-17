# src/app/(dashboard)/parametres/maladies/

Manage notifiable diseases (maladies à déclaration obligatoire — MDO). Served at `/parametres/maladies`. Admin only.

## Page Content
A CRUD table of all MDO diseases with columns:
- Code MDO (e.g., MDO-001)
- Nom de la maladie (French)
- Catégorie (respiratoire, digestive, vectorielle, zoonotique, etc.)
- Seuil d'alerte (number of cases to trigger an automatic alert)
- Statut (Actif / Inactif toggle)
- Actions (Edit, Toggle active/inactive)

## Operations

### Add Disease
- "Ajouter une maladie" button opens a dialog form
- Fields: nom, code_mdo, catégorie, seuil_alerte (number), is_active (toggle)
- Submission: `POST /api/maladies`

### Edit Disease
- Inline edit or dialog form
- All fields editable
- `PATCH /api/maladies/:id`

### Toggle Active/Inactive
- Inactive diseases cannot be selected in new case declarations
- Existing cases linked to inactive diseases remain unaffected

## Initial Data
The initial list of Algeria MDO diseases is seeded from `src/constants/maladies-mdo.ts` via `prisma/seed.ts`.

## Cache
Changes here invalidate the `/api/maladies` cache (`revalidateTag('maladies')`).
