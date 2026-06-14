/**
 * Seed ~200 case declarations distribuées sur des dates calendaires réalistes.
 * Aucun cas le jour J (aujourd'hui). Chaque date reçoit un nombre limité de cas.
 *
 * Usage: npx tsx --env-file=.env.local scripts/seed-declarations.ts
 */
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const ETAB_ID    = "63ae2562-de55-421b-ae2c-a2a1b1e4588e"
const COMMUNE_ID = "f3f71457-5359-41cc-9115-51f79b359e0b"
const MEDECIN_ID = "fe5092c7-7c49-406c-9c44-2e6b772f8fea"

const SERVICES = [
  "Infectiologie",
  "Médecine Interne",
  "Pédiatrie",
  "Urgences",
  "Cardiologie",
  "Réanimation médicale",
]

// ── Calendrier réaliste : date → nombre de cas ce jour-là ────────────────────
// Aujourd'hui = 20 mai 2026. Aucun cas aujourd'hui.
// Répartition sur ~60 jours précédents, pic récent pour déclencher les alertes.
const CALENDAR: Array<{ daysAgo: number; count: number }> = [
  // il y a 60–41 jours : activité faible (2–4 cas/j, certains jours vides)
  { daysAgo: 60, count: 2 },
  { daysAgo: 57, count: 3 },
  { daysAgo: 54, count: 2 },
  { daysAgo: 52, count: 4 },
  { daysAgo: 49, count: 2 },
  { daysAgo: 47, count: 3 },
  { daysAgo: 45, count: 2 },
  { daysAgo: 43, count: 3 },
  { daysAgo: 41, count: 2 },
  // il y a 40–21 jours : activité modérée (3–6 cas/j)
  { daysAgo: 40, count: 4 },
  { daysAgo: 38, count: 3 },
  { daysAgo: 36, count: 5 },
  { daysAgo: 34, count: 4 },
  { daysAgo: 32, count: 3 },
  { daysAgo: 30, count: 6 },
  { daysAgo: 28, count: 4 },
  { daysAgo: 26, count: 5 },
  { daysAgo: 24, count: 4 },
  { daysAgo: 22, count: 5 },
  { daysAgo: 21, count: 3 },
  // il y a 20–8 jours : montée progressive
  { daysAgo: 20, count: 5 },
  { daysAgo: 18, count: 6 },
  { daysAgo: 16, count: 7 },
  { daysAgo: 14, count: 6 },
  { daysAgo: 12, count: 7 },
  { daysAgo: 10, count: 8 },
  { daysAgo:  9, count: 6 },
  { daysAgo:  8, count: 7 },
  // il y a 7–1 jours : pic épidémique (déclenche les seuils)
  { daysAgo:  7, count: 9 },
  { daysAgo:  6, count: 10 },
  { daysAgo:  5, count: 11 },
  { daysAgo:  4, count: 10 },
  { daysAgo:  3, count: 9 },
  { daysAgo:  2, count: 8 },
  { daysAgo:  1, count: 7 },
]
// Total : 207 slots. On insèrera exactement autant de cas.

// ── Maladies prioritaires pour le pic ────────────────────────────────────────
// Ces mots-clés reçoivent en priorité des créneaux dans les 7 derniers jours.
const SPIKE_KW = [
  "rougeole", "méningocoque", "typhoïde", "paludisme", "choléra",
  "covid", "dengue", "grippe", "méningite virale", "tuberculose pulm",
]

// ── Helpers ───────────────────────────────────────────────────────────────────
function normalize(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
}

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function dateAtOffset(daysAgo: number, hourMin = 6, hourMax = 20): Date {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(randInt(hourMin, hourMax), randInt(0, 59), randInt(0, 59), 0)
  d.setMilliseconds(0)
  return d
}

type Statut = "brouillon" | "suspect" | "confirme"
function pickStatut(): Statut {
  const r = Math.random()
  if (r < 0.50) return "confirme"
  if (r < 0.85) return "suspect"
  return "brouillon"
}

