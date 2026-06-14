import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET /api/uisti/patients
// Section 1 — Morbidité hospitalière : données MDO partagées avec l'unité UISTI
export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  if (!["uisti", "admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Accès réservé à l'unité UISTI" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const dateDebut = searchParams.get("dateDebut") ?? ""
  const dateFin = searchParams.get("dateFin") ?? ""
  const maladieId = searchParams.get("maladieId") ?? ""
  const statut = searchParams.get("statut") ?? ""
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50")))

  const where: Record<string, unknown> = {
    statut: { not: "brouillon" },
  }

  if (dateDebut || dateFin) {
    where.createdAt = {
      ...(dateDebut ? { gte: new Date(dateDebut) } : {}),
      ...(dateFin ? { lte: new Date(dateFin + "T23:59:59.999Z") } : {}),
    }
  }

  if (maladieId) where.maladieId = maladieId
  if (statut && statut !== "tous") where.statut = statut

  const [total, cas] = await Promise.all([
    prisma.casDeclare.count({ where }),
    prisma.casDeclare.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        codeCas: true,
        statut: true,
        dateDiagnostic: true,
        dateHospitalisation: true,
        serviceDeclarant: true,
        service: true,
        evolution: true,
        dateDeces: true,
        createdAt: true,
        patient: {
          select: {
            identifiant: true,
            firstName: true,
            lastName: true,
            dateOfBirth: true,
            sex: true,
            commune: { select: { nom: true, wilaya: { select: { nom: true } } } },
          },
        },
        maladie: {
          select: { nom: true, codeCim10: true, categorie: true },
        },
        commune: { select: { nom: true } },
      },
    }),
  ])

  const today = new Date()
  const rows = cas.map(c => {
    const dob = new Date(c.patient.dateOfBirth)
    const ageAns = today.getFullYear() - dob.getFullYear()
    const service = c.serviceDeclarant ?? c.service ?? "—"
    return {
      codeCas: c.codeCas,
      patient: {
        identifiant: c.patient.identifiant,
        nom: c.patient.lastName,
        prenom: c.patient.firstName,
        dateNaissance: dob.toLocaleDateString("fr-FR"),
        age: ageAns,
        sexe: c.patient.sex,
        communeResidence: c.patient.commune?.nom ?? c.commune?.nom ?? "—",
        wilayaResidence: c.patient.commune?.wilaya?.nom ?? "—",
      },
      mdo: {
        maladie: c.maladie?.nom ?? "—",
        codeCim10: c.maladie?.codeCim10 ?? "—",
        categorie: c.maladie?.categorie ?? "—",
        dateDiagnostic: c.dateDiagnostic ? new Date(c.dateDiagnostic).toLocaleDateString("fr-FR") : null,
        statut: c.statut,
      },
      hospitalisation: {
        dateAdmission: c.dateHospitalisation ? new Date(c.dateHospitalisation).toLocaleDateString("fr-FR") : null,
        service,
      },
      evolution: c.evolution ?? null,
      dateDeces: c.dateDeces ? new Date(c.dateDeces).toLocaleDateString("fr-FR") : null,
      dateDeclaration: new Date(c.createdAt).toLocaleDateString("fr-FR"),
    }
  })

  return NextResponse.json({ total, page, limit, pages: Math.ceil(total / limit), patients: rows })
}
