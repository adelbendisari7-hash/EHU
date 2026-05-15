import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { nom, code, type, isActive } = body as { nom?: string; code?: string; type?: string; isActive?: boolean }

  try {
    const germe = await prisma.germe.update({
      where: { id },
      data: {
        ...(nom !== undefined ? { nom: nom.trim() } : {}),
        ...(code !== undefined ? { code: code.trim() } : {}),
        ...(type !== undefined ? { type } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
    })
    return NextResponse.json(germe)
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { id } = await params
  try {
    await prisma.germe.update({ where: { id }, data: { isActive: false } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
