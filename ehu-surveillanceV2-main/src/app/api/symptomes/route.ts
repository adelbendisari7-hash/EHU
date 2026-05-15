import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get("q") ?? ""

  const all = searchParams.get("all") === "true"
  const where: Record<string, unknown> = all ? {} : { isActive: true }
  if (search) {
    where.OR = [
      { nom: { contains: search, mode: "insensitive" } },
      { code: { contains: search, mode: "insensitive" } },
    ]
  }

  const symptomes = await prisma.symptome.findMany({
    where,
    orderBy: [{ categorie: "asc" }, { nom: "asc" }],
    take: 100,
  })

  return NextResponse.json(symptomes)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const body = await req.json()
  const { nom, categorie } = body as { nom?: string; categorie?: string }

  if (!nom || nom.trim().length < 2) {
    return NextResponse.json({ error: "Nom du symptôme requis (min. 2 caractères)" }, { status: 400 })
  }

  const baseCode = nom.trim().toUpperCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Z0-9]/g, "_")
    .slice(0, 20)
  const code = `${baseCode}_${Date.now()}`

  try {
    const symptome = await prisma.symptome.create({
      data: {
        nom: nom.trim(),
        code,
        categorie: categorie || null,
        isActive: true,
      },
    })
    return NextResponse.json(symptome, { status: 201 })
  } catch (e: unknown) {
    if ((e as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "Ce symptôme existe déjà" }, { status: 409 })
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

