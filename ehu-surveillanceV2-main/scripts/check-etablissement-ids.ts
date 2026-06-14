import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()
async function main() {
  const etab = await prisma.etablissement.findFirst({ select: { id: true, nom: true, codeService: true } })
  console.log("Etablissement:", etab)

  const total = await prisma.casDeclare.count()
  const withEtab = await prisma.casDeclare.count({ where: { etablissementId: { not: null } } })
  const withoutEtab = await prisma.casDeclare.count({ where: { etablissementId: null } })
  console.log(`\nTotal cas: ${total}`)
  console.log(`Avec etablissementId: ${withEtab}`)
  console.log(`Sans etablissementId: ${withoutEtab}`)

  // Show distinct etablissementIds
  const ids = await prisma.casDeclare.findMany({ distinct: ["etablissementId"], select: { etablissementId: true }, take: 10 })
  console.log("\nDistinct etablissementIds:", ids)
}
main().finally(() => prisma.$disconnect())
