import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const maladies = await prisma.maladie.findMany({
      where: { isActive: true },
      orderBy: [{ categorie: "asc" }, { nom: "asc" }],
      select: {
        id: true,
        nom: true,
        codeCim10: true,
        categorie: true,
        nomCourt: true,
        seuilDefaut: true,
        hasFicheSpecifique: true,
        ficheSpecifiqueSlug: true,
        categorieGravite: true,
      },
    })

    const grouped = {
      categorie_1_mdo: maladies.filter((m) => m.categorie === "categorie_1_mdo"),
      categorie_2_epidemique: maladies.filter((m) => m.categorie === "categorie_2_epidemique"),
      categorie_3_bmr: maladies.filter((m) => m.categorie === "categorie_3_bmr"),
    }

    return NextResponse.json({ maladies, grouped })
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

