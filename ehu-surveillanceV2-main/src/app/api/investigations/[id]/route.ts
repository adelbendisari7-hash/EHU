import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { id } = await params

  const investigation = await prisma.investigation.findUnique({
    where: { id },
    include: {
      cas: {
        include: {
          patient: { include: { commune: true } },
          maladie: true,
          commune: true,
          etablissement: true,
        },
      },
      epidemiologiste: { select: { firstName: true, lastName: true, email: true } },
      contacts: { orderBy: { createdAt: "asc" } },
    },
  })

  if (!investigation) return NextResponse.json({ error: "Non trouvé" }, { status: 404 })
  return NextResponse.json(investigation)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const investigation = await prisma.investigation.update({
    where: { id },
    data: {
      ...(body.statut && { statut: body.statut }),
      ...(body.conclusion !== undefined && { conclusion: body.conclusion }),
      ...(body.mesuresControle !== undefined && { mesuresControle: body.mesuresControle }),
      ...(body.statut === "terminee" && { dateFin: new Date() }),
    },
    include: { contacts: true },
  })
  return NextResponse.json(investigation)
}
