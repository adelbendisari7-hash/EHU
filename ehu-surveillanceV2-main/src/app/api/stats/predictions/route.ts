import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const communeIds = (searchParams.get("communeIds") ?? "").split(",").filter(Boolean)
  const maladieIds = (searchParams.get("maladieIds") ?? "").split(",").filter(Boolean)
  const wilayadIds = (searchParams.get("wilayadIds") ?? "").split(",").filter(Boolean)

  // Always fetch 90 days — algorithms need enough history
  const since = new Date()
  since.setDate(since.getDate() - 90)

  const where: Record<string, unknown> = {
    createdAt: { gte: since },
    statut: { not: "brouillon" },
  }
  if (maladieIds.length === 1) where.maladieId = maladieIds[0]
  else if (maladieIds.length > 1) where.maladieId = { in: maladieIds }
  if (communeIds.length === 1) where.communeId = communeIds[0]
  else if (communeIds.length > 1) where.communeId = { in: communeIds }
  if (wilayadIds.length > 0) where.commune = { wilayadId: { in: wilayadIds } }

  const casByDay = await prisma.casDeclare.groupBy({
    by: ["createdAt"],
    where,
    _count: { id: true },
    orderBy: { createdAt: "asc" },
  })

  // Build day-by-day buckets (90 days)
  const today = new Date()
  const dayMap: Record<string, number> = {}
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    dayMap[d.toISOString().slice(0, 10)] = 0
  }
  casByDay.forEach(row => {
    const key = new Date(row.createdAt).toISOString().slice(0, 10)
    if (key in dayMap) dayMap[key] += row._count.id
  })

  const series = Object.entries(dayMap).map(([date, count]) => ({ date, count }))

  // Build a human-readable context label
  let contextLabel = "Toutes maladies — toutes zones"
  const parts: string[] = []
  if (maladieIds.length === 1) {
    const m = await prisma.maladie.findUnique({ where: { id: maladieIds[0] }, select: { nom: true } })
    if (m) parts.push(m.nom)
  } else if (maladieIds.length > 1) {
    parts.push(`${maladieIds.length} maladies`)
  }
  if (wilayadIds.length === 1) {
    const w = await prisma.wilaya.findUnique({ where: { id: wilayadIds[0] }, select: { nom: true } })
    if (w) parts.push(`Wilaya de ${w.nom}`)
  } else if (wilayadIds.length > 1) {
    parts.push(`${wilayadIds.length} wilayas`)
  }
  if (communeIds.length === 1) {
    const c = await prisma.commune.findUnique({ where: { id: communeIds[0] }, select: { nom: true } })
    if (c) parts.push(`Commune de ${c.nom}`)
  } else if (communeIds.length > 1) {
    parts.push(`${communeIds.length} communes`)
  }
  if (parts.length > 0) contextLabel = parts.join(" · ")

  return NextResponse.json({ series, contextLabel })
}
