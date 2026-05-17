import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { id } = await params
  const alerte = await prisma.alerte.findUnique({
    where: { id },
    include: {
      maladie: true,
      commune: true,
      auteur: { select: { firstName: true, lastName: true } },
    },
  })
  if (!alerte) return NextResponse.json({ error: "Non trouvé" }, { status: 404 })
  return NextResponse.json(alerte)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  if (!["epidemiologiste", "admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()

  const alerte = await prisma.alerte.update({
    where: { id },
    data: {
      statut: body.statut,
      ...(body.statut === "resolue" && { resolvedAt: new Date() }),
    },
  })
  return NextResponse.json(alerte)
}
