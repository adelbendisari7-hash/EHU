import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const protocoles = await prisma.protocole.findMany({
    where: { isActive: true },
    include: { maladie: { select: { nom: true, codeCim10: true } } },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(protocoles)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  if (!["epidemiologiste", "admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }

  const body = await req.json()
  const protocole = await prisma.protocole.create({
    data: {
      maladieId: body.maladieId,
      titre: body.titre,
      conduiteMedicale: body.conduiteMedicale,
      actionsAdministratives: body.actionsAdministratives,
      investigationSteps: body.investigationSteps,
      posologies: body.posologies ?? null,
      mesuresPrevention: body.mesuresPrevention ?? null,
      dureeSurveillance: body.dureeSurveillance ?? null,
      createdBy: session.user.id,
    },
    include: { maladie: { select: { nom: true } } },
  })
  return NextResponse.json(protocole, { status: 201 })
}

