import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const communeId = searchParams.get("communeId") ?? ""
  const days = parseInt(searchParams.get("days") ?? "30")
  const dateDebut = searchParams.get("dateDebut") ?? ""
  const dateFin = searchParams.get("dateFin") ?? ""
  // Multi-select support: comma-separated IDs
  const maladieIds = (searchParams.get("maladieIds") ?? "").split(",").filter(Boolean)
  const wilayadIds = (searchParams.get("wilayadIds") ?? "").split(",").filter(Boolean)
  // Legacy single-value support
  const maladieId = searchParams.get("maladieId") ?? ""
  if (maladieId && !maladieIds.includes(maladieId)) maladieIds.push(maladieId)

  const since = new Date()
  since.setDate(since.getDate() - days)

  const dateFilter = (dateDebut || dateFin)
    ? {
        ...(dateDebut ? { gte: new Date(dateDebut) } : {}),
        ...(dateFin ? { lte: new Date(dateFin + "T23:59:59.999Z") } : {}),
      }
    : { gte: since }

  const where: Record<string, unknown> = { createdAt: dateFilter }
  if (maladieIds.length === 1) where.maladieId = maladieIds[0]
  else if (maladieIds.length > 1) where.maladieId = { in: maladieIds }
  if (communeId) where.communeId = communeId
  // Wilaya filter via commune relation
  if (wilayadIds.length > 0) {
    where.commune = { wilayadId: { in: wilayadIds } }
  }

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
      maladie: c.maladie?.nom ?? "—",
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

  // Build day buckets — adapt to custom date range if provided
  const bucketStart = dateDebut ? new Date(dateDebut) : since
  const bucketEnd = dateFin ? new Date(dateFin) : new Date()
  const bucketDays = Math.max(1, Math.ceil((bucketEnd.getTime() - bucketStart.getTime()) / (1000 * 60 * 60 * 24)) + 1)
  const dayMap: Record<string, number> = {}
  for (let i = bucketDays - 1; i >= 0; i--) {
    const d = new Date(bucketEnd)
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

  const distMaladieIds = casByMaladie.map(c => c.maladieId).filter((id): id is string => Boolean(id))
  const maladiesRef = await prisma.maladie.findMany({ where: { id: { in: distMaladieIds } } })
  const maladieMap = Object.fromEntries(maladiesRef.map(m => [m.id, m.nom]))

  const diseaseDistribution = casByMaladie.map(c => ({
    name: c.maladieId ? (maladieMap[c.maladieId] ?? "Inconnu") : "Non renseigné",
    count: c._count.id,
  }))

  return NextResponse.json({
    stats: { totalActifs, totalAlertes, totalMaladies },
    mapMarkers,
    epidemicCurve,
    diseaseDistribution,
  })
}

