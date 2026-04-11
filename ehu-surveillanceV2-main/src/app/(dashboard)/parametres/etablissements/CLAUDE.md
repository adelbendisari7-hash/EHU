# src/app/(dashboard)/parametres/etablissements/

Manage health establishments. Served at `/parametres/etablissements`. Admin only.

## Page Content
A CRUD table of all establishments with columns:
- Nom de l'établissement
- Type (CHU, EHU, EPH, EPSP, Clinique privée, Cabinet, Laboratoire)
- Commune
- Wilaya
- Adresse
- Statut (Actif / Inactif)
- Actions (Edit, Toggle)

## Operations

### Add Establishment
- "Ajouter un établissement" button opens a dialog form
- Fields: nom, type (select), wilaya (select), commune (select, filtered by wilaya), adresse (textarea), is_active
- Submission: `POST /api/etablissements`

### Edit Establishment
- Dialog form pre-filled with existing data
- `PATCH /api/etablissements/:id`

### Deactivate
- Inactive establishments do not appear in the login dropdown or declaration form
- Existing users and cases linked to inactive establishments are unaffected

## Usage
Establishments are used in:
1. Login form dropdown (which structure the user belongs to)
2. Case declaration form (établissement déclarant, pre-filled)
3. User creation/edit form

## Cache
Changes here invalidate the `/api/etablissements` cache (`revalidateTag('etablissements')`).
