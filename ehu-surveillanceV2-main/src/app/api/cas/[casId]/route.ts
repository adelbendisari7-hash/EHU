import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(_req: Request, { params }: { params: Promise<{ casId: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { casId } = await params

  const cas = await prisma.casDeclare.findUnique({
    where: { id: casId },
    include: {
      patient: { include: { commune: true } },
      maladie: true,
      commune: true,
      etablissement: true,
      medecin: { select: { id: true, firstName: true, lastName: true, email: true } },
      fichiers: true,
      investigation: {
        include: { contacts: true, epidemiologiste: { select: { firstName: true, lastName: true } } },
      },
    },
  })

  if (!cas) return NextResponse.json({ error: "Cas non trouvé" }, { status: 404 })

  return NextResponse.json(cas)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ casId: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { casId } = await params
  const body = await req.json()

  try {
    const cas = await prisma.casDeclare.update({
      where: { id: casId },
      data: {
        ...(body.statut && { statut: body.statut }),
        ...(body.notesCliniques !== undefined && { notesCliniques: body.notesCliniques }),
        ...(body.service && { service: body.service }),
        ...(body.resultatLabo !== undefined && { resultatLabo: body.resultatLabo }),
      },
      include: { patient: true, maladie: true },
    })
    return NextResponse.json(cas)
  } catch {
    return NextResponse.json({ error: "Erreur mise à jour" }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ casId: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  if (session.user.role !== "admin") return NextResponse.json({ error: "Admin requis" }, { status: 403 })

  const { casId } = await params

  await prisma.casDeclare.delete({ where: { id: casId } })
  return NextResponse.json({ success: true })
}
