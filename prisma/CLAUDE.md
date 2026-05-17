# prisma/

Prisma ORM configuration and database schema for the EHU surveillance system.

## Contents
- `schema.prisma` — Full database schema defining all models (Cas, Patient, Investigation, Alerte, User, Maladie, Etablissement, Wilaya, Commune, Contact, Notification, Fichier, AuditLog)
- `seed.ts` — Seeds initial reference data: 48 wilayas, 1541 communes, and the full list of maladies à déclaration obligatoire (MDO) for Algeria
- `migrations/` — Auto-generated migration history (do not edit manually)

## Key Commands
- `npx prisma generate` — Regenerate Prisma Client after schema changes
- `npx prisma migrate dev --name <migration-name>` — Create and apply a new migration in development
- `npx prisma migrate deploy` — Apply pending migrations in production
- `npx prisma db seed` — Run seed.ts to populate reference data
- `npx prisma studio` — Open Prisma Studio GUI to inspect the database

## Conventions
- All primary keys are UUIDs (`@id @default(uuid())`)
- All tables include `created_at` and `updated_at` timestamps
- Soft deletes preferred: use `is_active Boolean @default(true)` rather than hard deletes
- JSONB columns used for flexible data: `mesures_controle`, `zone_geographique`, `symptomes`
