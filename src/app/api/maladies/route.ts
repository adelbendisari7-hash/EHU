import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const GROUPES_ORDER = ["pev", "mth", "zoonose", "ist", "vectorielle", "nosocomiale", "autre"] as const

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const all = searchParams.get("all") === "true"

    const maladies = await prisma.maladie.findMany({
      where: all
        ? { categorie: { not: "categorie_3_bmr" } }
        : { isActive: true, categorie: { not: "categorie_3_bmr" } },
      orderBy: [{ groupeEpidemiologique: "asc" }, { nom: "asc" }],
      select: {
        id: true,
        nom: true,
        codeCim10: true,
        categorie: true,
        groupeEpidemiologique: true,
        nomCourt: true,
        seuilDefaut: true,
        hasFicheSpecifique: true,
        ficheSpecifiqueSlug: true,
        categorieGravite: true,
        isActive: true,
      },
    })

    // Group by groupeEpidemiologique (PDF categories)
    const grouped: Record<string, typeof maladies> = Object.fromEntries(
      GROUPES_ORDER.map(g => [g, []])
    )
    for (const m of maladies) {
      const g = m.groupeEpidemiologique ?? "autre"
      if (!grouped[g]) grouped[g] = []
      grouped[g].push(m)
    }

    return NextResponse.json({ maladies, grouped })
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
