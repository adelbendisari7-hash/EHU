import { PrismaClient } from "@prisma/client"
const p = new PrismaClient()
async function main() {
  const cases = await p.casDeclare.findMany({
    where: { codeCas: { not: { startsWith: "CAS-2026-" } } },
    include: { patient: { include: { commune: true } }, maladie: true, commune: true, symptomes: true },
    take: 10,
  })
  console.log("Complétude par fiche (16 champs MDO) :\n")
  for (const c of cases) {
    const fields = [
      c.patient.firstName, c.patient.lastName, c.patient.dateOfBirth, c.patient.sex,
      c.patient.address, c.patient.commune?.nom,
      c.maladie?.nom, c.commune?.nom, c.dateDebutSymptomes, c.dateDiagnostic,
      c.serviceDeclarant ?? c.service,
      c.etablissementId, c.medecinDeclarantId,
      c.observation, c.symptomesTexte ?? (c.symptomes.length > 0 ? "ok" : null), c.evolution,
    ]
    const filled = fields.filter(Boolean).length
    const pct = Math.round(filled / fields.length * 100)
    const bar = "█".repeat(Math.round(pct / 10)) + "░".repeat(10 - Math.round(pct / 10))
    console.log(`${String(pct).padStart(3)}%  ${bar}  ${c.codeCas.padEnd(25)}  (${c.statut})`)
    console.log(`       Manquants : ${fields.map((f, i) => f ? null : [
      "prenom","nom","ddn","sexe","adresse","commune-pat","maladie","commune-cas",
      "debut-sympt","diag","service","etab","medecin","observation","symptomes","evolution"
    ][i]).filter(Boolean).join(", ")}\n`)
  }
}
main().catch(console.error).finally(() => p.$disconnect())
