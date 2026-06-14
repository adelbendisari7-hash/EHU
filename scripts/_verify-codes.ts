import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()
async function main() {
  const cases = await prisma.casDeclare.findMany({
    take: 6,
    orderBy: { createdAt: "asc" },
    select: {
      codeCas: true,
      dateDiagnostic: true,
      createdAt: true,
      maladie: { select: { nom: true, codeCim10: true } },
      serviceRef: { select: { nom: true, codeService: true } },
    },
  })
  for (const c of cases) {
    const code = c.codeCas
    console.log(`Code    : ${code}  (longueur: ${code.length})`)
    console.log(`  Année   : ${code.slice(0, 4)}`)
    console.log(`  Service : ${code.slice(4, 6)}  → ${c.serviceRef?.nom} (codeService: ${c.serviceRef?.codeService})`)
    console.log(`  CIM-10  : ${code.slice(6, 11)} → ${c.maladie?.codeCim10}`)
    console.log(`  Seq     : ${code.slice(11, 15)}`)
    console.log(`  dateDiag: ${c.dateDiagnostic?.toISOString().slice(0, 10)}`)
    console.log(`  createdAt: ${c.createdAt.toISOString().slice(0, 10)}  ${c.dateDiagnostic?.toISOString().slice(0, 10) === c.createdAt.toISOString().slice(0, 10) ? "✓ identique" : "✗ DIFFERENT"}`)
    console.log()
  }
  const total = await prisma.casDeclare.count()
  const byDate = await prisma.$queryRaw<{jour: string; nb: bigint}[]>`
    SELECT DATE(date_diagnostic) as jour, COUNT(*) as nb
    FROM cas_declares
    GROUP BY DATE(date_diagnostic)
    ORDER BY jour
    LIMIT 10
  `
  console.log(`\nTotal cas: ${total}`)
  console.log("10 premières dates :")
  for (const r of byDate) console.log(`  ${r.jour}  ${r.nb} cas`)
}
main().catch(console.error).finally(() => prisma.$disconnect())
