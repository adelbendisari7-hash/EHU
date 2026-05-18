/**
 * 1. Crée les services distincts (depuis serviceDeclarant) avec codes 01..N
 * 2. Lie chaque CasDeclare à son Service via serviceId
 * 3. Recalcule tous les codeCas avec le bon code service
 *
 * Usage : npx tsx scripts/assign-service-codes.ts
 */
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

function buildCodeCas(year: number, serviceCode: string | null, codeCim10: string | null, seq: number): string {
  const ss = (serviceCode ?? "00").slice(0, 2).padStart(2, "0")
  const ccccc = ((codeCim10 ?? "").slice(0, 5)).padEnd(5, "-") || "-----"
  return `${year}${ss}${ccccc}${String(seq).padStart(4, "0")}`
}

async function main() {
  // ── 1. Collecter les services distincts ───────────────────────────────────
  const rows = await prisma.casDeclare.groupBy({
    by: ["serviceDeclarant"],
    _count: { id: true },
    orderBy: { serviceDeclarant: "asc" },
  })

  const serviceNames = rows
    .map(r => r.serviceDeclarant)
    .filter((s): s is string => s !== null)
    .sort((a, b) => a.localeCompare(b, "fr"))

  console.log(`\n→ ${serviceNames.length} services distincts à créer :\n`)

  // ── 2. Créer les services avec codes séquentiels ──────────────────────────
  const serviceMap = new Map<string, { id: string; code: string }>()

  for (let i = 0; i < serviceNames.length; i++) {
    const nom = serviceNames[i]
    const code = String(i + 1).padStart(2, "0")

    const existing = await prisma.service.findUnique({ where: { nom } })
    let id: string
    if (existing) {
      await prisma.service.update({ where: { nom }, data: { codeService: code } })
      id = existing.id
    } else {
      const created = await prisma.service.create({ data: { nom, codeService: code } })
      id = created.id
    }
    serviceMap.set(nom, { id, code })
    console.log(`  ${code} → ${nom}`)
  }

  // ── 3. Lier les déclarations à leur service via serviceId ─────────────────
  console.log(`\n→ Liaison des déclarations à leurs services...`)
  let linked = 0
  for (const [nom, { id }] of serviceMap) {
    const result = await prisma.casDeclare.updateMany({
      where: { serviceDeclarant: nom, serviceId: null },
      data: { serviceId: id },
    })
    linked += result.count
  }
  console.log(`  ${linked} déclarations liées`)

  // ── 4. Recharger les données pour la recodification ───────────────────────
  const declarations = await prisma.casDeclare.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true, codeCas: true, anneeDeclaration: true, createdAt: true,
      serviceRef: { select: { codeService: true } },
      maladie: { select: { codeCim10: true } },
    },
  })
  console.log(`\n→ ${declarations.length} déclarations à recoder`)

  // Grouper par (année, codeService)
  const groups = new Map<string, typeof declarations>()
  for (const dec of declarations) {
    const year = dec.anneeDeclaration ?? dec.createdAt.getFullYear()
    const sc = dec.serviceRef?.codeService ?? "00"
    const key = `${year}-${sc}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(dec)
  }

  const updates: { id: string; oldCode: string; newCode: string }[] = []
  for (const [, group] of groups) {
    let seq = 1
    for (const dec of group) {
      const year = dec.anneeDeclaration ?? dec.createdAt.getFullYear()
      const sc = dec.serviceRef?.codeService ?? "00"
      updates.push({
        id: dec.id,
        oldCode: dec.codeCas,
        newCode: buildCodeCas(year, sc, dec.maladie?.codeCim10 ?? null, seq++),
      })
    }
  }

  // Vérifier les doublons
  const seen = new Set<string>()
  for (const { newCode } of updates) {
    if (seen.has(newCode)) { console.error(`⚠ Doublon : ${newCode}`); process.exit(1) }
    seen.add(newCode)
  }

  // Appliquer en 2 passes SQL
  const ids = updates.map(u => `'${u.id}'`).join(", ")
  const tempCase = updates.map(u => `WHEN '${u.id}' THEN 'TEMP-${u.id}'`).join("\n    ")
  const finalCase = updates.map(u => `WHEN '${u.id}' THEN '${u.newCode}'`).join("\n    ")

  await prisma.$executeRawUnsafe(`UPDATE cas_declares SET code_cas = CASE id ${tempCase} END WHERE id IN (${ids})`)
  await prisma.$executeRawUnsafe(`UPDATE cas_declares SET code_cas = CASE id ${finalCase} END WHERE id IN (${ids})`)

  console.log(`✓ ${updates.length} codes mis à jour\n`)
  console.log("Aperçu (15 premiers) :")
  for (const { oldCode, newCode } of updates.slice(0, 15))
    console.log(`  ${oldCode.padEnd(20)} → ${newCode}`)
  if (updates.length > 15) console.log(`  ... (${updates.length - 15} autres)`)
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
