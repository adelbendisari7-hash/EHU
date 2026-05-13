-- Migration: simplify CasStatut to 'brouillon', 'suspect', 'confirme'
-- Run this BEFORE running: npx prisma migrate dev --name simplify-statuts

-- Step 1: Map old statuses (keep brouillon, map others)
UPDATE "cas_declares" SET "statut" = 'suspect'  WHERE "statut" IN ('nouveau', 'en_cours', 'infirme');
UPDATE "cas_declares" SET "statut" = 'confirme' WHERE "statut" = 'cloture';
-- brouillon stays as brouillon

-- Step 2: Recreate the enum with 3 values (PostgreSQL requires type recreation)
ALTER TYPE "CasStatut" RENAME TO "CasStatut_old";
CREATE TYPE "CasStatut" AS ENUM ('brouillon', 'suspect', 'confirme');
ALTER TABLE "cas_declares"
  ALTER COLUMN "statut" TYPE "CasStatut"
  USING "statut"::text::"CasStatut";
ALTER TABLE "cas_declares" ALTER COLUMN "statut" SET DEFAULT 'suspect';
DROP TYPE "CasStatut_old";
