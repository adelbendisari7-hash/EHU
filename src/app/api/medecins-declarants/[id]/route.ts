import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  if (session.user.role !== "admin") return NextResponse.json({ error: "Accès refusé" }, { status: 403 })

  const { id } = await params
  const { nom, prenom, service } = await req.json()
  if (!nom || !prenom || !service) {
    return NextResponse.json({ error: "nom, prenom et service sont requis" }, { status: 400 })
  }

  const medecin = await prisma.medecinDeclarant.update({
    where: { id },
    data: { nom, prenom, service },
  })

  return NextResponse.json(medecin)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  if (session.user.role !== "admin") return NextResponse.json({ error: "Accès refusé" }, { status: 403 })

  const { id } = await params

  await prisma.medecinDeclarant.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
