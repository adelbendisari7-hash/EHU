import { PrismaClient } from "@prisma/client"
const p = new PrismaClient()
async function main() {
  const commune = await p.commune.findFirst({ where: { nom: { contains: "Oran" } }, select: { id: true, nom: true } })
  const services = await p.service.findMany({ take: 8, select: { id: true, nom: true } })
  const maladies = await p.maladie.findMany({ select: { id: true, nom: true }, orderBy: { nom: "asc" } })
  const medecin = await p.medecinDeclarant.findFirst({ select: { id: true, nom: true, prenom: true } })
  const patients = await p.patient.findMany({ take: 5, select: { id: true, firstName: true, lastName: true } })
  const etab = await p.etablissement.findFirst({ select: { id: true, nom: true } })
  console.log(JSON.stringify({ commune, services, maladiesCount: maladies.length, maladiesSample: maladies.slice(0, 8), medecin, patients, etab }, null, 2))
}
main().catch(console.error).finally(() => p.$disconnect())
