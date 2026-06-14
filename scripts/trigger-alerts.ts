/**
 * Déclenche les alertes de seuil rétroactivement pour toutes les maladies
 * ayant des déclarations en base (utile après un seed direct en DB).
 *
 * Usage: npx tsx --env-file=.env.local scripts/trigger-alerts.ts
 */
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function checkMaladie(maladieId: string, maladieName: string) {
  const seuils = await prisma.seuilAlerte.findMany({
    where: { maladieId, isActive: true },
  })
  if (seuils.length === 0) return

  for (const seuil of seuils) {
    const since = new Date(Date.now() - seuil.periodejours * 24 * 60 * 60 * 1000)

    const count = await prisma.casDeclare.count({
      where: {
        maladieId,
        statut: { notIn: ["brouillon"] },
        dateDiagnostic: { gte: since, not: null },
      },
    })

    if (count < seuil.seuilNombre) continue

    // Alerte déjà active pour cette maladie ?
    const existing = await prisma.alerte.findFirst({
      where: { maladieId, statut: "active" },
    })
    if (existing) {
      console.log(`  ⏭  Alerte déjà active pour ${maladieName} (${count} cas / ${seuil.periodejours}j, seuil=${seuil.seuilNombre})`)
      continue
    }

    const titre = `Seuil dépassé — ${maladieName}`
    const description = `${count} cas détectés sur les ${seuil.periodejours} derniers jours (seuil : ${seuil.seuilNombre} cas) — Gravité : ${seuil.gravite}`

    const alerte = await prisma.alerte.create({
      data: {
        type: "seuil",
        titre,
        description,
        statut: "active",
        nombreCas: count,
        maladieId,
      },
    })

    // Notifications aux épidémiologistes et admins
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        userRoles: {
          some: { role: { name: { in: ["epidemiologiste", "admin"] } } },
        },
      },
      select: { id: true },
    })

    if (users.length > 0) {
      await prisma.notification.createMany({
        data: users.map(u => ({
          userId: u.id,
          type: "seuil_depasse",
          titre,
          message: description,
        })),
        skipDuplicates: true,
      })
    }

    const graviteIcon = seuil.gravite === "critique" ? "🔴" : seuil.gravite === "urgent" ? "🟠" : "🟡"
    console.log(
      `  ${graviteIcon} ALERTE créée : ${maladieName.padEnd(55)} ${count} cas / ${seuil.periodejours}j [${seuil.gravite}] — ${users.length} notif.`
    )
    console.log(`     ID alerte : ${alerte.id}`)
  }
}

async function main() {
  console.log("🔍 Chargement des maladies avec déclarations récentes...\n")

  // Toutes les maladies ayant au moins un cas déclaré (non-brouillon) avec dateDiagnostic
  const maladiesAvecCas = await prisma.casDeclare.findMany({
    where: {
      statut: { notIn: ["brouillon"] },
      dateDiagnostic: { not: null },
      maladieId: { not: null },
    },
    select: { maladieId: true },
    distinct: ["maladieId"],
  })

  const maladieIds = maladiesAvecCas.map(c => c.maladieId!).filter(Boolean)
  const maladies = await prisma.maladie.findMany({
    where: { id: { in: maladieIds } },
    select: { id: true, nom: true },
    orderBy: { nom: "asc" },
  })

  console.log(`→ ${maladies.length} maladies avec déclarations à vérifier\n`)

  let alertesCreees = 0
  for (const m of maladies) {
    const before = await prisma.alerte.count({ where: { maladieId: m.id, statut: "active" } })
    await checkMaladie(m.id, m.nom)
    const after = await prisma.alerte.count({ where: { maladieId: m.id, statut: "active" } })
    if (after > before) alertesCreees++
  }

  const totalAlertes = await prisma.alerte.count({ where: { statut: "active" } })
  console.log(`\n✨ ${alertesCreees} nouvelles alertes créées. Total actif en base : ${totalAlertes} alertes.`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
