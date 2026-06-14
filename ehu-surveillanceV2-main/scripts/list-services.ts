import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()
async function main() {
  // serviceDeclarant on CasDeclare
  const rows = await prisma.casDeclare.groupBy({
    by: ["serviceDeclarant"],
    _count: { id: true },
    orderBy: { serviceDeclarant: "asc" },
  })
  console.log(`\n${rows.length} services distincts dans cas_declares.service_declarant :\n`)
  rows.forEach((r, i) =>
    console.log(`  ${String(i + 1).padStart(2, "0")} | (${String(r._count.id).padStart(3)} cas) | ${r.serviceDeclarant ?? "(null)"}`)
  )

  // Also check MedecinDeclarant.service
  const medRows = await prisma.medecinDeclarant.groupBy({
    by: ["service"],
    _count: { id: true },
    orderBy: { service: "asc" },
  })
  console.log(`\n${medRows.length} services distincts dans medecins_declarants.service :\n`)
  medRows.forEach((r, i) =>
    console.log(`  ${String(i + 1).padStart(2, "0")} | (${String(r._count.id).padStart(3)} médecins) | ${r.service}`)
  )
}
main().finally(() => prisma.$disconnect())
