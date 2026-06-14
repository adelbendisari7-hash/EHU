import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { formatDate } from "@/utils/format-date"
import * as XLSX from "xlsx"

function yesNo(v: boolean | null | undefined) {
  if (v === true) return "Oui"
  if (v === false) return "Non"
  return ""
}

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  if (!["epidemiologiste", "admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const format = searchParams.get("format") ?? "excel"
  const type = searchParams.get("type") ?? "cas"

  if (type !== "cas") {
    return NextResponse.json({ error: "Type non supporté" }, { status: 400 })
  }

  // ── Filters ───────────────────────────────────────────────────────────────
  const casIdsParam = searchParams.get("casIds")
  const casIds = casIdsParam ? casIdsParam.split(",").filter(Boolean) : null

  const statut = searchParams.get("statut") || null
  const search = searchParams.get("search") || null
  const service = searchParams.get("service") || null
  const maladieId = searchParams.get("maladieId") || null

  const where = casIds && casIds.length > 0
    ? { id: { in: casIds } }
    : {
        statut: statut ? ({ equals: statut } as { equals: "brouillon" | "suspect" | "confirme" }) : { not: "brouillon" as const },
        ...(search ? {
          OR: [
            { codeCas: { contains: search, mode: "insensitive" as const } },
            { patient: { firstName: { contains: search, mode: "insensitive" as const } } },
            { patient: { lastName: { contains: search, mode: "insensitive" as const } } },
          ],
        } : {}),
        ...(service ? {
          OR: [
            { serviceDeclarant: { equals: service } },
            { service: { equals: service } },
          ],
        } : {}),
        ...(maladieId ? { maladieId } : {}),
      }

  const cas = await prisma.casDeclare.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      patient: {
        include: { commune: { include: { wilaya: true } } },
      },
      maladie: { select: { nom: true, codeCim10: true } },
      commune: { include: { wilaya: true } },
      etablissement: { select: { nom: true } },
      medecinDeclarant: { select: { nom: true, prenom: true, service: true } },
      typeBmr: { select: { nom: true, codeCim10: true } },
      structureHospitalisation: { select: { nom: true } },
      symptomes: { include: { symptome: { select: { nom: true } } } },
    },
  })

  const rows = cas.map(c => ({
    // ── Identification
    "Code Cas": c.codeCas,
    "Statut": c.statut,

    // ── Patient
    "Nom": c.patient.lastName,
    "Prénom": c.patient.firstName,
    "NIN": c.nin ?? "",
    "Date de naissance": formatDate(c.patient.dateOfBirth),
    "Sexe": c.patient.sex === "homme" ? "Masculin" : c.patient.sex === "femme" ? "Féminin" : "",
    "Adresse": c.patient.address ?? "",
    "Commune (patient)": c.patient.commune?.nom ?? "",
    "Wilaya (patient)": c.patient.commune?.wilaya?.nom ?? "",
    "Téléphone": c.patient.phone ?? "",
    "Âge (ans)": c.ageAns ?? "",
    "Âge (mois)": c.ageMois ?? "",
    "Âge (jours)": c.ageJours ?? "",
    "Profession": c.profession ?? "",
    "Lieu de travail": c.lieuTravail ?? "",
    "Est étranger": yesNo(c.estEtranger),
    "Nationalité": c.nationalite ?? "",
    "Code nationalité": c.nationaliteCode ?? "",
    "Email patient": c.emailPatient ?? "",

    // ── Maladie & Diagnostic
    "Maladie": c.maladie?.nom ?? "",
    "Code CIM-10 maladie": c.maladie?.codeCim10 ?? "",
    "Date début symptômes": formatDate(c.dateDebutSymptomes),
    "Date diagnostic": formatDate(c.dateDiagnostic),
    "Mode confirmation": c.modeConfirmation ?? "",
    "Résultat labo": c.resultatLabo ?? "",
    "Type prélèvement": c.typePrelevement ?? "",
    "Date prélèvement": formatDate(c.datePrelevement),
    "Destinataire prélèvements": c.destinatairePrelevements ?? "",
    "Symptômes": c.symptomes.map(s => s.symptome.nom).join(", "),
    "Symptômes (texte libre)": c.symptomesTexte ?? "",
    "Fiche spécifique": c.ficheSpecifiqueType ?? "",
    "Type BMR": c.typeBmr ? (c.typeBmr.codeCim10 ? `${c.typeBmr.nom} (${c.typeBmr.codeCim10})` : c.typeBmr.nom) : "",
    "Cas similaire": yesNo(c.casSimilaire),
    "Lieux fréquentés": c.lieuxFrequentes ?? "",
    "ATCD": c.atcd ?? "",
    "Observation": c.observation ?? "",
    "Notes cliniques": c.notesCliniques ?? "",

    // ── Établissement & Service
    "Établissement": c.etablissement?.nom ?? "",
    "Service déclarant": c.serviceDeclarant ?? c.service ?? "",
    "Service hospitalisation": c.serviceHospitalisation ?? "",

    // ── Hospitalisation
    "Est hospitalisé": yesNo(c.estHospitalise),
    "Date hospitalisation": formatDate(c.dateHospitalisation),
    "Structure hospitalisation": c.structureHospitalisation?.nom ?? "",

    // ── Évacuation
    "Est évacué": yesNo(c.estEvacue),
    "Date évacuation": formatDate(c.dateEvacuation),
    "Structure évacuation": c.structureEvacuation ?? "",

    // ── Évolution
    "Évolution": c.evolution ?? "",
    "Date sortie": formatDate(c.dateSortie),
    "Date décès": formatDate(c.dateDeces),

    // ── Médecin déclarant
    "Médecin (nom)": c.medecinDeclarant?.nom ?? "",
    "Médecin (prénom)": c.medecinDeclarant?.prenom ?? "",
    "Médecin (service)": c.medecinDeclarant?.service ?? "",

    // ── Géographie
    "Commune (cas)": c.commune?.nom ?? "",
    "Wilaya (cas)": c.commune?.wilaya?.nom ?? "",
    "Latitude": c.latitude ? Number(c.latitude) : "",
    "Longitude": c.longitude ? Number(c.longitude) : "",

    // ── Dates administratives
    "Date déclaration": formatDate(c.createdAt),
    "Mois déclaration": c.moisDeclaration ?? "",
    "Année déclaration": c.anneeDeclaration ?? "",
    "Source UISTI": yesNo(c.sourceUisti),
  }))

  if (format === "excel") {
    const ws = XLSX.utils.json_to_sheet(rows)

    // Auto column widths (cap at 40)
    const headers = Object.keys(rows[0] ?? {})
    ws["!cols"] = headers.map(h => ({
      wch: Math.min(40, Math.max(h.length + 2, 12)),
    }))

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Cas déclarés")

    // Summary sheet
    const summaryRows = [
      { "Indicateur": "Total cas exportés", "Valeur": rows.length },
      { "Indicateur": "Date d'export", "Valeur": new Date().toLocaleDateString("fr-DZ") },
      { "Indicateur": "Exporté par", "Valeur": `${session.user.name ?? session.user.email}` },
    ]
    const wsSummary = XLSX.utils.json_to_sheet(summaryRows)
    wsSummary["!cols"] = [{ wch: 25 }, { wch: 30 }]
    XLSX.utils.book_append_sheet(wb, wsSummary, "Résumé")

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })

    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="cas-ehu-${new Date().toISOString().slice(0, 10)}.xlsx"`,
      },
    })
  }

  if (format === "csv") {
    const headers = Object.keys(rows[0] ?? {}).join(",")
    const lines = rows.map(r =>
      Object.values(r).map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")
    )
    const csv = [headers, ...lines].join("\n")
    return new NextResponse("﻿" + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="cas-ehu-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  }

  return NextResponse.json(rows)
}
