import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { writeAudit, getIp } from "@/lib/audit"
import { formatDate } from "@/utils/format-date"
import { generatePatientId, generateCodeCas } from "@/utils/generate-id"

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
      dateAdmission: formatDate(c.dateHospitalisation),
      service: c.serviceDeclarant ?? c.service ?? "—",
    },
    dateDeces: formatDate(c.dateDeces),
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

// Map service name → numeric code for generateCodeCas
const SERVICES_EHU_CODES: Record<string, number> = {
  "MPR": 1, "Cardiologie": 2, "Médecine interne": 3, "Hépato-gastro-entérologie": 4,
  "Nephrologie-hémodialyse": 5, "Dermatologie": 6, "Pneumologie": 7, "Hématologie": 8,
  "Oncologie": 9, "Endocrinologie": 10, "Neurologie médicale": 11, "Médecine de travail": 12,
  "Médecine légale": 13, "Chirurgie Hépato-biliaire": 14, "Neurochirurgie": 15,
  "Chirurgie générale": 16, "Chirurgie urologique": 17, "Chirurgie traumatologique et orthopédique": 18,
  "Chirurgie thoracique": 19, "Chirurgie vasculaire": 20, "Chirurgie cardiaque": 21,
  "Chirurgie maxillo-faciale": 22, "ORL": 23, "Gynécologie obstétrique": 24,
  "Réanimation médicale": 25, "Réanimation chirurgicale": 26, "Réanimation pédiatrique": 27,
  "UMC": 28, "USIC": 29, "Réa-UMC": 30,
  "Bactériologie": 31, "Biochimie": 32, "Immunologie": 33, "Médecine nucléaire": 34,
  "Cytogénétique": 35, "Hémobiologie": 36, "Pharmacologie": 37, "Anapath": 38,
  "Toxicologie": 39, "Neurophysiologie": 40, "CTS": 41, "Imagerie": 42,
}

// POST /api/uisti/mortalite
// Cas 2 — UISTI signale un décès lié à une MDO non encore déclarée
// → Crée une déclaration pré-remplie (brouillon) + une alerte épidémiologique
export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  if (!["uisti", "admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Accès réservé à l'unité UISTI" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const {
      nomPatient, prenomPatient, dateDeces, maladieSuspectee,
      maladieId, service, wilaya, dateAdmission, details,
    } = body

    if (!nomPatient || !dateDeces || (!maladieId && !maladieSuspectee)) {
      return NextResponse.json({
        error: "Les champs nomPatient, dateDeces et la pathologie MDO sont obligatoires",
      }, { status: 400 })
    }

    // Resolve maladie: prefer explicit maladieId, fallback to name search
    const maladieFound = maladieId
      ? await prisma.maladie.findUnique({ where: { id: maladieId }, select: { id: true, nom: true, codeCim10: true } })
      : maladieSuspectee
        ? await prisma.maladie.findFirst({ where: { nom: { contains: maladieSuspectee.trim(), mode: "insensitive" } }, select: { id: true, nom: true, codeCim10: true } })
        : null
    const nomMaladie = maladieFound?.nom ?? maladieSuspectee ?? "—"

    // Create a minimal Patient record (epid agent will complete it later)
    const patient = await prisma.patient.create({
      data: {
        identifiant:  generatePatientId(),
        firstName:    prenomPatient?.trim() || "—",
        lastName:     nomPatient.trim(),
        dateOfBirth:  new Date("1900-01-01"), // placeholder — à compléter par l'agent
        sex:          "homme",                 // placeholder — à compléter
        address:      wilaya ? `Wilaya : ${wilaya}` : "—",
      },
    })

    const now = new Date()
    const svcCode = service ? String(SERVICES_EHU_CODES[service] ?? "00") : "00"
    const codeCas = await generateCodeCas(now.getFullYear(), svcCode, maladieFound?.codeCim10, prisma)

    // Create the pre-filled CasDeclare (brouillon) for the epid service to complete
    const cas = await prisma.casDeclare.create({
      data: {
        codeCas,
        patientId:           patient.id,
        maladieId:           maladieFound?.id ?? null,
        statut:              "brouillon",
        evolution:           "deces",
        dateDeces:           new Date(dateDeces),
        serviceDeclarant:    service || null,
        dateHospitalisation: dateAdmission ? new Date(dateAdmission) : null,
        sourceUisti:         true,
        moisDeclaration:     now.getMonth() + 1,
        anneeDeclaration:    now.getFullYear(),
        donneesSpecifiques: {
          sourceUisti:      true,
          maladieSuspectee: nomMaladie,
          wilaya:           wilaya || null,
          signalePar:       "Unité UISTI",
          details:          details || null,
        },
      },
    })

    // Also create the alert for the epid service
    const alerte = await prisma.alerte.create({
      data: {
        type:      "epidemique",
        titre:     `[UISTI] Décès lié à MDO non déclarée — ${nomMaladie}`,
        description: [
          `Décès signalé par l'unité UISTI. Déclaration pré-remplie créée : ${codeCas}.`,
          `Patient : ${prenomPatient ?? ""} ${nomPatient}`,
          `Date du décès : ${formatDate(dateDeces)}`,
          `Pathologie : ${nomMaladie}`,
          service       ? `Service : ${service}`                    : "",
          wilaya        ? `Wilaya de résidence : ${wilaya}`          : "",
          dateAdmission ? `Date d'admission : ${formatDate(dateAdmission)}` : "",
          details       ? `Détails : ${details}`                    : "",
        ].filter(Boolean).join("\n"),
        maladieId:  maladieFound?.id ?? null,
        nombreCas:  1,
        statut:     "active",
        createdBy:  session.user.id,
        recommandations: {
          action:     "Compléter la déclaration MDO rétrospective",
          urgence:    "haute",
          signalePar: "Unité UISTI",
          casId:      cas.id,
          codeCas,
        },
      },
    })

    await writeAudit({
      userId:   session.user.id,
      action:   "CREATE",
      entity:   "CasDeclare",
      entityId: cas.id,
      details:  { source: "UISTI", type: "deces_mdo_non_declare", maladie: nomMaladie, alerteId: alerte.id },
      ip:       getIp(req),
    })

    return NextResponse.json({
      message:  "Déclaration pré-remplie créée et alerte envoyée au service épidémiologique.",
      casId:    cas.id,
      codeCas,
      alerteId: alerte.id,
    }, { status: 201 })
  } catch (err) {
    console.error("[POST /api/uisti/mortalite]", err)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
