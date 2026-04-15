import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  if (!["epidemiologiste", "admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type") ?? ""

  const rapports = await prisma.rapport.findMany({
    where: type ? { type: type as never } : undefined,
    orderBy: { createdAt: "desc" },
    select: {
      id: true, type: true, titre: true, dateDebut: true, dateFin: true,
      statut: true, generePar: true, createdAt: true,
    },
  })
  return NextResponse.json(rapports)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  if (!["epidemiologiste", "admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const dateDebut = new Date(body.dateDebut)
    const dateFin = new Date(body.dateFin)

    if (isNaN(dateDebut.getTime()) || isNaN(dateFin.getTime())) {
      return NextResponse.json({ error: "Dates invalides" }, { status: 400 })
    }

    const serviceFilter = body.service ? String(body.service).trim() : null

    const since = dateDebut
    const until = new Date(dateFin)
    until.setHours(23, 59, 59, 999)

    const baseWhere = {
      createdAt: { gte: since, lte: until },
      ...(serviceFilter ? { service: { contains: serviceFilter } } : {}),
    }

    const [totalCas, casByMaladieRaw, casByCommuneRaw, casByServiceRaw, weeklyRaw, ageRaw, statutRaw, totalAlertes, totalInvestigations] =
      await Promise.all([
        prisma.casDeclare.count({ where: baseWhere }),

        prisma.casDeclare.groupBy({
          by: ["maladieId"],
          _count: { _all: true },
          where: baseWhere,
          orderBy: { _count: { maladieId: "desc" } },
        }),

        prisma.casDeclare.groupBy({
          by: ["communeId"],
          _count: { _all: true },
          where: baseWhere,
        }),

        prisma.casDeclare.groupBy({
          by: ["service"],
          _count: { _all: true },
          where: baseWhere,
          orderBy: { _count: { service: "desc" } },
        }),

        prisma.$queryRaw<{ week: string; count: bigint }[]>`
          SELECT to_char(date_trunc('week', created_at), 'DD/MM') as week, COUNT(*)::int as count
          FROM cas_declares
          WHERE created_at >= ${since} AND created_at <= ${until}
          GROUP BY date_trunc('week', created_at)
          ORDER BY date_trunc('week', created_at)
        `,

        prisma.$queryRaw<{ tranche: string; count: bigint }[]>`
          SELECT
            CASE
              WHEN EXTRACT(YEAR FROM AGE(p.date_of_birth)) < 5 THEN '0-4'
              WHEN EXTRACT(YEAR FROM AGE(p.date_of_birth)) < 15 THEN '5-14'
              WHEN EXTRACT(YEAR FROM AGE(p.date_of_birth)) < 25 THEN '15-24'
              WHEN EXTRACT(YEAR FROM AGE(p.date_of_birth)) < 45 THEN '25-44'
              WHEN EXTRACT(YEAR FROM AGE(p.date_of_birth)) < 65 THEN '45-64'
              ELSE '65+'
            END as tranche,
            COUNT(*)::int as count
          FROM cas_declares c
          JOIN patients p ON p.id = c.patient_id
          WHERE c.created_at >= ${since} AND c.created_at <= ${until}
          GROUP BY tranche
          ORDER BY tranche
        `,

        prisma.casDeclare.groupBy({
          by: ["statut"],
          _count: { _all: true },
          where: baseWhere,
        }),

        prisma.alerte.count({ where: { createdAt: { gte: since, lte: until } } }),
        prisma.investigation.count({ where: { createdAt: { gte: since, lte: until } } }),
      ])

    // Resolve maladie names
    const maladieIds = casByMaladieRaw.map(r => r.maladieId).filter(Boolean) as string[]
    const maladies = await prisma.maladie.findMany({ where: { id: { in: maladieIds } }, select: { id: true, nom: true } })
    const maladieMap = Object.fromEntries(maladies.map(m => [m.id, m.nom]))

    // Resolve commune names
    const communeIds = casByCommuneRaw.map(r => r.communeId).filter(Boolean) as string[]
    const communes = await prisma.commune.findMany({ where: { id: { in: communeIds } }, select: { id: true, nom: true } })
    const communeMap = Object.fromEntries(communes.map(c => [c.id, c.nom]))

    const confirmes = statutRaw.find(s => s.statut === "confirme")?._count._all ?? 0

    const donnees = {
      summary: {
        total: totalCas,
        confirmes,
        tauxConfirmation: totalCas > 0 ? Math.round((confirmes / totalCas) * 100) : 0,
        alertes: totalAlertes,
        investigations: totalInvestigations,
        serviceFiltre: serviceFilter || null,
      },
      casByMaladie: casByMaladieRaw.map(r => ({ maladie: maladieMap[r.maladieId ?? ""] ?? "—", count: r._count._all })),
      casByCommune: casByCommuneRaw.map(r => ({ commune: communeMap[r.communeId ?? ""] ?? "—", count: r._count._all })),
      casByService: casByServiceRaw.map(r => ({ service: r.service ?? "Non spécifié", count: r._count._all })),
      weeklyTrend: weeklyRaw.map(r => ({ date: r.week, count: Number(r.count) })),
      ageDistribution: ageRaw.map(r => ({ name: r.tranche, count: Number(r.count) })),
      statutDistribution: statutRaw.map(r => ({ name: r.statut, count: r._count._all })),
    }

    const months: Record<number, string> = {
      1:"Janvier",2:"Février",3:"Mars",4:"Avril",5:"Mai",6:"Juin",
      7:"Juillet",8:"Août",9:"Septembre",10:"Octobre",11:"Novembre",12:"Décembre",
    }
    const titre = body.type === "mensuel"
      ? `Rapport Mensuel — ${months[dateDebut.getMonth() + 1]} ${dateDebut.getFullYear()}`
      : body.type === "trimestriel"
      ? `Rapport Trimestriel — T${Math.ceil((dateDebut.getMonth() + 1) / 3)} ${dateDebut.getFullYear()}`
      : body.type === "semestriel"
      ? `Rapport Semestriel — S${dateDebut.getMonth() < 6 ? 1 : 2} ${dateDebut.getFullYear()}`
      : body.type === "annuel"
      ? `Rapport Annuel — ${dateDebut.getFullYear()}`
      : `Rapport Personnalisé — ${dateDebut.toLocaleDateString("fr-FR")} au ${dateFin.toLocaleDateString("fr-FR")}`

    const titreAvecService = serviceFilter ? `${titre} · ${serviceFilter}` : titre

    const rapport = await prisma.rapport.create({
      data: {
        type: body.type ?? "personnalise",
        titre: titreAvecService,
        dateDebut,
        dateFin,
        donnees,
        generePar: "utilisateur",
        createdBy: session.user.id,
        statut: "genere",
        wilayadId: body.wilayadId ?? null,
      },
    })

    return NextResponse.json(rapport, { status: 201 })
  } catch (err) {
    console.error("[POST /api/rapports]", err)
    const message = err instanceof Error ? err.message : "Erreur interne"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

