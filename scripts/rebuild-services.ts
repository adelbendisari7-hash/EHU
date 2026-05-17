/**
 * 1. Supprime tous les services existants
 * 2. Crée la liste complète des 42 services de l'EHU Oran avec codes 01..42
 * 3. Fusionne les doublons (plusieurs noms → un seul service canonique)
 * 4. Lie toutes les déclarations au bon service
 * 5. Recodifie tous les codeCas
 *
 * Usage : npx tsx scripts/rebuild-services.ts
 */
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// ── Liste canonique des 42 services de l'EHU Oran ────────────────────────────
// Code attribué par ordre alphabétique, 01 → 42
const SERVICES: { nom: string; aliases: string[] }[] = [
  { nom: "Anesthésie-Réanimation",                  aliases: [] },
  { nom: "Anatomie et Cytologie Pathologiques",      aliases: [] },
  { nom: "Bactériologie-Virologie",                  aliases: ["31 — Bactériologie", "Bactériologie"] },
  { nom: "Biochimie Clinique",                       aliases: [] },
  { nom: "Cardiologie",                              aliases: ["02 — Cardiologie"] },
  { nom: "Chirurgie Cardio-Vasculaire",              aliases: [] },
  { nom: "Chirurgie Générale",                       aliases: [] },
  { nom: "Chirurgie Maxillo-Faciale et Stomatologie",aliases: [] },
  { nom: "Chirurgie Orthopédique et Traumatologie",  aliases: [] },
  { nom: "Chirurgie Plastique et Reconstructrice",   aliases: [] },
  { nom: "Chirurgie Thoracique",                     aliases: ["19 — Chirurgie thoracique"] },
  { nom: "Chirurgie Vasculaire",                     aliases: [] },
  { nom: "Dermatologie",                             aliases: [] },
  { nom: "Endocrinologie et Diabétologie",           aliases: [] },
  { nom: "Épidémiologie et Médecine Préventive",     aliases: ["Épidémiologique"] },
  { nom: "Gastro-Entérologie",                       aliases: [] },
  { nom: "Gynécologie-Obstétrique",                  aliases: [] },
  { nom: "Hématologie Biologique",                   aliases: [] },
  { nom: "Hématologie Clinique",                     aliases: [] },
  { nom: "Hygiène Hospitalière",                     aliases: [] },
  { nom: "Immunologie Clinique",                     aliases: [] },
  { nom: "Infectiologie",                            aliases: ["maladies infectieuses ", "maladies infectieuses"] },
  { nom: "Médecine du Travail",                      aliases: [] },
  { nom: "Médecine Interne",                         aliases: [] },
  { nom: "Médecine Nucléaire",                       aliases: [] },
  { nom: "Médecine Physique et Réadaptation",        aliases: ["MPR"] },
  { nom: "Néonatologie",                             aliases: [] },
  { nom: "Néphrologie",                              aliases: [] },
  { nom: "Neurochirurgie",                           aliases: [] },
  { nom: "Neurologie",                               aliases: [] },
  { nom: "Oncologie Médicale",                       aliases: [] },
  { nom: "Ophtalmologie",                            aliases: [] },
  { nom: "ORL et Chirurgie Cervico-Faciale",         aliases: [] },
  { nom: "Parasitologie-Mycologie",                  aliases: [] },
  { nom: "Pédiatrie",                                aliases: [] },
  { nom: "Pharmacie Hospitalière",                   aliases: [] },
  { nom: "Pneumologie",                              aliases: [] },
  { nom: "Psychiatrie",                              aliases: [] },
  { nom: "Radiologie et Imagerie Médicale",          aliases: [] },
  { nom: "Réanimation Médicale",                     aliases: ["25 — Réanimation médicale"] },
  { nom: "Rhumatologie",                             aliases: [] },
  { nom: "Urologie",                                 aliases: [] },
  { nom: "Urgences Médico-Chirurgicales",            aliases: ["Urgences"] },
]

