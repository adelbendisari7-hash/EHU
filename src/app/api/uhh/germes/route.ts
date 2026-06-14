import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET /api/uhh/germes?serviceIds=id1,id2&germeIds=id1,id2&bmrOnly=true
export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const perms: string[] = session.user.permissions ?? []
  if (!perms.includes("uhh.dashboard") && session.user.role !== "admin") {
    return NextResponse.json({ error: "Accès réservé à l'UHH" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const serviceIds = (searchParams.get("serviceIds") ?? "").split(",").map(s => s.trim()).filter(Boolean)
  const germeIds   = (searchParams.get("germeIds")   ?? "").split(",").map(s => s.trim()).filter(Boolean)
  const bmrOnly    = searchParams.get("bmrOnly") === "true"

  const where: Record<string, unknown> = { germeId: { not: null } }
  if (serviceIds.length > 0) where.serviceId = { in: serviceIds }
  if (germeIds.length   > 0) where.germeId   = { in: germeIds }
  if (bmrOnly)               where.isBMR     = true

  // Toutes les IAS correspondant au filtre
  const infections = await prisma.infectionIAS.findMany({
    where,
    select: {
      germeId: true,
      typeIAS: true,
      isBMR: true,
      service: { select: { id: true, nom: true } },
      germe:   { select: { id: true, nom: true, code: true, type: true } },
    },
  })

  // Agréger par germe
  const germeMap: Record<string, {
    germeId: string; nom: string; code: string; type: string | null
    total: number; bmr: number
    parType: Record<string, number>
    parService: Record<string, { nom: string; count: number }>
  }> = {}

  for (const inf of infections) {
    if (!inf.germe || !inf.germeId) continue
    if (!germeMap[inf.germeId]) {
      germeMap[inf.germeId] = {
        germeId: inf.germeId, nom: inf.germe.nom, code: inf.germe.code, type: inf.germe.type,
        total: 0, bmr: 0,
        parType: { PAVM: 0, ISO: 0, Autre: 0 },
        parService: {},
      }
    }
    const g = germeMap[inf.germeId]
    g.total++
    if (inf.isBMR) g.bmr++
    g.parType[inf.typeIAS] = (g.parType[inf.typeIAS] ?? 0) + 1
    const sid = inf.service.id
    if (!g.parService[sid]) g.parService[sid] = { nom: inf.service.nom, count: 0 }
    g.parService[sid].count++
  }

  const germes = Object.values(germeMap)
    .sort((a, b) => b.total - a.total)
    .map(g => ({ ...g, parService: Object.values(g.parService), pctBMR: g.total > 0 ? Math.round((g.bmr / g.total) * 100) : 0 }))

  // Listes complètes pour alimenter les filtres
  const [allServices, allGermes] = await Promise.all([
    prisma.service.findMany({
      where: { isActive: true },
      select: { id: true, nom: true, codeService: true },
      orderBy: { nom: "asc" },
    }),
    prisma.germe.findMany({
      where: { isActive: true },
      select: { id: true, nom: true, type: true },
      orderBy: { nom: "asc" },
    }),
  ])

  return NextResponse.json({ germes, services: allServices, allGermes })
}
