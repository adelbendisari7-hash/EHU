import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  if (!["epidemiologiste", "admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }
  const { id } = await params
  const rapport = await prisma.rapport.findUnique({ where: { id } })
  if (!rapport) return NextResponse.json({ error: "Introuvable" }, { status: 404 })
  return NextResponse.json(rapport)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }
  const { id } = await params
  await prisma.rapport.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
