import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const communeIds = (searchParams.get("communeIds") ?? searchParams.get("communeId") ?? "").split(",").filter(Boolean)
  const days = parseInt(searchParams.get("days") ?? "30")
  const dateDebut = searchParams.get("dateDebut") ?? ""
  const dateFin = searchParams.get("dateFin") ?? ""
  const maladieIds = (searchParams.get("maladieIds") ?? "").split(",").filter(Boolean)
  const wilayadIds = (searchParams.get("wilayadIds") ?? "").split(",").filter(Boolean)
  const services = (searchParams.get("services") ?? "").split(",").filter(Boolean)
  const maladieId = searchParams.get("maladieId") ?? ""
  if (maladieId && !maladieIds.includes(maladieId)) maladieIds.push(maladieId)

  const since = new Date()
  since.setDate(since.getDate() - days)

  const bucketStart = dateDebut ? new Date(dateDebut) : since
  const bucketEnd = dateFin ? new Date(dateFin) : new Date()

  const dateFilter = (dateDebut || dateFin)
    ? {
        ...(dateDebut ? { gte: new Date(dateDebut) } : {}),
        ...(dateFin ? { lte: new Date(dateFin + "T23:59:59.999Z") } : {}),
      }
    : { gte: since }

  const where: Record<string, unknown> = { createdAt: dateFilter, statut: { not: "brouillon" } }
  if (maladieIds.length === 1) where.maladieId = maladieIds[0]
  else if (maladieIds.length > 1) where.maladieId = { in: maladieIds }
  if (communeIds.length === 1) where.communeId = communeIds[0]
  else if (communeIds.length > 1) where.communeId = { in: communeIds }
  if (wilayadIds.length > 0) {
    where.commune = { wilayadId: { in: wilayadIds } }
  }
  if (services.length === 1) where.serviceDeclarant = services[0]
  else if (services.length > 1) where.serviceDeclarant = { in: services }

  // ── Previous period (same length, shifted back) for evolution KPI ──────────
  const periodMs = bucketEnd.getTime() - bucketStart.getTime()
  const prevEnd = new Date(bucketStart.getTime() - 1)
  const prevStart = new Date(prevEnd.getTime() - periodMs)
  const prevDateFilter = { gte: prevStart, lte: prevEnd }
  const prevWhere: Record<string, unknown> = { createdAt: prevDateFilter, statut: { not: "brouillon" } }
  if (maladieIds.length === 1) prevWhere.maladieId = maladieIds[0]
  else if (maladieIds.length > 1) prevWhere.maladieId = { in: maladieIds }
  if (communeIds.length === 1) prevWhere.communeId = communeIds[0]
  else if (communeIds.length > 1) prevWhere.communeId = { in: communeIds }
  if (wilayadIds.length > 0) prevWhere.commune = { wilayadId: { in: wilayadIds } }
  if (services.length === 1) prevWhere.serviceDeclarant = services[0]
  else if (services.length > 1) prevWhere.serviceDeclarant = { in: services }

  // ── KPI queries ─────────────────────────────────────────────────────────────
  const [
    nombreCas,
    casComplets,
    casConfirmes,
    casSuspects,
    casPrevPeriode,
  ] = await Promise.all([
    // Total cas dans la période filtrée (brouillons exclus via where de base)
    prisma.casDeclare.count({ where }),
    // Cas avec les champs obligatoires remplis
    prisma.casDeclare.count({
      where: {
        ...where,
        maladieId: { not: null },
        communeId: { not: null },
        dateDiagnostic: { not: null },
        dateDebutSymptomes: { not: null },
      },
    }),
    // Cas confirmés
    prisma.casDeclare.count({ where: { ...where, statut: "confirme" } }),
    // Cas suspects
    prisma.casDeclare.count({ where: { ...where, statut: "suspect" } }),
    // Période précédente
    prisma.casDeclare.count({ where: prevWhere }),
  ])

  const tauxCompletude = nombreCas > 0 ? Math.round((casComplets / nombreCas) * 100) : 0
  const evolutionPct = casPrevPeriode > 0
    ? Math.round(((nombreCas - casPrevPeriode) / casPrevPeriode) * 100)
    : nombreCas > 0 ? 100 : 0

  // ── Hotspot (smart wilaya/commune) ──────────────────────────────────────────
  const topCasByCommune = await prisma.casDeclare.groupBy({
    by: ["communeId"],
    where,
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 50,
  })

  const hotspotCommuneIds = topCasByCommune
    .map(c => c.communeId)
    .filter((id): id is string => Boolean(id))

  let hotspot: { nom: string; count: number; type: "wilaya" | "commune" } = {
    nom: "—",
    count: 0,
    type: "wilaya",
  }

  if (hotspotCommuneIds.length > 0) {
    const showCommune = communeIds.length > 0 || wilayadIds.length === 1

    if (showCommune) {
      // Afficher la commune avec le plus de cas
      const topId = hotspotCommuneIds[0]
      const topCount = topCasByCommune[0]._count.id
      const commune = await prisma.commune.findUnique({
        where: { id: topId },
        select: { nom: true },
      })
      hotspot = { nom: commune?.nom ?? "—", count: topCount, type: "commune" }
    } else {
      // Agréger par wilaya
      const communeRefs = await prisma.commune.findMany({
        where: { id: { in: hotspotCommuneIds } },
        select: { id: true, wilayadId: true },
      })
      const wilayaCountMap: Record<string, number> = {}
      for (const row of topCasByCommune) {
        if (!row.communeId) continue
        const ref = communeRefs.find(c => c.id === row.communeId)
        if (!ref?.wilayadId) continue
        wilayaCountMap[ref.wilayadId] = (wilayaCountMap[ref.wilayadId] ?? 0) + row._count.id
      }
      const topEntry = Object.entries(wilayaCountMap).sort((a, b) => b[1] - a[1])[0]
      if (topEntry) {
        const wilaya = await prisma.wilaya.findUnique({
          where: { id: topEntry[0] },
          select: { nom: true },
        })
        hotspot = { nom: wilaya?.nom ?? "—", count: topEntry[1], type: "wilaya" }
      }
    }
  }

  // ── Wilaya case counts (for choropleth) ─────────────────────────────────────
  const casByCommune = await prisma.casDeclare.groupBy({
    by: ["communeId"],
    where,
    _count: { id: true },
  })
  const communeIds2 = casByCommune.map(c => c.communeId).filter((id): id is string => Boolean(id))
  const communeWilayaMap = communeIds2.length > 0
    ? await prisma.commune.findMany({
        where: { id: { in: communeIds2 } },
        select: { id: true, wilayadId: true },
      })
    : []
  const wilayaCountMap: Record<string, number> = {}
  for (const row of casByCommune) {
    if (!row.communeId) continue
    const ref = communeWilayaMap.find(c => c.id === row.communeId)
    if (!ref?.wilayadId) continue
    wilayaCountMap[ref.wilayadId] = (wilayaCountMap[ref.wilayadId] ?? 0) + row._count.id
  }
  const wilayaIds3 = Object.keys(wilayaCountMap)
  const wilayasRef = wilayaIds3.length > 0
    ? await prisma.wilaya.findMany({
        where: { id: { in: wilayaIds3 } },
        select: { id: true, nom: true, code: true },
      })
    : []
  const wilayaStats = wilayasRef.map(w => ({
    id: w.id,
    code: w.code,
    nom: w.nom,
    count: wilayaCountMap[w.id] ?? 0,
  })).sort((a, b) => b.count - a.count)

  // ── Map markers ─────────────────────────────────────────────────────────────
  const casGeolocated = await prisma.casDeclare.findMany({
    where: {
      ...where,
      commune: {
        ...(wilayadIds.length > 0 ? { wilayadId: { in: wilayadIds } } : {}),
        latitude: { not: null },
        longitude: { not: null },
      },
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

  // ── Epidemic curve ───────────────────────────────────────────────────────────
  const casByDay = await prisma.casDeclare.groupBy({
    by: ["createdAt"],
    where,
    _count: { id: true },
    orderBy: { createdAt: "asc" },
  })

  const bucketDays = Math.max(1, Math.ceil((bucketEnd.getTime() - bucketStart.getTime()) / (1000 * 60 * 60 * 24)) + 1)
  const dayMap: Record<string, number> = {}
  for (let i = bucketDays - 1; i >= 0; i--) {
    const d = new Date(bucketEnd)
    d.setDate(d.getDate() - i)
    dayMap[d.toISOString().slice(0, 10)] = 0
  }
  casByDay.forEach(row => {
    const key = new Date(row.createdAt).toISOString().slice(0, 10)
    if (key in dayMap) dayMap[key] += row._count.id
  })
  const epidemicCurve = Object.entries(dayMap).map(([date, count]) => ({ date, count }))

  // ── Disease distribution ─────────────────────────────────────────────────────
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

  // ── Service distribution ─────────────────────────────────────────────────
  const casByService = await prisma.casDeclare.groupBy({
    by: ["serviceDeclarant"],
    where,
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 8,
  })

  const serviceDistribution = casByService
    .filter(c => c.serviceDeclarant && c.serviceDeclarant.trim())
    .map(c => ({
      name: c.serviceDeclarant!.trim(),
      count: c._count.id,
    }))

  return NextResponse.json({
    stats: {
      nombreCas,
      casConfirmes,
      casSuspects,
      tauxCompletude,
      evolutionPct,
    },
    mapMarkers,
    wilayaStats,
    epidemicCurve,
    diseaseDistribution,
    serviceDistribution,
  })
}
