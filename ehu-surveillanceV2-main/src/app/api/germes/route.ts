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

  const germes = await prisma.germe.findMany({
    where,
    orderBy: [{ type: "asc" }, { nom: "asc" }],
    take: 100,
  })

  return NextResponse.json(germes)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const body = await req.json()
  const { nom, code } = body as { nom?: string; code?: string }

  if (!nom || nom.trim().length < 2) {
    return NextResponse.json({ error: "Nom du germe requis (min. 2 caractères)" }, { status: 400 })
  }

  try {
    const germe = await prisma.germe.create({
      data: {
        nom: nom.trim(),
        code: code?.trim() || "U82.8",
        type: "bacterie",
        isActive: true,
      },
    })
    return NextResponse.json(germe, { status: 201 })
  } catch (e: unknown) {
    if ((e as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "Ce germe existe déjà" }, { status: 409 })
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

