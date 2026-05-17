import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { writeAudit, getIp } from "@/lib/audit"

// GET /api/uisti/mortalite
// Section 2 — Croisement MDO → Mortalité hospitalière
// Retourne :
//   - cas1 : patients MDO décédés durant l'hospitalisation
//   - cas3 : taux de létalité par pathologie (MDO confirmée avec issue fatale)
export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  if (!["uisti", "admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Accès réservé à l'unité UISTI" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const dateDebut = searchParams.get("dateDebut") ?? ""
  const dateFin = searchParams.get("dateFin") ?? ""

  const dateFilter: Record<string, unknown> = {}
  if (dateDebut) dateFilter.gte = new Date(dateDebut)
  if (dateFin) dateFilter.lte = new Date(dateFin + "T23:59:59.999Z")

  const baseWhere: Record<string, unknown> = {
    statut: { not: "brouillon" },
    ...(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {}),
  }

  // ── Cas 1 : patients MDO décédés durant l'hospitalisation ─────────────────
  const decedes = await prisma.casDeclare.findMany({
    where: {
      ...baseWhere,
      OR: [
        { evolution: "deces" },
        { dateDeces: { not: null } },
      ],
    },
    orderBy: { dateDeces: "desc" },
    select: {
      id: true,
      codeCas: true,
      statut: true,
      evolution: true,
      dateDeces: true,
      dateHospitalisation: true,
      serviceDeclarant: true,
      service: true,
      createdAt: true,
      patient: {
        select: {
          identifiant: true,
          firstName: true,
          lastName: true,
          dateOfBirth: true,
          sex: true,
        },
      },
      maladie: { select: { nom: true, codeCim10: true } },
      commune: { select: { nom: true } },
    },
  })

  const today = new Date()
  const cas1 = decedes.map(c => ({
    codeCas: c.codeCas,
    patient: {
      identifiant: c.patient.identifiant,
      nom: c.patient.lastName,
      prenom: c.patient.firstName,
      age: today.getFullYear() - new Date(c.patient.dateOfBirth).getFullYear(),
      sexe: c.patient.sex,
    },
    mdo: {
      maladie: c.maladie?.nom ?? "—",
      codeCim10: c.maladie?.codeCim10 ?? "—",
      statut: c.statut,
    },
    hospitalisation: {
      dateAdmission: c.dateHospitalisation ? new Date(c.dateHospitalisation).toLocaleDateString("fr-FR") : null,
      service: c.serviceDeclarant ?? c.service ?? "—",
    },
    dateDeces: c.dateDeces ? new Date(c.dateDeces).toLocaleDateString("fr-FR") : null,
    commune: c.commune?.nom ?? "—",
  }))

  // ── Cas 3 : taux de létalité par pathologie ───────────────────────────────
  const [confirmes, decesConfirmes] = await Promise.all([
    prisma.casDeclare.groupBy({
      by: ["maladieId"],
      where: { ...baseWhere, statut: "confirme" },
      _count: { id: true },
    }),
    prisma.casDeclare.groupBy({
      by: ["maladieId"],
      where: {
        ...baseWhere,
        statut: "confirme",
        OR: [{ evolution: "deces" }, { dateDeces: { not: null } }],
      },
      _count: { id: true },
    }),
  ])

  const maladieIds = [...new Set([
    ...confirmes.map(r => r.maladieId),
    ...decesConfirmes.map(r => r.maladieId),
  ])].filter(Boolean) as string[]

  const maladies = await prisma.maladie.findMany({
    where: { id: { in: maladieIds } },
    select: { id: true, nom: true, codeCim10: true },
  })
  const maladieMap = Object.fromEntries(maladies.map(m => [m.id, m]))

  const decesMap: Record<string, number> = {}
  for (const r of decesConfirmes) {
    if (r.maladieId) decesMap[r.maladieId] = r._count.id
  }

  const letalite = confirmes
    .filter(r => r.maladieId)
    .map(r => {
      const totalConfirmes = r._count.id
      const totalDeces = decesMap[r.maladieId!] ?? 0
      const taux = totalConfirmes > 0 ? Math.round((totalDeces / totalConfirmes) * 1000) / 10 : 0
      const m = maladieMap[r.maladieId!]
      return {
        maladieId: r.maladieId,
        maladie: m?.nom ?? "—",
        codeCim10: m?.codeCim10 ?? "—",
        casConfirmes: totalConfirmes,
        casDeces: totalDeces,
        tauxLetalite: taux,
      }
    })
    .sort((a, b) => b.tauxLetalite - a.tauxLetalite)

  return NextResponse.json({
    cas1_decesDurantHospitalisation: cas1,
    cas3_tauxLetaliteParPathologie: letalite,
    meta: {
      totalDeces: cas1.length,
      periode: { dateDebut: dateDebut || null, dateFin: dateFin || null },
      genereLe: new Date().toISOString(),
    },
  })
}

// POST /api/uisti/mortalite
// Cas 2 — UISTI signale un décès lié à une MDO non encore déclarée
// → Crée une alerte vers l'unité de surveillance épidémiologique
export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  if (!["uisti", "admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Accès réservé à l'unité UISTI" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { nomPatient, prenomPatient, dateDeces, maladieSuspectee, maladieId, communeId, details } = body

    if (!nomPatient || !dateDeces || !maladieSuspectee) {
      return NextResponse.json({
        error: "Les champs nomPatient, dateDeces et maladieSuspectee sont obligatoires",
      }, { status: 400 })
    }

    const alerte = await prisma.alerte.create({
      data: {
        type: "epidemique",
        titre: `[UISTI] Décès lié à MDO non déclarée — ${maladieSuspectee}`,
        description: [
          `Décès signalé par l'unité UISTI nécessitant une déclaration MDO rétrospective.`,
          `Patient : ${prenomPatient ?? ""} ${nomPatient}`,
          `Date du décès : ${new Date(dateDeces).toLocaleDateString("fr-FR")}`,
          `Pathologie suspectée : ${maladieSuspectee}`,
          details ? `Détails : ${details}` : "",
        ].filter(Boolean).join("\n"),
        maladieId: maladieId ?? null,
        communeId: communeId ?? null,
        nombreCas: 1,
        statut: "active",
        createdBy: session.user.id,
        recommandations: {
          action: "Déclaration MDO rétrospective requise",
          urgence: "haute",
          signalePar: "Unité UISTI",
        },
      },
    })

    await writeAudit({
      userId: session.user.id,
      action: "CREATE",
      entity: "Alerte",
      entityId: alerte.id,
      details: { source: "UISTI", type: "deces_mdo_non_declare", maladieSuspectee },
      ip: getIp(req),
    })

    return NextResponse.json({
      message: "Alerte créée. L'unité de surveillance épidémiologique a été notifiée.",
      alerteId: alerte.id,
    }, { status: 201 })
  } catch (err) {
    console.error("[POST /api/uisti/mortalite]", err)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
