import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()
async function main() {
  const rows = await prisma.etablissement.findMany({ orderBy: { nom: "asc" }, select: { id: true, nom: true, type: true, codeService: true } })
  console.log(`Total : ${rows.length} établissements\n`)
  rows.forEach((e, i) => console.log(`${String(i + 1).padStart(2, "0")} | ${(e.codeService ?? "—").padEnd(4)} | ${e.nom}`))
}
main().finally(() => prisma.$disconnect())