/** Fisher-Yates shuffle */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  // 1. Supprimer toutes les déclarations SEED existantes
  console.log("🗑  Suppression des anciennes déclarations SEED...")
  const deleted = await prisma.casDeclare.deleteMany({
    where: { codeCas: { startsWith: "CAS-2026-" } },
  })
  console.log(`   → ${deleted.count} enregistrements supprimés\n`)

  // 2. Charger les références
  console.log("🔍 Chargement des références...")
  const maladies = await prisma.maladie.findMany({
    orderBy: { nom: "asc" },
    select: { id: true, nom: true, codeCim10: true },
  })
  const patients = await prisma.patient.findMany({ select: { id: true } })

  if (patients.length === 0) {
    console.error("❌ Aucun patient trouvé — exécutez d'abord npm run db:seed")
    process.exit(1)
  }
  console.log(`   → ${maladies.length} maladies, ${patients.length} patients`)

  const totalSlots = CALENDAR.reduce((s, d) => s + d.count, 0)
  console.log(`   → ${totalSlots} créneaux calendaires planifiés\n`)

  // 3. Construire la liste des "cas à créer" (maladie, poids) puis mélanger
  //    Les maladies du pic sont sur-représentées dans les 7 derniers jours.
  interface CasBlueprint {
    maladie: typeof maladies[0]
    isSpike: boolean
  }

  const blueprints: CasBlueprint[] = []
  for (const m of maladies) {
    const nom = normalize(m.nom)
    const isSpike = SPIKE_KW.some(kw => nom.includes(normalize(kw)))
    // 2–4 entrées par maladie normale, 4–6 pour les maladies épidémiques
    const copies = isSpike ? randInt(4, 6) : randInt(2, 4)
    for (let i = 0; i < copies; i++) blueprints.push({ maladie: m, isSpike })
  }

  // Séparer spike / normal pour affecter spike → derniers jours
  const spikePool  = shuffle(blueprints.filter(b => b.isSpike))
  const normalPool = shuffle(blueprints.filter(b => !b.isSpike))

  // 4. Affecter les créneaux : jours récents (1–7) → spike d'abord, reste → normal
  const recentSlots  = CALENDAR.filter(d => d.daysAgo <= 7)
  const olderSlots   = CALENDAR.filter(d => d.daysAgo >  7)

  const recentTotal  = recentSlots.reduce((s, d) => s + d.count, 0)  // 64
  const olderTotal   = olderSlots.reduce((s, d)  => s + d.count, 0)  // 143

  // Remplir les créneaux avec les blueprints (cycliquement si nécessaire)
  function fillSlots(
    slots: typeof CALENDAR,
    pool: CasBlueprint[],
    extra: CasBlueprint[],
  ): Array<{ blueprint: CasBlueprint; daysAgo: number }> {
    const result: Array<{ blueprint: CasBlueprint; daysAgo: number }> = []
    let poolIdx = 0
    const combined = [...pool, ...extra]
    for (const slot of slots) {
      for (let i = 0; i < slot.count; i++) {
        result.push({
          blueprint: combined[poolIdx % combined.length],
          daysAgo: slot.daysAgo,
        })
        poolIdx++
      }
    }
    return result
  }

  const recentAssigned = fillSlots(recentSlots, spikePool, normalPool)
  const olderAssigned  = fillSlots(olderSlots,  normalPool, spikePool)
  const allAssigned    = [...olderAssigned, ...recentAssigned]

  // 5. Insérer
  console.log("💾 Insertion des déclarations...\n")
  const cimCounter: Record<string, number> = {}

  const grouped: Record<string, number> = {}
  for (const { blueprint, daysAgo } of allAssigned) {
    const { maladie } = blueprint
    const cimSlug = maladie.codeCim10.replace(/\./g, "-")
    if (!cimCounter[cimSlug]) cimCounter[cimSlug] = 1

    const seq     = String(cimCounter[cimSlug]++).padStart(3, "0")
    const codeCas = `CAS-2026-${cimSlug}-${seq}`

    const diagDate = dateAtOffset(daysAgo)
    const symDate  = new Date(diagDate.getTime() - randInt(1, 5) * 86_400_000)

    await prisma.casDeclare.create({
      data: {
        codeCas,
        patientId:          rand(patients).id,
        maladieId:          maladie.id,
        statut:             pickStatut(),
        etablissementId:    ETAB_ID,
        serviceDeclarant:   rand(SERVICES),
        medecinDeclarantId: MEDECIN_ID,
        communeId:          COMMUNE_ID,
        dateDebutSymptomes: symDate,
        dateDiagnostic:     diagDate,
      },
    })

    const dateKey = diagDate.toISOString().slice(0, 10)
    grouped[dateKey] = (grouped[dateKey] ?? 0) + 1
  }

  // 6. Récapitulatif par date
  console.log("📅 Récapitulatif par date de diagnostic :")
  const today = new Date().toISOString().slice(0, 10)
  for (const [date, n] of Object.entries(grouped).sort()) {
    const marker = date === today ? " ← AUJOURD'HUI (ne devrait pas apparaître)" : ""
    console.log(`   ${date}  :  ${String(n).padStart(3)} cas${marker}`)
  }

  // 7. Répartition par service
  console.log("\n📊 Répartition par service :")
  const seeded = await prisma.casDeclare.findMany({
    where:  { codeCas: { startsWith: "CAS-2026-" } },
    select: { serviceDeclarant: true },
  })
  const byService: Record<string, number> = {}
  for (const c of seeded) {
    const s = c.serviceDeclarant ?? "—"
    byService[s] = (byService[s] ?? 0) + 1
  }
  for (const [svc, n] of Object.entries(byService).sort((a, b) => b[1] - a[1])) {
    console.log(`   ${svc.padEnd(35)} : ${n} cas`)
  }

  console.log(`\n✨ Terminé : ${allAssigned.length} déclarations insérées sur ${Object.keys(grouped).length} dates distinctes.`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
