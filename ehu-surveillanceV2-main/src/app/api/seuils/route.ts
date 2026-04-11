import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  if (!["epidemiologiste", "admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }

  const seuils = await prisma.seuilAlerte.findMany({
    where: { isActive: true },
    include: {
      maladie: { select: { nom: true, codeCim10: true } },
      commune: { select: { nom: true } },
      wilaya: { select: { nom: true } },
    },
    orderBy: [{ maladie: { nom: "asc" } }],
  })
  return NextResponse.json(seuils)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  if (!["epidemiologiste", "admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }

  const body = await req.json()
  const seuil = await prisma.seuilAlerte.create({
    data: {
      maladieId: body.maladieId,
      perimetre: body.perimetre,
      communeId: body.communeId ?? null,
      wilayadId: body.wilayadId ?? null,
      seuilNombre: Number(body.seuilNombre),
      periodejours: Number(body.periodejours ?? 30),
      gravite: body.gravite,
      autoAlerte: body.autoAlerte ?? true,
      autoNotification: body.autoNotification ?? true,
      configuredBy: session.user.id,
    },
    include: {
      maladie: { select: { nom: true, codeCim10: true } },
      commune: { select: { nom: true } },
      wilaya: { select: { nom: true } },
    },
  })
  return NextResponse.json(seuil, { status: 201 })
}

