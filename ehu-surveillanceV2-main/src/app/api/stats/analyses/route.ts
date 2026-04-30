import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const days = parseInt(searchParams.get("days") ?? "90")
  const dateDebut = searchParams.get("dateDebut") ?? ""
  const dateFin = searchParams.get("dateFin") ?? ""

  // Multi-maladie (new) — fallback to single maladieId for backward compat
  const maladieIdsParam = searchParams.get("maladieIds") ?? ""
  const maladieIds = maladieIdsParam ? maladieIdsParam.split(",").filter(Boolean) : []
  const maladieIdSingle = searchParams.get("maladieId") ?? ""

  const communeId = searchParams.get("communeId") ?? ""
  const wilayadIdsParam = searchParams.get("wilayadIds") ?? ""
  const wilayadIds = wilayadIdsParam ? wilayadIdsParam.split(",").filter(Boolean) : []

  const where: Record<string, unknown> = {}

  // Date range — custom dates take priority over period preset
  if (dateDebut || dateFin) {
    where.createdAt = {
      ...(dateDebut ? { gte: new Date(dateDebut) } : {}),
      ...(dateFin ? { lte: new Date(dateFin + "T23:59:59.999Z") } : {}),
    }
  } else {
    const since = new Date()
    since.setDate(since.getDate() - days)
    where.createdAt = { gte: since }
  }

  // Maladie filter
  if (maladieIds.length > 0) {
    where.maladieId = { in: maladieIds }
  } else if (maladieIdSingle) {
    where.maladieId = maladieIdSingle
  }

  // Geo filter — commune takes priority over wilaya
  if (communeId) {
    where.communeId = communeId
  } else if (wilayadIds.length > 0) {
    where.commune = { wilayadId: { in: wilayadIds } }
  }

  // Cases by disease (prevalence)
  const byMaladie = await prisma.casDeclare.groupBy({
    by: ["maladieId"],
    where,
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  })
  const maladieFetchIds = byMaladie.map(r => r.maladieId).filter((id): id is string => Boolean(id))
  const maladies = await prisma.maladie.findMany({ where: { id: { in: maladieFetchIds } } })
  const maladieMap = Object.fromEntries(maladies.map(m => [m.id, m.nom]))
  const prevalence = byMaladie.map(r => ({
    name: r.maladieId ? (maladieMap[r.maladieId] ?? "Inconnu") : "Non renseigné",
    count: r._count.id,
  }))

  // Cases by status
  const byStatut = await prisma.casDeclare.groupBy({
    by: ["statut"],
    where,
    _count: { id: true },
  })
  const statutDistribution = byStatut.map(r => ({ name: r.statut, count: r._count.id }))

  // Cases with patient data for age/sex breakdown and trend
  const allCas = await prisma.casDeclare.findMany({
    where,
    select: {
      createdAt: true,
      statut: true,
      patient: { select: { dateOfBirth: true, sex: true } },
    },
  })

  const ageGroups: Record<string, number> = { "0-14": 0, "15-29": 0, "30-44": 0, "45-59": 0, "60+": 0 }
  const bySex: Record<string, number> = { homme: 0, femme: 0 }
  const today = new Date()
  allCas.forEach(c => {
    const age = today.getFullYear() - new Date(c.patient.dateOfBirth).getFullYear()
    if (age < 15) ageGroups["0-14"]++
    else if (age < 30) ageGroups["15-29"]++
    else if (age < 45) ageGroups["30-44"]++
    else if (age < 60) ageGroups["45-59"]++
    else ageGroups["60+"]++
    bySex[c.patient.sex] = (bySex[c.patient.sex] ?? 0) + 1
  })

  const ageDistribution = Object.entries(ageGroups).map(([name, count]) => ({ name, count }))
  const sexDistribution = Object.entries(bySex).map(([name, count]) => ({
    name: name === "homme" ? "Homme" : "Femme",
    count,
  }))

  // Temporal trend (weekly)
  const periodDays = dateDebut || dateFin
    ? Math.max(7, Math.ceil((new Date(dateFin || today).getTime() - new Date(dateDebut || today).getTime()) / (1000 * 60 * 60 * 24)) + 1)
    : days
  const weeks: Record<string, number> = {}
  for (let i = Math.ceil(periodDays / 7) - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i * 7)
    const key = `S${d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}`
    weeks[key] = 0
  }
  allCas.forEach(c => {
    const d = new Date(c.createdAt)
    const weekDiff = Math.floor((today.getTime() - d.getTime()) / (7 * 24 * 60 * 60 * 1000))
    const weekDate = new Date()
    weekDate.setDate(weekDate.getDate() - weekDiff * 7)
    const key = `S${weekDate.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}`
    if (key in weeks) weeks[key]++
  })
  const weeklyTrend = Object.entries(weeks).map(([date, count]) => ({ date, count }))

  const total = allCas.length
  const confirmes = allCas.filter(c => c.statut === "confirme").length
  const tauxConfirmation = total > 0 ? Math.round((confirmes / total) * 100) : 0

  return NextResponse.json({
    prevalence,
    statutDistribution,
    ageDistribution,
    sexDistribution,
    weeklyTrend,
    summary: { total, confirmes, tauxConfirmation, maladiesActives: maladieFetchIds.length },
  })
}
