/**
 * scripts/reset-and-reseed.ts
 *
 * 1. Supprime TOUS les cas existants (toutes origines).
 * 2. Recrée ~400 déclarations avec :
 *    - Codification officielle  AAAA{SS}{CCCCC}{NNNN}  (ex: 202604A23--0001)
 *    - createdAt  == dateDiagnostic  → le système voit la vraie date de création
 *    - Distribution réaliste : 3 à 8 cas / jour sur 90 jours
 *
 * Usage: npx tsx scripts/reset-and-reseed.ts
 */
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// Compteur en mémoire pour les codes — évite les collisions de la version DB
const codeCounters: Record<string, number> = {}
function nextCodeCas(year: number, codeService: string, codeCim10: string): string {
  const ss    = (codeService ?? "00").slice(0, 2).padStart(2, "0")
  const ccccc = ((codeCim10 ?? "").slice(0, 5)).padEnd(5, "-")
  const key   = `${year}${ss}${ccccc}`
  codeCounters[key] = (codeCounters[key] ?? 0) + 1
  const nnnn = String(codeCounters[key]).padStart(4, "0")
  return `${year}${ss}${ccccc}${nnnn}`
}

// ─── Calendrier ──────────────────────────────────────────────────────────────
// 90 jours de données. Chaque entrée = { daysAgo, count }.
// Moyenne ≈ 4-5 cas/j. Pic les 14 derniers jours. Jamais aujourd'hui.
const CALENDAR: { daysAgo: number; count: number }[] = [
  // il y a 90–61 j : activité basse (3–4 cas, 3 jours sur 5)
  ...([88,85,82,80,78,75,73,70,68,65,63,61] as const).map((d, i) => ({ daysAgo: d, count: 3 + (i % 2) })),
  // il y a 60–31 j : montée douce (4–6 cas, quasi quotidien)
  ...([60,58,56,54,52,50,48,46,44,42,40,38,36,34,32,30] as const).map((d, i) => ({ daysAgo: d, count: 4 + (i % 3) })),
  // il y a 30–15 j : activité soutenue (5–7 cas/j)
  { daysAgo: 29, count: 5 }, { daysAgo: 28, count: 6 }, { daysAgo: 27, count: 5 },
  { daysAgo: 26, count: 7 }, { daysAgo: 25, count: 5 }, { daysAgo: 24, count: 6 },
  { daysAgo: 23, count: 6 }, { daysAgo: 22, count: 5 }, { daysAgo: 21, count: 7 },
  { daysAgo: 20, count: 6 }, { daysAgo: 19, count: 5 }, { daysAgo: 18, count: 7 },
  { daysAgo: 17, count: 6 }, { daysAgo: 16, count: 5 }, { daysAgo: 15, count: 7 },
  // il y a 14–8 j : pic modéré (6–8 cas/j)
  { daysAgo: 14, count: 6 }, { daysAgo: 13, count: 7 }, { daysAgo: 12, count: 8 },
  { daysAgo: 11, count: 7 }, { daysAgo: 10, count: 8 }, { daysAgo:  9, count: 7 },
  { daysAgo:  8, count: 8 },
  // il y a 7–2 j : pic épidémique (7–8 cas/j, déclenche les seuils)
  { daysAgo: 7, count: 7 }, { daysAgo: 6, count: 8 }, { daysAgo: 5, count: 8 },
  { daysAgo: 4, count: 7 }, { daysAgo: 3, count: 8 }, { daysAgo: 2, count: 7 },
  { daysAgo: 1, count: 6 },
]

// ─── Maladies épidémiques (priorité dans les 14 derniers jours) ───────────────
const SPIKE_KEYWORDS = ["rougeole", "meningocoque", "typhoide", "paludisme", "cholera",
                        "dengue", "grippe", "meningite virale", "covid", "tuberculose pulm"]

