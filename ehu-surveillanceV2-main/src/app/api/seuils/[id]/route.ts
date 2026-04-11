import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  if (!["epidemiologiste", "admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }
  const { id } = await params
  const body = await req.json()
  const seuil = await prisma.seuilAlerte.update({
    where: { id },
    data: body,
    include: {
      maladie: { select: { nom: true } },
      commune: { select: { nom: true } },
      wilaya: { select: { nom: true } },
    },
  })
  return NextResponse.json(seuil)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  if (!["epidemiologiste", "admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }
  const { id } = await params
  await prisma.seuilAlerte.update({ where: { id }, data: { isActive: false } })
  return NextResponse.json({ success: true })
}
