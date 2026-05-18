import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const { titre, type, sections, visualisations, description } = body

  const existing = await prisma.rapport.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: "Modèle introuvable" }, { status: 404 })

  const updated = await prisma.rapport.update({
    where: { id },
    data: {
      titre: titre ?? existing.titre,
      type: type ?? existing.type,
      donnees: {
        isTemplate: true,
        sections: sections ?? (existing.donnees as Record<string, unknown>)?.sections ?? [],
        visualisations: visualisations ?? (existing.donnees as Record<string, unknown>)?.visualisations ?? [],
        description: description ?? (existing.donnees as Record<string, unknown>)?.description ?? "",
      },
    },
  })

  return NextResponse.json({ template: updated })
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const { id } = await params
  await prisma.rapport.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
