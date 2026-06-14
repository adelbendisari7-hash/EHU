import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { writeAudit, getIp } from "@/lib/audit"
import { formatDate } from "@/utils/format-date"

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

    const servicesFilter: string[] = Array.isArray(body.services)
      ? body.services.map(String).filter(Boolean)
      : body.service ? [String(body.service).trim()] : []

    const modeleId: string | null = body.modeleId ?? null
    const maladieIdFilter: string | null = body.maladieId ?? null
    const categorieGroupeFilter: string | null = body.categorieGroupe ?? null

    const since = dateDebut
    const until = new Date(dateFin)
    until.setHours(23, 59, 59, 999)

    // Resolve category → maladie IDs filter
    let maladieIdIn: string[] | null = null
    if (maladieIdFilter) {
      maladieIdIn = [maladieIdFilter]
    } else if (categorieGroupeFilter) {
      const maladesInCat = await prisma.maladie.findMany({
        where: { groupeEpidemiologique: categorieGroupeFilter, isActive: true },
        select: { id: true },
      })
      maladieIdIn = maladesInCat.map(m => m.id)
    }

    const baseWhere = {
      createdAt: { gte: since, lte: until },
      statut: { not: "brouillon" as const },
      ...(servicesFilter.length ? { serviceDeclarant: { in: servicesFilter } } : {}),
      ...(maladieIdIn ? { maladieId: { in: maladieIdIn } } : {}),
    }

    // Fetch template visualisations if modeleId provided
    let templateVisualisations: string[] = []
    if (modeleId) {
      const TEMPLATE_DATE = new Date("1970-01-01T00:00:00Z")
      const tmpl = await prisma.rapport.findFirst({
        where: { id: modeleId, dateDebut: TEMPLATE_DATE, dateFin: TEMPLATE_DATE },
        select: { donnees: true },
      })
      if (tmpl) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        templateVisualisations = (tmpl.donnees as any)?.visualisations ?? []
      }
    }

    const [totalCas, totalHospitalises, totalEvacues, casByMaladieRaw, casByCommuneRaw, casByServiceRaw, weeklyRaw, ageRaw, statutRaw, totalAlertes, totalInvestigations, byEvolutionRaw, bySexRaw] =
      await Promise.all([
        prisma.casDeclare.count({ where: baseWhere }),
        prisma.casDeclare.count({ where: { ...baseWhere, estHospitalise: true } }),
        prisma.casDeclare.count({ where: { ...baseWhere, estEvacue: true } }),

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
          orderBy: { _count: { communeId: "desc" } },
        }),

        prisma.casDeclare.groupBy({
          by: ["serviceDeclarant"],
          _count: { _all: true },
          where: baseWhere,
          orderBy: { _count: { serviceDeclarant: "desc" } },
        }),

        prisma.$queryRaw<{ week: string; count: bigint }[]>`
          SELECT to_char(date_trunc('week', created_at), 'DD/MM') as week, COUNT(*)::int as count
          FROM cas_declares
          WHERE created_at >= ${since} AND created_at <= ${until}
          AND statut != 'brouillon'
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
          AND c.statut != 'brouillon'
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

        prisma.casDeclare.groupBy({
          by: ["evolution"],
          _count: { _all: true },
          where: { ...baseWhere, evolution: { not: null } },
        }),

        prisma.$queryRaw<{ sex: string; count: bigint }[]>`
          SELECT p.sex, COUNT(*)::int as count
          FROM cas_declares c
          JOIN patients p ON p.id = c.patient_id
          WHERE c.created_at >= ${since} AND c.created_at <= ${until}
          AND c.statut != 'brouillon'
          GROUP BY p.sex
        `,
      ])

    // Resolve maladie names + groups
    const maladieIds = casByMaladieRaw.map(r => r.maladieId).filter(Boolean) as string[]
    const maladies = await prisma.maladie.findMany({
      where: { id: { in: maladieIds } },
      select: { id: true, nom: true, groupeEpidemiologique: true },
    })
    const maladieMap = Object.fromEntries(maladies.map(m => [m.id, m.nom]))
    const maladieGroupMap = Object.fromEntries(maladies.map(m => [m.id, m.groupeEpidemiologique ?? "autre"]))

    // Resolve commune names + wilaya rollup
    const communeIds = casByCommuneRaw.map(r => r.communeId).filter(Boolean) as string[]
    const communes = await prisma.commune.findMany({
      where: { id: { in: communeIds } },
      select: { id: true, nom: true, wilayadId: true },
    })
    const communeMap = Object.fromEntries(communes.map(c => [c.id, c.nom]))

    // Wilaya distribution
    const communeCountMap = Object.fromEntries(casByCommuneRaw.map(r => [r.communeId!, r._count._all]))
    const wilayadCountMap: Record<string, number> = {}
    for (const c of communes) {
      if (c.wilayadId) {
        wilayadCountMap[c.wilayadId] = (wilayadCountMap[c.wilayadId] ?? 0) + (communeCountMap[c.id] ?? 0)
      }
    }
    const wilayadIds = Object.keys(wilayadCountMap)
    const wilayasRef = await prisma.wilaya.findMany({
      where: { id: { in: wilayadIds } },
      select: { id: true, nom: true },
    })
    const wilayaNameMap = Object.fromEntries(wilayasRef.map(w => [w.id, w.nom]))
    const wilayadDistribution = Object.entries(wilayadCountMap)
      .map(([id, count]) => ({ name: wilayaNameMap[id] ?? "Inconnu", count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Category distribution
    const CAT_ORDER = ["pev", "mth", "zoonose", "ist", "vectorielle", "nosocomiale", "autre"]
    const CAT_LABELS: Record<string, string> = { pev: "PEV", mth: "MTH", zoonose: "Zoonose", ist: "IST", vectorielle: "Vectorielle", nosocomiale: "Nosocomiale", autre: "Autre" }
    const catCountMap: Record<string, number> = {}
    for (const r of casByMaladieRaw) {
      if (!r.maladieId) continue
      const cat = maladieGroupMap[r.maladieId] ?? "autre"
      catCountMap[cat] = (catCountMap[cat] ?? 0) + r._count._all
    }
    const categorieDistribution = CAT_ORDER
      .filter(g => (catCountMap[g] ?? 0) > 0)
      .map(g => ({ name: CAT_LABELS[g] ?? g, key: g, count: catCountMap[g] ?? 0 }))
      .sort((a, b) => b.count - a.count)

    // Evolution distribution labels
    const EVOLUTION_LABELS: Record<string, string> = {
      guerison: "Guérison", en_cours_guerison: "En cours", sortant: "Sortant",
      toujours_malade: "Toujours malade", autre: "Autre", deces: "Décès",
    }
    const evolutionDistribution = byEvolutionRaw
      .map(r => ({ name: EVOLUTION_LABELS[r.evolution!] ?? r.evolution!, count: r._count._all }))
      .sort((a, b) => b.count - a.count)

    // Sex distribution
    const sexDistribution = bySexRaw.map(r => ({
      name: r.sex === "homme" ? "Homme" : r.sex === "femme" ? "Femme" : r.sex,
      count: Number(r.count),
    }))

    const confirmes = statutRaw.find(s => s.statut === "confirme")?._count._all ?? 0

    const donnees = {
      summary: {
        total: totalCas,
        confirmes,
        tauxConfirmation: totalCas > 0 ? Math.round((confirmes / totalCas) * 100) : 0,
        alertes: totalAlertes,
        investigations: totalInvestigations,
        hospitalisations: totalHospitalises,
        tauxHospitalisation: totalCas > 0 ? Math.round((totalHospitalises / totalCas) * 100) : 0,
        evacuations: totalEvacues,
        tauxEvacuation: totalCas > 0 ? Math.round((totalEvacues / totalCas) * 100) : 0,
        servicesFiltre: servicesFilter.length ? servicesFilter : null,
        maladieFiltre: maladieIdFilter,
        categorieFiltre: categorieGroupeFilter,
        modeleId,
      },
      visualisations: templateVisualisations,
      casByMaladie: casByMaladieRaw.map(r => ({ maladie: maladieMap[r.maladieId ?? ""] ?? "—", count: r._count._all })),
      casByCommune: casByCommuneRaw.map(r => ({ commune: communeMap[r.communeId ?? ""] ?? "—", count: r._count._all })),
      casByService: casByServiceRaw
        .filter(r => r.serviceDeclarant !== null)
        .slice(0, 7)
        .map(r => ({ service: r.serviceDeclarant!, count: r._count._all })),
      weeklyTrend: weeklyRaw.map(r => ({ date: r.week, count: Number(r.count) })),
      ageDistribution: ageRaw.map(r => ({ name: r.tranche, count: Number(r.count) })),
      statutDistribution: statutRaw.map(r => ({ name: r.statut, count: r._count._all })),
      categorieDistribution,
      evolutionDistribution,
      sexDistribution,
      communeDistribution: casByCommuneRaw.slice(0, 10).map(r => ({ name: communeMap[r.communeId ?? ""] ?? "Inconnu", count: r._count._all })),
      wilayadDistribution,
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
      : `Rapport Personnalisé — ${formatDate(dateDebut)} au ${formatDate(dateFin)}`

    const titreAvecService = servicesFilter.length
      ? `${titre} · ${servicesFilter.join(", ")}`
      : titre

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

    await writeAudit({
      userId: session.user.id,
      action: "CREATE",
      entity: "Rapport",
      entityId: rapport.id,
      details: { type: body.type, titre: titreAvecService, modeleId },
      ip: getIp(req),
    })

    return NextResponse.json(rapport, { status: 201 })
  } catch (err) {
    console.error("[POST /api/rapports]", err)
    const message = err instanceof Error ? err.message : "Erreur interne"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

