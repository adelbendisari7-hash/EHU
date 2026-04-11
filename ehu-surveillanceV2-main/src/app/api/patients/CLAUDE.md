# src/app/api/patients/

Patient API. Patients are created automatically when a new case is declared. This endpoint is primarily used for deduplication checks.

## Routes

### `GET /api/patients`
Search patients for deduplication during case declaration.

Query parameters:
- `search` — searches across: nom, prénom, identifiant_patient, date_naissance (YYYY-MM-DD)
- `nom` + `prenom` + `date_naissance` — combination search for exact deduplication check

Returns: array of matching patients (without sensitive medical details). Maximum 10 results.

Access: médecin and épidémiologiste roles.

### `GET /api/patients/:id`
Returns a single patient with their case history (list of linked cases with disease name and status).

Access: épidémiologiste and admin only (full patient history is sensitive).

## Patient Identifiant Generation
Format: `YYYYMMDD-XXXX` where:
- `YYYYMMDD` = date of first declaration
- `XXXX` = sequential 4-digit counter for that day, zero-padded

Example: `20240315-0042` = 42nd patient declared on March 15, 2024.

Generated client-side for preview, confirmed server-side on creation to handle concurrency.

## Privacy Notes
- Patient data is pseudonymized in all exports
- Patient search results do not include commune/adresse — only name, identifiant, age, sexe for deduplication purposes
