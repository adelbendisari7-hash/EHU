import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const medecins = await prisma.medecinDeclarant.findMany({
    orderBy: [{ nom: "asc" }, { prenom: "asc" }],
  })

  return NextResponse.json(medecins)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { nom, prenom, service } = await req.json()
  if (!nom || !prenom || !service) {
    return NextResponse.json({ error: "nom, prenom et service sont requis" }, { status: 400 })
  }

  const medecin = await prisma.medecinDeclarant.upsert({
    where: { nom_prenom_service: { nom, prenom, service } },
    update: {},
    create: { nom, prenom, service },
  })

  return NextResponse.json(medecin, { status: 201 })
}
