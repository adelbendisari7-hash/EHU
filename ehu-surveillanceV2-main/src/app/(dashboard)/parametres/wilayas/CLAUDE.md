# src/app/(dashboard)/parametres/wilayas/

Manage wilayas and communes geographic reference data. Served at `/parametres/wilayas`. Admin only.

## Data
- **48 wilayas** of Algeria with their official codes (01–58, some numbers unused)
- **1541 communes** distributed across the 48 wilayas
- Initial data seeded from `src/constants/wilayas.ts` via `prisma/seed.ts`

## Page Content
- Left panel: list of 48 wilayas with commune count per wilaya
- Right panel: on wilaya selection, shows list of communes in that wilaya

## Operations
- **View only** for communes (rarely edited; seeded once from official data)
- Wilaya metadata (code, nom) is read-only
- Admin can add a new commune if a new one is officially created (rare)
- Admin can toggle commune `is_active` status

## Important Note
This data is the geographic backbone of the entire system. Avoid deleting or modifying wilaya/commune codes as they are used as foreign keys in:
- Patients (commune_id)
- Cas déclarés (commune_id)
- Établissements (commune_id, wilaya_id)
- Investigations (zone_geographique)
- Alertes (commune_id, wilaya_id)

## Cache
The `/api/communes` endpoint is heavily cached (`revalidate: 3600`). Changes here require manual cache invalidation.
