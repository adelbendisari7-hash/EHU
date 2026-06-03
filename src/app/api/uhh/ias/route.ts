import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET /api/uhh/ias
export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const perms: string[] = session.user.permissions ?? []
  if (!perms.includes("uhh.ias.view") && session.user.role !== "admin") {
    return NextResponse.json({ error: "Accès réservé à l'UHH" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20")))
  const typeIAS = searchParams.get("typeIAS") ?? ""
  const serviceId = searchParams.get("serviceId") ?? ""
  const isBMR = searchParams.get("isBMR") ?? ""
  const statut = searchParams.get("statut") ?? ""
  const dateDebut = searchParams.get("dateDebut") ?? ""
  const dateFin = searchParams.get("dateFin") ?? ""

  const where: Record<string, unknown> = {}
  if (typeIAS) where.typeIAS = typeIAS
  if (serviceId) where.serviceId = serviceId
  if (isBMR === "true") where.isBMR = true
  if (isBMR === "false") where.isBMR = false
  if (statut) where.statut = statut
  if (dateDebut || dateFin) {
    where.dateDetection = {
      ...(dateDebut ? { gte: new Date(dateDebut) } : {}),
      ...(dateFin ? { lte: new Date(dateFin + "T23:59:59.999Z") } : {}),
    }
  }

  const [total, infections] = await Promise.all([
    prisma.infectionIAS.count({ where }),
    prisma.infectionIAS.findMany({
      where,
      orderBy: { dateDetection: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        service: { select: { id: true, nom: true, codeService: true } },
        germe: { select: { id: true, nom: true, type: true } },
        declarant: { select: { firstName: true, lastName: true } },
      },
    }),
  ])

  return NextResponse.json({
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
    infections,
  })
}

// POST /api/uhh/ias
export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const perms: string[] = session.user.permissions ?? []
  if (!perms.includes("uhh.ias.create") && session.user.role !== "admin") {
    return NextResponse.json({ error: "Accès réservé à l'UHH" }, { status: 403 })
  }

  const body = await req.json()
  const { typeIAS, serviceId, germeId, isBMR, dateDetection, dateHospitalisation, agePatient, sexePatient, antibiogramme, notes } = body

  if (!typeIAS || !serviceId || !dateDetection) {
    return NextResponse.json({ error: "Champs obligatoires manquants : typeIAS, serviceId, dateDetection" }, { status: 400 })
  }

  const infection = await prisma.infectionIAS.create({
    data: {
      typeIAS,
      serviceId,
      germeId: germeId || null,
      isBMR: isBMR ?? false,
      dateDetection: new Date(dateDetection),
      dateHospitalisation: dateHospitalisation ? new Date(dateHospitalisation) : null,
      agePatient: agePatient ? parseInt(agePatient) : null,
      sexePatient: sexePatient || null,
      antibiogramme: antibiogramme || null,
      notes: notes || null,
      statut: "en_cours",
      declarePar: session.user.id,
    },
    include: {
      service: { select: { nom: true } },
      germe: { select: { nom: true } },
    },
  })

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "CREATE",
      entity: "InfectionIAS",
      entityId: infection.id,
      details: { typeIAS, serviceId, isBMR },
    },
  })

  return NextResponse.json(infection, { status: 201 })
}
