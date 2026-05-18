import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const etablissements = await prisma.etablissement.findMany({
      orderBy: { nom: "asc" },
      include: { wilaya: true },
    })
    return NextResponse.json(etablissements)
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

