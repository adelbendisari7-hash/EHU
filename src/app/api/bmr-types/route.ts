import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const types = await prisma.typeBmr.findMany({
    orderBy: { nom: "asc" },
    select: { id: true, nom: true, codeCim10: true },
  })

  return NextResponse.json(types)
}

const createSchema = z.object({
  nom: z.string().min(1).max(120).trim(),
  codeCim10: z.string().max(20).trim().optional(),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 })

  // Upsert — return existing if already present (case-insensitive check)
  const existing = await prisma.typeBmr.findFirst({
    where: { nom: { equals: parsed.data.nom, mode: "insensitive" } },
    select: { id: true, nom: true, codeCim10: true },
  })
  if (existing) return NextResponse.json(existing)

  const type = await prisma.typeBmr.create({
    data: {
      id: crypto.randomUUID(),
      nom: parsed.data.nom,
      codeCim10: parsed.data.codeCim10 || null,
    },
    select: { id: true, nom: true, codeCim10: true },
  })

  return NextResponse.json(type, { status: 201 })
}
