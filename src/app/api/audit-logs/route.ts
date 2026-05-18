import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  if (session.user.role !== "admin") return NextResponse.json({ error: "Admin requis" }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
  const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "50"))
  const userId = searchParams.get("userId") ?? ""
  const action = searchParams.get("action") ?? ""
  const entity = searchParams.get("entity") ?? ""
  const dateDebut = searchParams.get("dateDebut") ?? ""
  const dateFin = searchParams.get("dateFin") ?? ""

  const where: Record<string, unknown> = {}
  if (userId) where.userId = userId
  if (action) where.action = { contains: action, mode: "insensitive" }
  if (entity) where.entity = entity
  if (dateDebut || dateFin) {
    where.createdAt = {
      ...(dateDebut ? { gte: new Date(dateDebut) } : {}),
      ...(dateFin ? { lte: new Date(dateFin + "T23:59:59.999Z") } : {}),
    }
  }

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    }),
  ])

  return NextResponse.json({ logs, total, page, totalPages: Math.ceil(total / limit) })
}
