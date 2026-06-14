import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

async function main() {
  // Chercher les cas qui ont une ficheSpecifiqueType
  const casAvecFiche = await prisma.casDeclare.findMany({
    where: { ficheSpecifiqueType: { not: null } },
    select: {
      id: true,
      codeCas: true,
      ficheSpecifiqueType: true,
      donneesSpecifiques: true,
      fichiers: { select: { id: true, type: true, filename: true, url: true } },
    },
    take: 5,
    orderBy: { createdAt: "desc" },
  })

  console.log(`\n=== CAS AVEC FICHE SPÉCIFIQUE (${casAvecFiche.length}) ===`)
  for (const c of casAvecFiche) {
    console.log(`\nCas: ${c.codeCas}`)
    console.log(`  ficheSpecifiqueType: ${c.ficheSpecifiqueType}`)
    console.log(`  donneesSpecifiques: ${JSON.stringify(c.donneesSpecifiques, null, 2)}`)
    console.log(`  fichiers (${c.fichiers.length}):`, c.fichiers)
  }

  // Chercher des cas qui ont des fichiers
  const casAvecFichiers = await prisma.casDeclare.findMany({
    where: { fichiers: { some: {} } },
    select: {
      codeCas: true,
      fichiers: { select: { id: true, type: true, filename: true, url: true } },
    },
    take: 5,
    orderBy: { createdAt: "desc" },
  })

  console.log(`\n=== CAS AVEC FICHIERS (${casAvecFichiers.length}) ===`)
  for (const c of casAvecFichiers) {
    console.log(`Cas: ${c.codeCas}`)
    console.log(`  fichiers:`, c.fichiers)
  }
}

main().finally(() => prisma.$disconnect())
