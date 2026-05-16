import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { writeAudit, getIp } from "@/lib/audit"

// Templates are stored in the Rapport table with donnees.isTemplate = true
// and a sentinel date range of 1970-01-01 to 1970-01-01

const TEMPLATE_DATE = new Date("1970-01-01T00:00:00Z")

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type") ?? undefined

  const rapports = await prisma.rapport.findMany({
    where: {
      dateDebut: TEMPLATE_DATE,
      dateFin: TEMPLATE_DATE,
      ...(type ? { type: type as never } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { createdByUser: { select: { firstName: true, lastName: true } } },
  })

  const templates = rapports
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter(r => (r.donnees as any)?.isTemplate === true)
    .map(r => ({
      id: r.id,
      titre: r.titre,
      type: r.type,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sections: (r.donnees as any)?.sections ?? [],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      description: (r.donnees as any)?.description ?? "",
      createdAt: r.createdAt,
      createdBy: r.createdByUser ? `${r.createdByUser.firstName} ${r.createdByUser.lastName}` : "—",
    }))

  return NextResponse.json({ templates })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const body = await req.json()
  const { titre, type, sections, description } = body

  if (!titre || !type) {
    return NextResponse.json({ error: "Titre et type requis" }, { status: 400 })
  }

  const template = await prisma.rapport.create({
    data: {
      titre,
      type,
      dateDebut: TEMPLATE_DATE,
      dateFin: TEMPLATE_DATE,
      donnees: { isTemplate: true, sections: sections ?? [], description: description ?? "" },
      generePar: "utilisateur",
      createdBy: session.user.id,
    },
  })

  await writeAudit({
    userId: session.user.id,
    action: "CREATE",
    entity: "RapportModele",
    entityId: template.id,
    details: { titre, type },
    ip: getIp(req),
  })

  return NextResponse.json({ template }, { status: 201 })
}