function buildCodeCas(year: number, serviceCode: string | null, codeCim10: string | null, seq: number): string {
  const ss = (serviceCode ?? "00").slice(0, 2).padStart(2, "0")
  const ccccc = ((codeCim10 ?? "").slice(0, 5)).padEnd(5, "-") || "-----"
  return `${year}${ss}${ccccc}${String(seq).padStart(4, "0")}`
}

async function main() {
  // ── 1. Supprimer les services existants (délier d'abord les cas) ──────────
  console.log("→ Nettoyage des services existants...")
  await prisma.casDeclare.updateMany({ data: { serviceId: null } })
  await prisma.service.deleteMany({})

  // ── 2. Créer la liste canonique avec codes séquentiels ───────────────────
  console.log(`→ Création de ${SERVICES.length} services...\n`)
  const serviceIdMap = new Map<string, string>() // nomCanonique ou alias → serviceId

  for (let i = 0; i < SERVICES.length; i++) {
    const { nom, aliases } = SERVICES[i]
    const code = String(i + 1).padStart(2, "0")
    const created = await prisma.service.create({ data: { nom, codeService: code } })
    console.log(`  ${code} → ${nom}`)

    // Enregistrer le nom canonique et tous ses alias
    serviceIdMap.set(nom.toLowerCase().trim(), created.id)
    for (const alias of aliases) {
      serviceIdMap.set(alias.toLowerCase().trim(), created.id)
    }
  }

  // ── 3. Lier les déclarations à leur service canonique ─────────────────────
  console.log(`\n→ Liaison des déclarations...`)
  let linked = 0
  let unmatched = 0

  const declarations = await prisma.casDeclare.findMany({
    select: { id: true, serviceDeclarant: true },
  })

  for (const dec of declarations) {
    if (!dec.serviceDeclarant) { unmatched++; continue }
    const key = dec.serviceDeclarant.toLowerCase().trim()
    const serviceId = serviceIdMap.get(key)
    if (serviceId) {
      await prisma.casDeclare.update({ where: { id: dec.id }, data: { serviceId } })
      linked++
    } else {
      console.warn(`  ⚠ Pas de correspondance pour : "${dec.serviceDeclarant}"`)
      unmatched++
    }
  }
  console.log(`  ${linked} liées, ${unmatched} sans correspondance`)

  // ── 4. Recodifier tous les codeCas ────────────────────────────────────────
  const allDecs = await prisma.casDeclare.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true, codeCas: true, anneeDeclaration: true, createdAt: true,
      serviceRef: { select: { codeService: true } },
      maladie: { select: { codeCim10: true } },
    },
  })
  console.log(`\n→ Recodification de ${allDecs.length} déclarations...`)

  const groups = new Map<string, typeof allDecs>()
  for (const dec of allDecs) {
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
        id: dec.id, oldCode: dec.codeCas,
        newCode: buildCodeCas(year, sc, dec.maladie?.codeCim10 ?? null, seq++),
      })
    }
  }

  const seen = new Set<string>()
  for (const { newCode } of updates) {
    if (seen.has(newCode)) { console.error(`⚠ Doublon code : ${newCode}`); process.exit(1) }
    seen.add(newCode)
  }

  const ids = updates.map(u => `'${u.id}'`).join(", ")
  const tempCase = updates.map(u => `WHEN '${u.id}' THEN 'TEMP-${u.id}'`).join("\n    ")
  const finalCase = updates.map(u => `WHEN '${u.id}' THEN '${u.newCode}'`).join("\n    ")

  await prisma.$executeRawUnsafe(`UPDATE cas_declares SET code_cas = CASE id ${tempCase} END WHERE id IN (${ids})`)
  await prisma.$executeRawUnsafe(`UPDATE cas_declares SET code_cas = CASE id ${finalCase} END WHERE id IN (${ids})`)

  console.log(`✓ ${updates.length} codes mis à jour\n`)
  console.log("Aperçu :")
  for (const { newCode } of updates.slice(0, 12))
    console.log(`  ${newCode}`)
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
