import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

async function main() {
  const services = await prisma.service.findMany({ take: 5, select: { id: true, nom: true } })
  const germes   = await prisma.germe.findMany({ take: 7, select: { id: true, nom: true } })

  if (!services.length) { console.log("Aucun service — relancez le seed principal"); return }
  if (!germes.length)   { console.log("Aucun germe — relancez le seed principal");   return }

  const types: ("PAVM" | "ISO" | "Autre")[] = ["PAVM", "ISO", "Autre"]
  let count = 0

  for (let i = 0; i < 24; i++) {
    await prisma.infectionIAS.create({
      data: {
        typeIAS:        types[i % 3],
        serviceId:      services[i % services.length].id,
        germeId:        germes[i % germes.length].id,
        isBMR:          i % 4 === 0,
        dateDetection:  new Date(Date.now() - i * 2 * 24 * 3600 * 1000),
        agePatient:     20 + (i % 50),
        sexePatient:    i % 2 === 0 ? "homme" : "femme",
        statut:         i % 5 === 0 ? "resolu" : "en_cours",
        notes:          `IAS test #${i + 1}`,
      },
    })
    count++
  }

  console.log(`✓ ${count} IAS créées`)
  console.log(`  Services : ${services.map(s => s.nom).join(" | ")}`)
  console.log(`  Germes   : ${germes.map(g => g.nom).join(" | ")}`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
