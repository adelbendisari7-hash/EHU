import { PrismaClient } from "@prisma/client"
import { GROUPES_MALADIES } from "./seeds/groupes-maladies"

const prisma = new PrismaClient()

async function main() {
  console.log("Updating diseases with groupe épidémiologique + seuils d'alerte...")

  let updatedCount = 0
  let seuilCount = 0

  for (const entry of GROUPES_MALADIES) {
    const maladie = await prisma.maladie.findUnique({
      where: { codeCim10: entry.codeCim10 },
    })

    if (!maladie) {
      console.log(`  ⚠ Maladie non trouvée: ${entry.codeCim10}`)
      continue
    }

    // Update maladie fields
    await prisma.maladie.update({
      where: { id: maladie.id },
      data: {
        groupeEpidemiologique: entry.groupe,
        seuilAlertTexte: entry.seuilTexte,
        delaiDeclarationTexte: entry.delaiTexte,
        seuilDefaut: entry.seuilNombre,
        delaiNotificationHeures: entry.delaiHeures,
      },
    })
    updatedCount++

    // Create or update national-level SeuilAlerte
    const existingSeuil = await prisma.seuilAlerte.findFirst({
      where: { maladieId: maladie.id, perimetre: "national" },
    })

    if (existingSeuil) {
      await prisma.seuilAlerte.update({
        where: { id: existingSeuil.id },
        data: {
          seuilNombre: entry.seuilNombre,
          periodejours: entry.periodeJours,
          gravite: entry.gravite,
          autoAlerte: true,
          autoNotification: true,
          isActive: true,
        },
      })
    } else {
      await prisma.seuilAlerte.create({
        data: {
          maladieId: maladie.id,
          perimetre: "national",
          seuilNombre: entry.seuilNombre,
          periodejours: entry.periodeJours,
          gravite: entry.gravite,
          autoAlerte: true,
          autoNotification: true,
          isActive: true,
        },
      })
    }
    seuilCount++

    console.log(`  ✓ ${maladie.nom} → ${entry.groupe} | seuil: ${entry.seuilTexte} | délai: ${entry.delaiTexte}`)
  }

  console.log(`\nDone: ${updatedCount} maladies updated, ${seuilCount} seuils d'alerte configurés.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
