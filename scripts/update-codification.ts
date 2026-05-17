/**
 * Recalcule et met à jour tous les codeCas existants selon la nouvelle codification :
 * AAAA (année) + SS (code service, 2 chiffres) + CCCCC (CIM-10, 5 chars) + NNNN (séquentiel)
 *
 * Usage : npx tsx scripts/update-codification.ts
 */
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

function buildCodeCas(
  year: number,
  serviceCode: string | null,
  codeCim10: string | null,
  seq: number
): string {
  const ss = (serviceCode ?? "00").slice(0, 2).padStart(2, "0")
  const rawCim10 = (codeCim10 ?? "").slice(0, 5)
  const ccccc = rawCim10.padEnd(5, "-") || "-----"
  const nnnn = String(seq).padStart(4, "0")
  return `${year}${ss}${ccccc}${nnnn}`
}

async function main() {
  const declarations = await prisma.casDeclare.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      codeCas: true,
      anneeDeclaration: true,
      createdAt: true,
      etablissement: { select: { codeService: true } },
      maladie: { select: { codeCim10: true } },
    },
  })

  console.log(`→ ${declarations.length} déclarations à recoder`)

  // Group by (year, serviceCode) to assign sequential numbers per group
  const groups = new Map<string, typeof declarations>()

  for (const dec of declarations) {
    const year = dec.anneeDeclaration ?? dec.createdAt.getFullYear()
    const serviceCode = dec.etablissement?.codeService ?? null
    const ss = (serviceCode ?? "00").slice(0, 2).padStart(2, "0")
    const key = `${year}-${ss}`

    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(dec)
  }

  // Build update list: id → new codeCas
  const updates: { id: string; oldCode: string; newCode: string }[] = []

  for (const [, group] of groups) {
    let seq = 1
    for (const dec of group) {
      const year = dec.anneeDeclaration ?? dec.createdAt.getFullYear()
      const serviceCode = dec.etablissement?.codeService ?? null
      const codeCim10 = dec.maladie?.codeCim10 ?? null
      updates.push({ id: dec.id, oldCode: dec.codeCas, newCode: buildCodeCas(year, serviceCode, codeCim10, seq++) })
    }
  }

  // Check for duplicates
  const seen = new Set<string>()
  const duplicates: string[] = []
  for (const { newCode } of updates) {
    if (seen.has(newCode)) duplicates.push(newCode)
    seen.add(newCode)
  }
  if (duplicates.length > 0) {
    console.error("⚠ Doublons détectés :", duplicates)
    process.exit(1)
  }

  console.log(`→ Application des mises à jour via SQL...`)

  // Step 1: set all to unique temp codes to clear the unique constraint
  const tempCase = updates.map(({ id }) => `WHEN '${id}' THEN 'TEMP-${id}'`).join("\n    ")
  await prisma.$executeRawUnsafe(`
    UPDATE cas_declares
    SET code_cas = CASE id
      ${tempCase}
    END
    WHERE id IN (${updates.map(({ id }) => `'${id}'`).join(", ")})
  `)

  // Step 2: set final codes
  const finalCase = updates.map(({ id, newCode }) => `WHEN '${id}' THEN '${newCode}'`).join("\n    ")
  await prisma.$executeRawUnsafe(`
    UPDATE cas_declares
    SET code_cas = CASE id
      ${finalCase}
    END
    WHERE id IN (${updates.map(({ id }) => `'${id}'`).join(", ")})
  `)

  console.log(`✓ ${updates.length} codes mis à jour`)

  // Print sample
  console.log("\nAperçu (10 premiers) :")
  for (const { oldCode, newCode } of updates.slice(0, 10)) {
    console.log(`  ${oldCode.padEnd(30)} → ${newCode}`)
  }
  if (updates.length > 10) console.log(`  ... (${updates.length - 10} autres)`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
