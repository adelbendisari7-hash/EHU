# src/app/(dashboard)/declarations/new/

New case declaration form. Served at `/declarations/new`. Accessible to médecin and épidémiologiste roles.

## Form Sections

### Section A — Informations Patient
- Nom, prénom, date de naissance, sexe, adresse, commune, wilaya
- Identifiant patient: auto-generated as `YYYYMMDD-XXXX` (see `generate-id.ts`)
- Deduplication check: on blur of nom+prénom+date_naissance, calls `GET /api/patients?search=...` to detect existing patients

### Section B — Informations sur la Maladie
- Maladie (dropdown from `/api/maladies`)
- Date de début des symptômes, date de déclaration
- Statut initial: defaults to `nouveau`
- Source de notification (médecin, laboratoire, communauté)

### Section C — Informations Médicales
- Établissement déclarant (pre-filled from user's établissement)
- Symptômes (multi-select checkboxes)
- Hospitalisation (oui/non toggle)
- Médecin déclarant (pre-filled from current user)
- Observations libres (textarea)

## Behavior
- Validation: React Hook Form + Zod schema (`createCasSchema` from `@/lib/validators`)
- Submission: `POST /api/cas` — creates patient (if new) and case simultaneously
- On success: redirect to `/declarations/:newCasId`
- On error: inline field errors + toast notification

## Auto-Generated Fields
- `identifiant_patient`: generated client-side using `generatePatientId()` from `@/utils/generate-id`
- `declared_by`: injected server-side from the authenticated user's session
