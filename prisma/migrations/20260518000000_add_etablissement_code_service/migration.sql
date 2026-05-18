-- AlterTable
ALTER TABLE "etablissements" ADD COLUMN "code_service" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "etablissements_code_service_key" ON "etablissements"("code_service");
