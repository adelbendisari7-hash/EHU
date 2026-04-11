import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  if (!["epidemiologiste", "admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }

  const investigations = await prisma.investigation.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      cas: { include: { patient: true, maladie: true, commune: true } },
      epidemiologiste: { select: { firstName: true, lastName: true } },
      contacts: true,
    },
  })
  return NextResponse.json(investigations)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  if (!["epidemiologiste", "admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }

  const body = await req.json()

  const existing = await prisma.investigation.findUnique({ where: { casId: body.casId } })
  if (existing) return NextResponse.json(existing)

  const investigation = await prisma.investigation.create({
    data: {
      casId: body.casId,
      epidemiologisteId: session.user.id,
      dateDebut: new Date(),
      statut: "en_cours",
    },
    include: { cas: { include: { patient: true, maladie: true } }, contacts: true },
  })

  // Update case status to en_cours
  await prisma.casDeclare.update({
    where: { id: body.casId },
    data: { statut: "en_cours" },
  })

  return NextResponse.json(investigation, { status: 201 })
}

