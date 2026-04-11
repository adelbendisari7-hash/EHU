import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  const { id } = await params
  const protocole = await prisma.protocole.findUnique({
    where: { id },
    include: { maladie: true },
  })
  if (!protocole) return NextResponse.json({ error: "Introuvable" }, { status: 404 })
  return NextResponse.json(protocole)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  if (!["epidemiologiste", "admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }
  const { id } = await params
  const body = await req.json()
  const protocole = await prisma.protocole.update({
    where: { id },
    data: { ...body, updatedBy: session.user.id, version: { increment: 1 } },
    include: { maladie: { select: { nom: true } } },
  })
  return NextResponse.json(protocole)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }
  const { id } = await params
  await prisma.protocole.update({ where: { id }, data: { isActive: false } })
  return NextResponse.json({ success: true })
}
