import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET /api/uhh/stats
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const perms: string[] = session.user.permissions ?? []
  if (!perms.includes("uhh.dashboard") && session.user.role !== "admin") {
    return NextResponse.json({ error: "Accès réservé à l'UHH" }, { status: 403 })
  }

  const now = new Date()
  const debut30j = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const debut90j = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

  const [
    totalIAS,
    iasEnCours,
    bmrCount,
    iasDerniers30j,
    parType,
    parService,
    bmrParService,
    tendance90j,
  ] = await Promise.all([
    prisma.infectionIAS.count(),
    prisma.infectionIAS.count({ where: { statut: "en_cours" } }),
    prisma.infectionIAS.count({ where: { isBMR: true } }),
    prisma.infectionIAS.count({ where: { dateDetection: { gte: debut30j } } }),

    // Par type IAS
    prisma.infectionIAS.groupBy({
      by: ["typeIAS"],
      _count: { _all: true },
      orderBy: { _count: { typeIAS: "desc" } },
    }),

    // Par service (top 8)
    prisma.infectionIAS.groupBy({
      by: ["serviceId"],
      _count: { _all: true },
      orderBy: { _count: { serviceId: "desc" } },
      take: 8,
    }),

    // BMR par service
    prisma.infectionIAS.groupBy({
      by: ["serviceId"],
      where: { isBMR: true },
      _count: { _all: true },
      orderBy: { _count: { serviceId: "desc" } },
      take: 5,
    }),

    // Tendance 90 jours (par mois)
    prisma.infectionIAS.findMany({
      where: { dateDetection: { gte: debut90j } },
      select: { dateDetection: true, typeIAS: true, isBMR: true },
    }),
  ])

  // Enrichir les groupBy service avec les noms
  const serviceIds = [...new Set([
    ...parService.map(s => s.serviceId),
    ...bmrParService.map(s => s.serviceId),
  ])]
  const services = await prisma.service.findMany({
    where: { id: { in: serviceIds } },
    select: { id: true, nom: true },
  })
  const serviceMap = Object.fromEntries(services.map(s => [s.id, s.nom]))

  // Grouper tendance par semaine
  const semaines: Record<string, { total: number; bmr: number }> = {}
  for (const i of tendance90j) {
    const d = new Date(i.dateDetection)
    // Semaine ISO: lundi de la semaine
    const day = d.getDay() || 7
    const lundi = new Date(d)
    lundi.setDate(d.getDate() - day + 1)
    const key = lundi.toISOString().slice(0, 10)
    if (!semaines[key]) semaines[key] = { total: 0, bmr: 0 }
    semaines[key].total++
    if (i.isBMR) semaines[key].bmr++
  }
  const tendanceData = Object.entries(semaines)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([semaine, v]) => ({ semaine, ...v }))

  return NextResponse.json({
    totaux: {
      total: totalIAS,
      enCours: iasEnCours,
      bmr: bmrCount,
      derniers30j: iasDerniers30j,
      tauxBMR: totalIAS > 0 ? Math.round((bmrCount / totalIAS) * 100) : 0,
    },
    parType: parType.map(t => ({
      type: t.typeIAS,
      count: t._count._all,
    })),
    parService: parService.map(s => ({
      serviceId: s.serviceId,
      nom: serviceMap[s.serviceId] ?? "Inconnu",
      count: s._count._all,
    })),
    bmrParService: bmrParService.map(s => ({
      serviceId: s.serviceId,
      nom: serviceMap[s.serviceId] ?? "Inconnu",
      count: s._count._all,
    })),
    tendance: tendanceData,
  })
}
