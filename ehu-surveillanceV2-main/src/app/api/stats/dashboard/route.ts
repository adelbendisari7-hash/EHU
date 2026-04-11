import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const maladieId = searchParams.get("maladieId") ?? ""
  const communeId = searchParams.get("communeId") ?? ""
  const days = parseInt(searchParams.get("days") ?? "30")

  const since = new Date()
  since.setDate(since.getDate() - days)

  const where: Record<string, unknown> = { createdAt: { gte: since } }
  if (maladieId) where.maladieId = maladieId
  if (communeId) where.communeId = communeId

  // Stat cards
  const [totalActifs, totalAlertes, totalMaladies] = await Promise.all([
    prisma.casDeclare.count({ where: { statut: { in: ["nouveau", "en_cours", "confirme"] } } }),
    prisma.alerte.count({ where: { statut: "active" } }),
    prisma.maladie.count({ where: { isActive: true } }),
  ])

  // Map markers — cases with geolocation
  const casGeolocated = await prisma.casDeclare.findMany({
    where: {
      ...where,
      commune: { latitude: { not: null }, longitude: { not: null } },
    },
    include: {
      patient: { select: { firstName: true, lastName: true } },
      maladie: { select: { nom: true } },
      commune: { select: { nom: true, latitude: true, longitude: true } },
    },
    take: 200,
  })

  const mapMarkers = casGeolocated
    .filter(c => c.commune?.latitude && c.commune?.longitude)
    .map(c => ({
      id: c.id,
      lat: Number(c.commune!.latitude),
      lng: Number(c.commune!.longitude),
      statut: c.statut,
      maladie: c.maladie.nom,
      commune: c.commune!.nom,
      date: c.createdAt,
    }))

  // Epidemic curve — group by day for last N days
  const casByDay = await prisma.casDeclare.groupBy({
    by: ["createdAt"],
    where,
    _count: { id: true },
    orderBy: { createdAt: "asc" },
  })

  // Build day buckets
  const dayMap: Record<string, number> = {}
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    dayMap[key] = 0
  }
  casByDay.forEach(row => {
    const key = new Date(row.createdAt).toISOString().slice(0, 10)
    if (key in dayMap) dayMap[key] += row._count.id
  })
  const epidemicCurve = Object.entries(dayMap).map(([date, count]) => ({ date, count }))

  // Disease distribution
  const casByMaladie = await prisma.casDeclare.groupBy({
    by: ["maladieId"],
    where,
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 8,
  })

  const maladieIds = casByMaladie.map(c => c.maladieId)
  const maladies = await prisma.maladie.findMany({ where: { id: { in: maladieIds } } })
  const maladieMap = Object.fromEntries(maladies.map(m => [m.id, m.nom]))

  const diseaseDistribution = casByMaladie.map(c => ({
    name: maladieMap[c.maladieId] ?? "Inconnu",
    count: c._count.id,
  }))

  return NextResponse.json({
    stats: { totalActifs, totalAlertes, totalMaladies },
    mapMarkers,
    epidemicCurve,
    diseaseDistribution,
  })
}

