/**
 * Ajoute des cas du 20 mai jusqu'à aujourd'hui pour combler le vide récent.
 * Usage: npx tsx --env-file=.env.local scripts/seed-recent.ts
 */
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const ETAB_ID    = "63ae2562-de55-421b-ae2c-a2a1b1e4588e"
const COMMUNE_ID = "f3f71457-5359-41cc-9115-51f79b359e0b"
const MEDECIN_ID = "fe5092c7-7c49-406c-9c44-2e6b772f8fea"

const SERVICES = [
  "Infectiologie", "Médecine Interne", "Pédiatrie",
  "Urgences", "Cardiologie", "Réanimation médicale",
]

// Cas du 22 mai à aujourd'hui (31 mai) — décroissance post-pic
// daysAgo calculé depuis aujourd'hui (31 mai)
const RECENT_DAYS: Array<{ daysAgo: number; count: number }> = [
  { daysAgo: 9, count: 5 },  // 22 mai
  { daysAgo: 8, count: 6 },  // 23 mai
  { daysAgo: 7, count: 5 },  // 24 mai
  { daysAgo: 6, count: 4 },  // 25 mai
  { daysAgo: 5, count: 5 },  // 26 mai
  { daysAgo: 4, count: 4 },  // 27 mai
  { daysAgo: 3, count: 3 },  // 28 mai
  { daysAgo: 2, count: 3 },  // 29 mai
]

function rand<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }
function randInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min }
function dateAtOffset(daysAgo: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(randInt(6, 20), randInt(0, 59), randInt(0, 59), 0)
  d.setMilliseconds(0)
  return d
}
type Statut = "suspect" | "confirme"
function pickStatut(): Statut { return Math.random() < 0.55 ? "confirme" : "suspect" }

async function main() {
  const maladies = await prisma.maladie.findMany({ select: { id: true, nom: true, codeCim10: true } })
  const patients = await prisma.patient.findMany({ select: { id: true } })

  // Compteur de séquence par CIM-10
  const seqMap: Record<string, number> = {}
  const existing = await prisma.casDeclare.findMany({
    where: { codeCas: { startsWith: "CAS-2026-" } },
    select: { codeCas: true },
  })
  for (const c of existing) {
    const parts = c.codeCas.split("-")
    if (parts.length >= 4) {
      const key = parts.slice(2, parts.length - 1).join("-")
      const seq = parseInt(parts[parts.length - 1], 10)
      if (!isNaN(seq)) seqMap[key] = Math.max(seqMap[key] ?? 0, seq)
    }
  }

  let total = 0

  for (const { daysAgo, count } of RECENT_DAYS) {
    const date = dateAtOffset(daysAgo)
    const label = date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })

    for (let i = 0; i < count; i++) {
      const maladie = rand(maladies)
      const patient = rand(patients)
      const statut = pickStatut()

      const cimKey = maladie.codeCim10.replace(/\./g, "-")
      seqMap[cimKey] = (seqMap[cimKey] ?? 0) + 1
      const codeCas = `CAS-2026-${cimKey}-${String(seqMap[cimKey]).padStart(3, "0")}`

      const caseDate = new Date(date)
      caseDate.setHours(randInt(6, 20), randInt(0, 59), 0, 0)

      await prisma.$executeRaw`
        INSERT INTO cas_declares (
          id, code_cas, patient_id, maladie_id,
          date_diagnostic, date_debut_symptomes,
          statut, etablissement_id, service_declarant,
          medecin_declarant_id, commune_id,
          mois_declaration, annee_declaration,
          created_at, updated_at
        ) VALUES (
          gen_random_uuid(),
          ${codeCas},
          ${patient.id}::uuid,
          ${maladie.id}::uuid,
          ${caseDate},
          ${new Date(caseDate.getTime() - randInt(1, 5) * 86400000)},
          ${statut}::"CasStatut",
          ${ETAB_ID}::uuid,
          ${rand(SERVICES)},
          ${MEDECIN_ID}::uuid,
          ${COMMUNE_ID}::uuid,
          ${caseDate.getMonth() + 1},
          ${caseDate.getFullYear()},
          ${caseDate},
          ${caseDate}
        )
      `
      total++
    }

    console.log(`✓ ${label} — ${count} cas ajoutés`)
  }

  console.log(`\n✨ ${total} nouveaux cas insérés`)

  // Distribution finale
  const dist = await prisma.$queryRaw<{ jour: string; nb: bigint }[]>`
    SELECT DATE(created_at) as jour, COUNT(*) as nb
    FROM cas_declares
    WHERE code_cas LIKE 'CAS-2026-%'
    AND created_at >= NOW() - INTERVAL '10 days'
    GROUP BY DATE(created_at)
    ORDER BY jour
  `
  console.log("\nDistribution (10 derniers jours) :")
  for (const row of dist) {
    const bar = "█".repeat(Number(row.nb))
    console.log(`  ${row.jour}  ${String(row.nb).padStart(3)} cas  ${bar}`)
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
