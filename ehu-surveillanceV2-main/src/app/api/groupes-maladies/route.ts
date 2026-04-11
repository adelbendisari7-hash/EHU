import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const maladies = await prisma.maladie.findMany({
    where: { isActive: true, groupeEpidemiologique: { not: null } },
    orderBy: { nom: "asc" },
    select: {
      id: true,
      nom: true,
      nomCourt: true,
      codeCim10: true,
      groupeEpidemiologique: true,
      seuilAlertTexte: true,
      delaiDeclarationTexte: true,
      seuilDefaut: true,
      delaiNotificationHeures: true,
      categorieGravite: true,
      _count: {
        select: {
          casDeclares: true,
          alertes: { where: { statut: "active" } },
        },
      },
    },
  })

  // Get recent (30 days) case counts per disease
  const since = new Date()
  since.setDate(since.getDate() - 30)

  const recentCounts = await prisma.casDeclare.groupBy({
    by: ["maladieId"],
    _count: { _all: true },
    where: { createdAt: { gte: since }, statut: { not: "infirme" } },
  })

  const recentMap = Object.fromEntries(
    recentCounts.map(r => [r.maladieId, r._count._all])
  )

  // Group by groupe épidémiologique
  const grouped: Record<string, typeof maladies> = {}
  for (const m of maladies) {
    const g = m.groupeEpidemiologique ?? "autre"
    if (!grouped[g]) grouped[g] = []
    grouped[g].push(m)
  }

  return NextResponse.json({
    grouped,
    recentCounts: recentMap,
    totalMaladies: maladies.length,
  })
}

