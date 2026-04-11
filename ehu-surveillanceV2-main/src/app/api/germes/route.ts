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
      { nom: { contains: search } },
      { code: { contains: search } },
    ]
  }

  const germes = await prisma.germe.findMany({
    where,
    orderBy: [{ type: "asc" }, { nom: "asc" }],
    take: 100,
  })

  return NextResponse.json(germes)
}

