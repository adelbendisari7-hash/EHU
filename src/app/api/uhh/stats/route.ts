import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { UHH_GERMES_NOMS } from "@/constants/germes"

// UHH-relevant disease categories in CasDeclare
const UHH_NOMCOURT  = ["PAVM", "ISO", "BMR"]
const BMR_CATEGORIE = "categorie_3_bmr"

// GET /api/uhh/stats?services=Cardiologie,Pneumologie&germeIds=id1,id2
export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const perms: string[] = session.user.permissions ?? []
  if (!perms.includes("uhh.dashboard") && session.user.role !== "admin") {
    return NextResponse.json({ error: "Accès réservé à l'UHH" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const services  = searchParams.get("services")?.split(",").map(s => s.trim()).filter(Boolean) ?? []
  const germeIds  = searchParams.get("germeIds")?.split(",").map(s => s.trim()).filter(Boolean) ?? []

  const now      = new Date()
  const debut30j = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const debut90j = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

  // Fetch UHH-relevant diseases (PAVM, ISO, BMR general, all BMR subtypes)
  const uhhMaladies = await prisma.maladie.findMany({
    where: {
      OR: [
        { nomCourt: { in: UHH_NOMCOURT } },
        { categorie: BMR_CATEGORIE },
      ],
      isActive: true,
    },
    select: { id: true, nom: true, nomCourt: true, categorie: true },
  })
  const uhhMaladieIds = uhhMaladies.map(m => m.id)
  const maladieMap: Record<string, typeof uhhMaladies[0]> = Object.fromEntries(uhhMaladies.map(m => [m.id, m]))

  // Fetch the 15 UHH reference germes (always — for filter population)
  const uhhGermes = await prisma.germe.findMany({
    where: {
      OR: UHH_GERMES_NOMS.map(nom => ({ nom: { equals: nom, mode: "insensitive" as const } })),
    },
    select: { id: true, nom: true },
    orderBy: { nom: "asc" },
  })
  const uhhGermeIds = uhhGermes.map(g => g.id)

  // Base CasDeclare filter
  const baseWhere: Record<string, unknown> = {
    maladieId: { in: uhhMaladieIds },
    statut:    { not: "brouillon" },
  }
  if (services.length > 0)  baseWhere.serviceDeclarant = { in: services }
  if (germeIds.length  > 0) baseWhere.resultatsLabo    = { some: { germeId: { in: germeIds } } }

  const [
    totalCas,
    casEnCours,
    casDerniers30j,
    parMaladie,
    parService,
    tendance90j,
    germeLabo,
  ] = await Promise.all([
    prisma.casDeclare.count({ where: baseWhere }),
    prisma.casDeclare.count({ where: { ...baseWhere, statut: "suspect" } }),
    prisma.casDeclare.count({ where: { ...baseWhere, createdAt: { gte: debut30j } } }),

    prisma.casDeclare.groupBy({
      by: ["maladieId"],
      where: baseWhere,
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    }),

    prisma.casDeclare.groupBy({
      by: ["serviceDeclarant"],
      where: baseWhere,
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    }),

    prisma.casDeclare.findMany({
      where: { ...baseWhere, createdAt: { gte: debut90j } },
      select: { createdAt: true, maladieId: true },
    }),

    // Germe distribution: count lab results linked to UHH cases, restricted to the 15 UHH germes
    prisma.resultatLabo.groupBy({
      by: ["germeId"],
      where: {
        germeId: { in: uhhGermeIds },
        cas: {
          maladieId: { in: uhhMaladieIds },
          statut:    { not: "brouillon" },
          ...(services.length > 0  ? { serviceDeclarant: { in: services } }             : {}),
          ...(germeIds.length  > 0  ? { resultatsLabo: { some: { germeId: { in: germeIds } } } } : {}),
        },
      },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    }),
  ])

  // Group into PAVM / ISO / BMR
  const typeCountMap: Record<string, number> = { PAVM: 0, ISO: 0, BMR: 0 }
  const bmrSubtypeMap: Record<string, number> = {}

  for (const r of parMaladie) {
    if (!r.maladieId) continue
    const m = maladieMap[r.maladieId]
    if (!m) continue
    if (m.nomCourt === "PAVM") typeCountMap.PAVM += r._count.id
    else if (m.nomCourt === "ISO") typeCountMap.ISO += r._count.id
    else {
      typeCountMap.BMR += r._count.id
      const label = m.nomCourt ?? m.nom
      bmrSubtypeMap[label] = (bmrSubtypeMap[label] ?? 0) + r._count.id
    }
  }

  const parType = (["PAVM", "ISO", "BMR"] as const)
    .filter(t => typeCountMap[t] > 0)
    .map(t => ({ type: t, count: typeCountMap[t] }))

  const bmrSubtypes = Object.entries(bmrSubtypeMap)
    .sort((a, b) => b[1] - a[1])
    .map(([nom, count]) => ({ nom, count }))

  // Service distribution
  const serviceDistrib = parService
    .filter(s => s.serviceDeclarant)
    .map(s => ({ service: s.serviceDeclarant!, count: s._count.id }))

  // Weekly trend (90 days)
  const semaines: Record<string, { total: number; pavm: number; iso: number; bmr: number }> = {}
  for (const cas of tendance90j) {
    const d   = new Date(cas.createdAt)
    const day = d.getDay() || 7
    const lundi = new Date(d)
    lundi.setDate(d.getDate() - day + 1)
    const key = lundi.toISOString().slice(0, 10)
    if (!semaines[key]) semaines[key] = { total: 0, pavm: 0, iso: 0, bmr: 0 }
    semaines[key].total++
    const m = cas.maladieId ? maladieMap[cas.maladieId] : null
    if (m?.nomCourt === "PAVM") semaines[key].pavm++
    else if (m?.nomCourt === "ISO") semaines[key].iso++
    else semaines[key].bmr++
  }
  const tendance = Object.entries(semaines)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([semaine, v]) => ({ semaine, ...v }))

  // Germe distribution — join with names
  const germeIdToNom = Object.fromEntries(uhhGermes.map(g => [g.id, g.nom]))
  const parGerme = germeLabo
    .filter(r => r.germeId)
    .map(r => ({ germeId: r.germeId!, nom: germeIdToNom[r.germeId!] ?? "Inconnu", count: r._count.id }))
    .sort((a, b) => b.count - a.count)

  return NextResponse.json({
    totaux: {
      total:       totalCas,
      enCours:     casEnCours,
      bmr:         typeCountMap.BMR,
      derniers30j: casDerniers30j,
      tauxBMR:     totalCas > 0 ? Math.round((typeCountMap.BMR / totalCas) * 100) : 0,
    },
    parType,
    bmrSubtypes,
    parService:  serviceDistrib,
    parGerme,
    germeRefs:   uhhGermes,   // full list of 15 UHH germes for the filter
    tendance,
  })
}
