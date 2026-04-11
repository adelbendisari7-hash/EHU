import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// Search existing cases for "Cas Similaire" linking
export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q") ?? ""

  if (q.length < 2) return NextResponse.json([])

  const cas = await prisma.casDeclare.findMany({
    where: {
      OR: [
        { codeCas: { contains: q } },
        { patient: { firstName: { contains: q } } },
        { patient: { lastName: { contains: q } } },
      ],
    },
    take: 10,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      codeCas: true,
      statut: true,
      createdAt: true,
      maladie: { select: { nom: true, codeCim10: true } },
      patient: { select: { firstName: true, lastName: true } },
    },
  })

  return NextResponse.json(cas)
}

