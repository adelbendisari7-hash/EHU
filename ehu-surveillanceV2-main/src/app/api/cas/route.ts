import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { generateCaseCode, generatePatientId } from "@/utils/generate-id"

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get("page") ?? "1")
  const limit = parseInt(searchParams.get("limit") ?? "10")
  const statut = searchParams.get("statut") ?? ""
  const maladieId = searchParams.get("maladieId") ?? ""
  const search = searchParams.get("search") ?? ""
  const service = searchParams.get("service") ?? ""

  const where: Record<string, unknown> = {}
  if (statut) where.statut = statut
  if (maladieId) where.maladieId = maladieId
  if (service) where.service = { contains: service }
  if (search) {
    where.OR = [
      { patient: { firstName: { contains: search, mode: "insensitive" } } },
      { patient: { lastName: { contains: search, mode: "insensitive" } } },
      { codeCas: { contains: search, mode: "insensitive" } },
    ]
  }
  // Médecin can only see their own cases
  if (session.user.role === "medecin") {
    where.medecinId = session.user.id
  }

  const [cas, total] = await Promise.all([
    prisma.casDeclare.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        patient: true,
        maladie: true,
        commune: true,
        medecin: { select: { firstName: true, lastName: true } },
        etablissement: { select: { nom: true } },
        symptomes: { include: { symptome: true } },
        lieux: { orderBy: { ordre: "asc" } },
        resultatsLabo: { include: { germe: true }, orderBy: { createdAt: "desc" } },
        casSimilaireRef: { select: { id: true, codeCas: true, patient: { select: { firstName: true, lastName: true } }, maladie: { select: { nom: true } } } },
        structureHospitalisation: { select: { id: true, nom: true } },
      },
    }),
    prisma.casDeclare.count({ where }),
  ])

  return NextResponse.json({ cas, total, page, totalPages: Math.ceil(total / limit) })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  // Check permissions — first from JWT, then fallback to DB lookup
  let perms: string[] = session.user.permissions ?? []
  if (!perms.includes("cas.create")) {
    // JWT might be stale — check DB directly
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        userRoles: {
          include: { role: { include: { rolePermissions: { include: { permission: true } } } } },
        },
      },
    })
    if (dbUser) {
      perms = dbUser.userRoles.flatMap(ur => ur.role.rolePermissions.map(rp => rp.permission.slug))
    }
    if (!perms.includes("cas.create")) {
      return NextResponse.json({ error: "Permission refusée — veuillez vous déconnecter et vous reconnecter" }, { status: 403 })
    }
  }

  try {
    const body = await req.json()

    // Auto-create patient
    const patient = await prisma.patient.create({
      data: {
        identifiant: generatePatientId(),
        firstName: body.patient.firstName || "—",
        lastName: body.patient.lastName || "—",
        dateOfBirth: body.patient.dateOfBirth ? new Date(body.patient.dateOfBirth) : new Date("2000-01-01"),
        sex: body.patient.sex || "homme",
        address: body.patient.address || "—",
        communeId: body.patient.communeId || null,
        phone: body.patient.phone || null,
      },
    })

    // Resolve or create MedecinDeclarant
    let medecinDeclarantId = body.medecinDeclarantId || null
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

    // Derive statut from observation or use provided statut
    let statut: string = body.statut || "nouveau"
    if (statut !== "brouillon") {
      if (body.observation === "cas_confirme") statut = "confirme"
      else if (body.observation === "cas_suspect") statut = "suspect"
    }

    // Create case
    const data = body
    const cas = await prisma.casDeclare.create({
      data: {
        codeCas: generateCaseCode(),
        patientId: patient.id,
        maladieId: body.maladieId || null,
        dateDebutSymptomes: data.dateDebutSymptomes ? new Date(data.dateDebutSymptomes) : null,
        dateDiagnostic: data.dateDiagnostic ? new Date(data.dateDiagnostic) : null,
        modeConfirmation: body.modeConfirmation || null,
        resultatLabo: body.resultatLabo || null,
        statut: statut as import("@prisma/client").CasStatut,
        medecinDeclarantId,
        etablissementId: body.etablissementId || session.user.etablissementId || null,
        service: body.service,
        medecinId: session.user.id,
        notesCliniques: body.notesCliniques || null,
        communeId: body.patient.communeId || null,
        // Phase C — MDO Form exact fields
        nin: data.nin || null,
        ageAns: data.ageAns || null,
        ageMois: data.ageMois || null,
        ageJours: data.ageJours || null,
        profession: data.profession || null,
        emailPatient: data.emailPatient || null,
        lieuTravail: data.lieuTravail || null,
        estEtranger: data.estEtranger ?? null,
        nationalite: data.nationalite || null,
        symptomesTexte: data.symptomesTexte || null,
        observation: data.observation || null,
        atcd: data.atcd || null,
        lieuxFrequentes: data.lieuxFrequentes || null,
        casSimilaire: data.casSimilaire ?? null,
        estHospitalise: data.estHospitalise ?? null,
        dateHospitalisation: data.dateHospitalisation ? new Date(data.dateHospitalisation) : null,
        estEvacue: data.estEvacue ?? null,
        dateEvacuation: data.dateEvacuation ? new Date(data.dateEvacuation) : null,
        structureEvacuation: data.structureEvacuation || null,
        typePrelevement: data.typePrelevement || null,
        datePrelevement: data.datePrelevement ? new Date(data.datePrelevement) : null,
        destinatairePrelevements: data.destinatairePrelevements || null,
        evolution: data.evolution || null,
        dateSortie: data.dateSortie ? new Date(data.dateSortie) : null,
        dateDeces: data.dateDeces ? new Date(data.dateDeces) : null,
        serviceDeclarant: data.serviceDeclarant || null,
        moisDeclaration: data.moisDeclaration || null,
        anneeDeclaration: data.anneeDeclaration || null,
        ficheSpecifiqueType: data.ficheSpecifiqueType || null,
        donneesSpecifiques: data.donneesSpecifiques ?? null,
        // Phase E — Enhanced features
        nationaliteCode: data.nationaliteCode || null,
        casSimilaireId: data.casSimilaireId || null,
        evaluationClinique: data.evaluationClinique ?? null,
        structureHospitalisationId: data.structureHospitalisationId || null,
        serviceHospitalisation: data.serviceHospitalisation || null,
      },
      include: {
        patient: true,
        maladie: true,
      },
    })

    // Create symptome links
    if (Array.isArray(data.symptomeIds) && data.symptomeIds.length > 0) {
      await prisma.casSymptome.createMany({
        data: data.symptomeIds.map((symptomeId: string) => ({
          casId: cas.id,
          symptomeId,
        })),
        skipDuplicates: true,
      })
    }

    // Create lieux (up to 4)
    if (Array.isArray(data.lieux) && data.lieux.length > 0) {
      await prisma.casLieu.createMany({
        data: data.lieux.slice(0, 4).map((lieu: { nom: string; type?: string; adresse?: string; communeId?: string; dateDebut?: string; dateFin?: string }, idx: number) => ({
          casId: cas.id,
          ordre: idx + 1,
          nom: lieu.nom,
          type: lieu.type || null,
          adresse: lieu.adresse || null,
          communeId: lieu.communeId || null,
          dateDebut: lieu.dateDebut ? new Date(lieu.dateDebut) : null,
          dateFin: lieu.dateFin ? new Date(lieu.dateFin) : null,
        })),
      })
    }

    // Create lab results
    if (Array.isArray(data.resultatsLabo) && data.resultatsLabo.length > 0) {
      await prisma.resultatLabo.createMany({
        data: data.resultatsLabo.map((r: { typePrelevement: string; datePrelevement: string; germeId?: string; resultat?: string; antibiogramme?: string; laboratoire?: string; notes?: string }) => ({
          casId: cas.id,
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

    // Skip alert checking for brouillon
    if (statut === "brouillon") {
      return NextResponse.json({ ...cas, declenchement: null }, { status: 201 })
    }

    // Check seuils configurés and trigger protocole if threshold exceeded
    let declenchement = null
    const seuils = await prisma.seuilAlerte.findMany({
      where: { maladieId: body.maladieId, isActive: true },
      include: { maladie: true },
    })

    for (const seuil of seuils) {
      const since = new Date()
      since.setDate(since.getDate() - seuil.periodejours)

      const whereCount: Record<string, unknown> = {
        maladieId: body.maladieId,
        createdAt: { gte: since },
        statut: { not: "infirme" },
      }
      if (seuil.perimetre === "commune" && seuil.communeId) {
        whereCount.communeId = seuil.communeId
      } else if (seuil.perimetre === "wilaya" && seuil.wilayadId) {
        // filter by wilaya via commune
      }

      const count = await prisma.casDeclare.count({ where: whereCount })

      if (count >= seuil.seuilNombre) {
        // Check not already triggered in this window
        const alreadyTriggered = await prisma.protocoleDeclenchement.findFirst({
          where: { seuilId: seuil.id, createdAt: { gte: since } },
        })

        if (!alreadyTriggered) {
          // Create alert
          const alerte = await prisma.alerte.create({
            data: {
              type: "seuil",
              titre: `Seuil dépassé — ${seuil.maladie.nom}`,
              description: `${count} cas de ${seuil.maladie.nom} en ${seuil.periodejours} jours (seuil: ${seuil.seuilNombre})`,
              maladieId: seuil.maladieId,
              nombreCas: count,
              statut: "active",
            },
          })

          // Find protocole for this maladie
          const protocole = await prisma.protocole.findUnique({
            where: { maladieId: body.maladieId },
          })

          if (protocole) {
            declenchement = await prisma.protocoleDeclenchement.create({
              data: {
                protocoleId: protocole.id,
                seuilId: seuil.id,
                alerteId: alerte.id,
                casDeclencheurId: cas.id,
                nombreCasActuel: count,
                communeId: cas.communeId ?? null,
                maladieId: body.maladieId,
              },
              include: { protocole: true, seuil: true },
            })
          }

          if (seuil.autoNotification) {
            const users = await prisma.user.findMany({
              where: {
                isActive: true,
                userRoles: { some: { role: { slug: { in: ["epidemiologiste", "admin"] } } } },
              },
              select: { id: true, email: true },
            })
            await prisma.notification.createMany({
              data: users.map(u => ({
                userId: u.id,
                type: "seuil_depasse",
                titre: `⚠️ Seuil dépassé — ${seuil.maladie.nom}`,
                message: `${count} cas en ${seuil.periodejours} jours (seuil: ${seuil.seuilNombre}) — Gravité: ${seuil.gravite}`,
              })),
            })
            const { sendAlertEmail } = await import("@/lib/email")
            sendAlertEmail(
              users.map(u => u.email),
              alerte.titre,
              alerte.description,
              alerte.type
            ).catch(console.error)
          }
          break // Only trigger once per case creation
        }
      }
    }

    // Fallback: legacy seuil_alerte on maladie if no seuils configured
    if (seuils.length === 0) {
      const maladie = await prisma.maladie.findUnique({ where: { id: body.maladieId } })
      if (maladie) {
        const since = new Date()
        since.setDate(since.getDate() - 30)
        const recentCount = await prisma.casDeclare.count({
          where: { maladieId: body.maladieId, createdAt: { gte: since } },
        })
        const seuil = maladie.seuilDefaut ?? 5
        if (recentCount >= seuil) {
          const existingAlert = await prisma.alerte.findFirst({
            where: { maladieId: body.maladieId, statut: "active" },
          })
          if (!existingAlert) {
            await prisma.alerte.create({
              data: {
                type: "seuil",
                titre: `Seuil atteint — ${maladie.nom}`,
                description: `${recentCount} cas de ${maladie.nom} en 30 jours (seuil: ${seuil})`,
                maladieId: maladie.id,
                nombreCas: recentCount,
                statut: "active",
              },
            })
          }
        }
      }
    }

    return NextResponse.json({ ...cas, declenchement }, { status: 201 })
  } catch (error) {
    console.error("POST /api/cas error:", error)
    const message = error instanceof Error ? error.message : "Erreur création cas"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

