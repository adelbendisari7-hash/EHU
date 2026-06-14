/**
 * Backfill manquants :
 * 1. Tous les cas avec evolution = NULL → 'toujours_malade'
 * 2. Tous les cas avec statut = 'brouillon' → 'suspect'
 */
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  // 1. Backfill evolution NULL → toujours_malade
  const evolutionResult = await prisma.casDeclare.updateMany({
    where: { evolution: null },
    data: { evolution: "toujours_malade" },
  })
  console.log(`✓ Evolution renseignée : ${evolutionResult.count} cas mis à jour (→ toujours_malade)`)

  // 2. Backfill statut brouillon → suspect
  const statutResult = await prisma.casDeclare.updateMany({
    where: { statut: "brouillon" },
    data: { statut: "suspect" },
  })
  console.log(`✓ Statut brouillon → suspect : ${statutResult.count} cas mis à jour`)

  console.log("\nBackfill terminé.")
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