function normalize(s: string) { return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "") }
function rand<T>(arr: T[]): T  { return arr[Math.floor(Math.random() * arr.length)] }
function randInt(a: number, b: number) { return Math.floor(Math.random() * (b - a + 1)) + a }
function shuffle<T>(a: T[]): T[] {
  const r = [...a]
  for (let i = r.length - 1; i > 0; i--) { const j = randInt(0, i); [r[i], r[j]] = [r[j], r[i]] }
  return r
}
type Statut = "brouillon" | "suspect" | "confirme"
function pickStatut(): Statut {
  const r = Math.random()
  if (r < 0.50) return "confirme"
  if (r < 0.85) return "suspect"
  return "brouillon"
}
function dateAt(daysAgo: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(randInt(7, 19), randInt(0, 59), randInt(0, 59), 0)
  d.setMilliseconds(0)
  return d
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  // 1. Supprimer tous les cas existants
  console.log("🗑  Suppression de tous les cas existants...")
  await prisma.casSymptome.deleteMany({})
  await prisma.casLieu.deleteMany({})
  await prisma.resultatLabo.deleteMany({})
  await prisma.fichier.deleteMany({})
  await prisma.investigation.deleteMany({})
  await prisma.protocoleDeclenchement.deleteMany({})
  const del = await prisma.casDeclare.deleteMany({})
  console.log(`   → ${del.count} cas supprimés\n`)

  // 2. Charger les références
  console.log("🔍 Chargement des références...")
  const maladies  = await prisma.maladie.findMany({
    where: { isActive: true, categorie: { in: ["categorie_1_mdo", "categorie_2_epidemique"] } },
    select: { id: true, nom: true, codeCim10: true },
  })
  const patients  = await prisma.patient.findMany({ select: { id: true } })
  const services  = await prisma.service.findMany({
    where: { isActive: true },
    select: { id: true, nom: true, codeService: true },
  })
  const communes  = await prisma.commune.findMany({
    where: { wilaya: { nom: "Oran" } },
    select: { id: true },
  })
  const etab = await prisma.etablissement.findFirst({
    where: { nom: { contains: "EHU" } },
    select: { id: true },
  })

  if (patients.length === 0) throw new Error("Aucun patient — lancez d'abord npm run db:seed")
  if (services.length === 0) throw new Error("Aucun service — lancez d'abord npm run db:seed")
  console.log(`   → ${maladies.length} maladies MDO, ${patients.length} patients, ${services.length} services, ${communes.length} communes Oran`)

  const totalCas = CALENDAR.reduce((s, d) => s + d.count, 0)
  console.log(`   → ${totalCas} cas à créer sur ${CALENDAR.length} jours\n`)

  // 3. Séparer maladies spike / normales
  const spikeM  = maladies.filter(m => SPIKE_KEYWORDS.some(kw => normalize(m.nom).includes(kw)))
  const normalM = maladies.filter(m => !SPIKE_KEYWORDS.some(kw => normalize(m.nom).includes(kw)))

  const spikePool  = shuffle([...spikeM,  ...spikeM,  ...spikeM,  ...normalM])
  const normalPool = shuffle([...normalM, ...normalM, ...spikeM])

  // 4. Insérer
  console.log("💾 Insertion des déclarations...\n")
  const byDate: Record<string, number> = {}
  const year = 2026
  let total = 0
  let poolSpikeIdx  = 0
  let poolNormalIdx = 0

  for (const slot of CALENDAR) {
    const isRecent = slot.daysAgo <= 14
    const pool = isRecent ? spikePool : normalPool

    for (let i = 0; i < slot.count; i++) {
      const maladie  = isRecent
        ? spikePool[poolSpikeIdx++ % spikePool.length]
        : normalPool[poolNormalIdx++ % normalPool.length]
      const patient  = rand(patients)
      const service  = rand(services)
      const commune  = rand(communes)
      const diagDate = dateAt(slot.daysAgo)
      const symDate  = new Date(diagDate.getTime() - randInt(1, 5) * 86_400_000)

      // Code officiel : AAAA + SS + CCCCC + NNNN  (ex: 202604A23--0001)
      const codeCas = nextCodeCas(year, service.codeService, maladie.codeCim10)

      await prisma.casDeclare.create({
        data: {
          codeCas,
          patientId:          patient.id,
          maladieId:          maladie.id,
          statut:             pickStatut(),
          serviceId:          service.id,
          serviceDeclarant:   service.nom,
          etablissementId:    etab?.id ?? null,
          communeId:          commune.id,
          dateDebutSymptomes: symDate,
          dateDiagnostic:     diagDate,
          moisDeclaration:    diagDate.getMonth() + 1,
          anneeDeclaration:   diagDate.getFullYear(),
          // ⚠ CRUCIAL : createdAt = dateDiagnostic pour que les filtres
          //   par date (seuils, dashboard) voient la vraie date de déclaration
          createdAt:          diagDate,
          updatedAt:          diagDate,
        },
      })

      const dk = diagDate.toISOString().slice(0, 10)
      byDate[dk] = (byDate[dk] ?? 0) + 1
      total++
    }
  }

  // 5. Rapport
  console.log("📅 Répartition par date de diagnostic :")
  for (const [date, n] of Object.entries(byDate).sort()) {
    const bar = "█".repeat(n)
    console.log(`   ${date}  ${String(n).padStart(2)} cas  ${bar}`)
  }
  console.log(`\n✨ ${total} déclarations insérées sur ${Object.keys(byDate).length} dates distinctes.`)
  console.log(`   Moyenne : ${(total / Object.keys(byDate).length).toFixed(1)} cas/jour`)
  console.log(`   Min/Max : ${Math.min(...Object.values(byDate))} / ${Math.max(...Object.values(byDate))} cas/jour`)

  // 6. Exemple de codes générés
  const echantillon = await prisma.casDeclare.findMany({
    take: 5, orderBy: { createdAt: "desc" }, select: { codeCas: true, dateDiagnostic: true }
  })
  console.log("\n📋 Exemples de codes générés :")
  for (const c of echantillon) {
    console.log(`   ${c.codeCas}   (${c.dateDiagnostic?.toISOString().slice(0, 10)})`)
  }
}

main()
  .catch(e => { console.error("\n❌", e.message); process.exit(1) })
  .finally(() => prisma.$disconnect())
