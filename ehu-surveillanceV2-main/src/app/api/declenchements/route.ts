import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const declenchements = await prisma.protocoleDeclenchement.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      protocole: { select: { titre: true } },
      seuil: { select: { gravite: true, seuilNombre: true } },
      casDeclencheur: { select: { codeCas: true } },
      commune: { select: { nom: true } },
    },
  })
  return NextResponse.json(declenchements)
}

