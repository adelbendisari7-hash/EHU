import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(_req: Request, { params }: { params: Promise<{ casId: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { casId } = await params

  const cas = await prisma.casDeclare.findUnique({
    where: { id: casId },
    include: {
      patient: { include: { commune: { include: { wilaya: true } } } },
      maladie: true,
      commune: true,
      etablissement: true,
      medecinDeclarant: true,
      medecin: { select: { id: true, firstName: true, lastName: true, email: true } },
      fichiers: true,
      symptomes: { include: { symptome: true } },
      lieux: { orderBy: { ordre: "asc" } },
      resultatsLabo: { orderBy: { createdAt: "desc" } },
      casSimilaireRef: {
        select: {
          id: true,
          codeCas: true,
          patient: { select: { firstName: true, lastName: true } },
          maladie: { select: { nom: true, codeCim10: true } },
        },
      },
      investigation: {
        include: { contacts: true, epidemiologiste: { select: { firstName: true, lastName: true } } },
      },
    },
  })

  if (!cas) return NextResponse.json({ error: "Cas non trouvé" }, { status: 404 })

  return NextResponse.json(cas)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ casId: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { casId } = await params
  const body = await req.json()

  try {
    // Resolve/create MedecinDeclarant if provided
    let medecinDeclarantId: string | null = body.medecinDeclarantId || null
    if (!medecinDeclarantId && body.nomMedecinDeclarant && body.prenomMedecinDeclarant && body.serviceDeclarant) {
      const med = await prisma.medecinDeclarant.upsert({
        where: {
          nom_prenom_service: {
            nom: body.nomMedecinDeclarant,
            prenom: body.prenomMedecinDeclarant,
            service: body.serviceDeclarant,
          },
        },
        update: {},
        create: {
          nom: body.nomMedecinDeclarant,
          prenom: body.prenomMedecinDeclarant,
          service: body.serviceDeclarant,
        },
      })
      medecinDeclarantId = med.id
    }

    // Derive statut from observation if not brouillon
    let statut = body.statut
    if (statut && statut !== "brouillon") {
      if (body.observation === "cas_confirme") statut = "confirme"
      else if (body.observation === "cas_suspect") statut = "suspect"
    }

    // Update patient if data provided
    const existingCas = await prisma.casDeclare.findUnique({ where: { id: casId }, select: { patientId: true } })
    if (existingCas && body.patient) {
      await prisma.patient.update({
        where: { id: existingCas.patientId },
        data: {
          ...(body.patient.firstName && { firstName: body.patient.firstName }),
          ...(body.patient.lastName && { lastName: body.patient.lastName }),
          ...(body.patient.dateOfBirth && { dateOfBirth: new Date(body.patient.dateOfBirth) }),
          ...(body.patient.sex && { sex: body.patient.sex }),
          ...(body.patient.address && { address: body.patient.address }),
          ...(body.patient.communeId !== undefined && { communeId: body.patient.communeId || null }),
          ...(body.patient.phone !== undefined && { phone: body.patient.phone || null }),
        },
      })
    }

    const cas = await prisma.casDeclare.update({
      where: { id: casId },
      data: {
        ...(statut && { statut }),
        ...(body.maladieId && { maladieId: body.maladieId }),
        ...(body.dateDebutSymptomes !== undefined && { dateDebutSymptomes: body.dateDebutSymptomes ? new Date(body.dateDebutSymptomes) : null }),
        ...(body.dateDiagnostic !== undefined && { dateDiagnostic: body.dateDiagnostic ? new Date(body.dateDiagnostic) : null }),
        ...(body.notesCliniques !== undefined && { notesCliniques: body.notesCliniques }),
        ...(body.service !== undefined && { service: body.service }),
        ...(body.serviceDeclarant !== undefined && { serviceDeclarant: body.serviceDeclarant }),
        ...(body.resultatLabo !== undefined && { resultatLabo: body.resultatLabo }),
        ...(body.modeConfirmation !== undefined && { modeConfirmation: body.modeConfirmation || null }),
        ...(body.observation !== undefined && { observation: body.observation || null }),
        ...(body.symptomesTexte !== undefined && { symptomesTexte: body.symptomesTexte || null }),
        ...(body.atcd !== undefined && { atcd: body.atcd || null }),
        ...(body.casSimilaire !== undefined && { casSimilaire: body.casSimilaire }),
        ...(body.casSimilaireId !== undefined && { casSimilaireId: body.casSimilaireId || null }),
        ...(body.estHospitalise !== undefined && { estHospitalise: body.estHospitalise }),
        ...(body.dateHospitalisation !== undefined && { dateHospitalisation: body.dateHospitalisation ? new Date(body.dateHospitalisation) : null }),
        ...(body.structureHospitalisationId !== undefined && { structureHospitalisationId: body.structureHospitalisationId || null }),
        ...(body.serviceHospitalisation !== undefined && { serviceHospitalisation: body.serviceHospitalisation || null }),
        ...(body.estEvacue !== undefined && { estEvacue: body.estEvacue }),
        ...(body.dateEvacuation !== undefined && { dateEvacuation: body.dateEvacuation ? new Date(body.dateEvacuation) : null }),
        ...(body.structureEvacuation !== undefined && { structureEvacuation: body.structureEvacuation || null }),
        ...(body.evolution !== undefined && { evolution: body.evolution || null }),
        ...(body.dateSortie !== undefined && { dateSortie: body.dateSortie ? new Date(body.dateSortie) : null }),
        ...(body.dateDeces !== undefined && { dateDeces: body.dateDeces ? new Date(body.dateDeces) : null }),
        ...(body.nin !== undefined && { nin: body.nin || null }),
        ...(body.ageAns !== undefined && { ageAns: body.ageAns ?? null }),
        ...(body.ageMois !== undefined && { ageMois: body.ageMois ?? null }),
        ...(body.ageJours !== undefined && { ageJours: body.ageJours ?? null }),
        ...(body.profession !== undefined && { profession: body.profession || null }),
        ...(body.nationalite !== undefined && { nationalite: body.nationalite || null }),
        ...(body.nationaliteCode !== undefined && { nationaliteCode: body.nationaliteCode || null }),
        ...(body.estEtranger !== undefined && { estEtranger: body.estEtranger }),
        ...(body.lieuTravail !== undefined && { lieuTravail: body.lieuTravail || null }),
        ...(body.emailPatient !== undefined && { emailPatient: body.emailPatient || null }),
        ...(medecinDeclarantId !== null && { medecinDeclarantId }),
        ...(body.etablissementId !== undefined && { etablissementId: body.etablissementId || null }),
        ...(body.communeId !== undefined && { communeId: body.communeId || null }),
        ...(body.ficheSpecifiqueType !== undefined && { ficheSpecifiqueType: body.ficheSpecifiqueType || null }),
        ...(body.donneesSpecifiques !== undefined && { donneesSpecifiques: body.donneesSpecifiques ?? null }),
      },
      include: { patient: true, maladie: true },
    })

    // Update symptomes (delete + recreate)
    if (Array.isArray(body.symptomeIds)) {
      await prisma.casSymptome.deleteMany({ where: { casId } })
      if (body.symptomeIds.length > 0) {
        await prisma.casSymptome.createMany({
          data: (body.symptomeIds as string[]).map((symptomeId) => ({ casId, symptomeId })),
          skipDuplicates: true,
        })
      }
    }

    // Update lieux (delete + recreate)
    if (Array.isArray(body.lieux)) {
      await prisma.casLieu.deleteMany({ where: { casId } })
      const lieuxToCreate = (body.lieux as { nom: string; type?: string; adresse?: string; communeId?: string; dateDebut?: string; dateFin?: string }[]).filter(l => l.nom?.trim())
      if (lieuxToCreate.length > 0) {
        await prisma.casLieu.createMany({
          data: lieuxToCreate.slice(0, 4).map((l, idx) => ({
            casId,
            ordre: idx + 1,
            nom: l.nom,
            type: l.type || null,
            adresse: l.adresse || null,
            communeId: l.communeId || null,
            dateDebut: l.dateDebut ? new Date(l.dateDebut) : null,
            dateFin: l.dateFin ? new Date(l.dateFin) : null,
          })),
        })
      }
    }

    // Update resultatsLabo (delete + recreate)
    if (Array.isArray(body.resultatsLabo)) {
      await prisma.resultatLabo.deleteMany({ where: { casId } })
      const resultatsToCreate = (body.resultatsLabo as { typePrelevement: string; datePrelevement: string; germeId?: string; resultat?: string; antibiogramme?: string; laboratoire?: string; notes?: string }[]).filter(r => r.typePrelevement && r.datePrelevement)
      if (resultatsToCreate.length > 0) {
        await prisma.resultatLabo.createMany({
          data: resultatsToCreate.map(r => ({
            casId,
            typePrelevement: r.typePrelevement,
            datePrelevement: new Date(r.datePrelevement),
            germeId: r.germeId || null,
            resultat: r.resultat || null,
            antibiogramme: r.antibiogramme || null,
            laboratoire: r.laboratoire || null,
            notes: r.notes || null,
          })),
        })
      }
    }

    return NextResponse.json(cas)
  } catch (err) {
    console.error("PATCH /api/cas error:", err)
    return NextResponse.json({ error: "Erreur mise à jour" }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ casId: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  if (session.user.role !== "admin") return NextResponse.json({ error: "Admin requis" }, { status: 403 })

  const { casId } = await params

  await prisma.casDeclare.delete({ where: { id: casId } })
  return NextResponse.json({ success: true })
}
