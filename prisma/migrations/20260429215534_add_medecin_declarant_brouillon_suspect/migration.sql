-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "CasStatut" ADD VALUE 'brouillon';
ALTER TYPE "CasStatut" ADD VALUE 'suspect';

-- DropForeignKey
ALTER TABLE "cas_declares" DROP CONSTRAINT "cas_declares_maladie_id_fkey";

-- AlterTable
ALTER TABLE "cas_declares" ADD COLUMN     "medecin_declarant_id" TEXT,
ALTER COLUMN "maladie_id" DROP NOT NULL,
ALTER COLUMN "date_debut_symptomes" DROP NOT NULL,
ALTER COLUMN "date_diagnostic" DROP NOT NULL;

-- CreateTable
CREATE TABLE "medecins_declarants" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medecins_declarants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "medecins_declarants_nom_prenom_service_key" ON "medecins_declarants"("nom", "prenom", "service");

-- AddForeignKey
ALTER TABLE "cas_declares" ADD CONSTRAINT "cas_declares_maladie_id_fkey" FOREIGN KEY ("maladie_id") REFERENCES "maladies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cas_declares" ADD CONSTRAINT "cas_declares_medecin_declarant_id_fkey" FOREIGN KEY ("medecin_declarant_id") REFERENCES "medecins_declarants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
