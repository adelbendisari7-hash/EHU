import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const isReadParam = searchParams.get("is_read")
  const type = searchParams.get("type") ?? undefined
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100)
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
  const dateDebut = searchParams.get("date_debut") ?? undefined
  const dateFin = searchParams.get("date_fin") ?? undefined

  const where: Record<string, unknown> = { userId: session.user.id }
  if (isReadParam === "true") where.isRead = true
  if (isReadParam === "false") where.isRead = false
  if (type) where.type = type
  if (dateDebut || dateFin) {
    where.createdAt = {
      ...(dateDebut ? { gte: new Date(dateDebut) } : {}),
      ...(dateFin ? { lte: new Date(dateFin + "T23:59:59") } : {}),
    }
  }

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: (page - 1) * limit,
    }),
    prisma.notification.count({ where }),
  ])

  const unreadCount = await prisma.notification.count({
    where: { userId: session.user.id, isRead: false },
  })

  return NextResponse.json({ notifications, unreadCount, total, page, limit })
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const body = await req.json()

  if (body.markAllRead) {
    await prisma.notification.updateMany({
      where: { userId: session.user.id, isRead: false },
      data: { isRead: true },
    })
  } else if (body.id) {
    await prisma.notification.update({
      where: { id: body.id },
      data: { isRead: true },
    })
  }

  return NextResponse.json({ success: true })
}
