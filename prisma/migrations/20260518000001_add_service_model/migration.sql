-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "code_service" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "services_nom_key" ON "services"("nom");
CREATE UNIQUE INDEX "services_code_service_key" ON "services"("code_service");

-- AlterTable
ALTER TABLE "cas_declares" ADD COLUMN "service_id" TEXT;

-- AddForeignKey
ALTER TABLE "cas_declares" ADD CONSTRAINT "cas_declares_service_id_fkey"
    FOREIGN KEY ("service_id") REFERENCES "services"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
