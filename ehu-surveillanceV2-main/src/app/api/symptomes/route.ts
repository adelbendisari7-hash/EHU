import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get("q") ?? ""

  const where: Record<string, unknown> = { isActive: true }
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

