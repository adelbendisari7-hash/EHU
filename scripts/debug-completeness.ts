import { PrismaClient } from "@prisma/client"
const p = new PrismaClient()

function isFilled(v: unknown): boolean {
  if (v === null || v === undefined) return false
  if (typeof v === "string") { const s = v.trim(); return s !== "" && s !== "—" && s !== "-" }
  if (v instanceof Date) return v.getFullYear() !== 2000
  return true
}

const LABELS = ["prenom","nom","ddn","sexe","adresse","commune-pat","maladie","commune-cas","debut-sympt","diag","service","etab","medecin","obs","symptomes","evolution"]

async function main() {
  const cases = await p.casDeclare.findMany({
    include: { patient: { include: { commune: true } }, maladie: true, commune: true, symptomes: { include: { symptome: true } } },
    take: 8,
    orderBy: { createdAt: "asc" },
  })
  console.log("Complétude (filtre anti-placeholder) :\n")
  for (const c of cases) {
    const fields: unknown[] = [
      c.patient.firstName, c.patient.lastName, c.patient.dateOfBirth, c.patient.sex,
      c.patient.address, c.patient.commune?.nom,
      c.maladie?.nom, c.commune?.nom, c.dateDebutSymptomes, c.dateDiagnostic,
      c.serviceDeclarant ?? c.service,
      c.etablissementId, c.medecinDeclarantId,
      c.observation, c.symptomesTexte ?? (c.symptomes.length > 0 ? "ok" : null), c.evolution,
    ]
    const filled = fields.filter(isFilled).length
    const pct = Math.round(filled / fields.length * 100)
    const manquants = fields.map((f, i) => isFilled(f) ? null : LABELS[i]).filter(Boolean)
    console.log(`${String(pct).padStart(3)}%  ${c.codeCas.padEnd(28)} (${c.statut})`)
    if (manquants.length) console.log(`       ✗ ${manquants.join(", ")}`)
  }
}
main().catch(console.error).finally(() => p.$disconnect())
