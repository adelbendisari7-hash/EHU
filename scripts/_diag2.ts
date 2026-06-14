import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()
async function main() {
  const all = await prisma.casDeclare.findMany({
    select: { codeCas: true, dateDiagnostic: true, createdAt: true }
  })
  console.log("Total cas:", all.length)
  const byDate: Record<string, number> = {}
  for (const c of all) {
    const d = (c.dateDiagnostic ?? c.createdAt).toISOString().slice(0, 10)
    byDate[d] = (byDate[d] ?? 0) + 1
  }
  const sorted = Object.entries(byDate).sort(([a],[b]) => a.localeCompare(b))
  console.log("\nRépartition par date (toutes) :")
  for (const [date, n] of sorted) {
    console.log(`  ${date}  ${String(n).padStart(4)}  ${"█".repeat(Math.min(n, 60))}`)
  }
  const codes = all.slice(0, 5).map(c => c.codeCas)
  console.log("\nExemples de codes :", codes)
}
main().catch(console.error).finally(() => prisma.$disconnect())
