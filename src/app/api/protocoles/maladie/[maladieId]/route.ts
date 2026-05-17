import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(_req: Request, { params }: { params: Promise<{ maladieId: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  const { maladieId } = await params
  const protocole = await prisma.protocole.findUnique({
    where: { maladieId },
    include: { maladie: { select: { nom: true, codeCim10: true, seuilDefaut: true } } },
  })
  if (!protocole) return NextResponse.json(null)
  return NextResponse.json(protocole)
}
