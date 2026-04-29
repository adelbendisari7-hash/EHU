import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// Track created IDs for cleanup
const cleanup: { model: string; id: string }[] = []

beforeAll(async () => {
  await prisma.$connect()
})

afterAll(async () => {
  // Clean up in reverse order to respect FK constraints
  for (const item of cleanup.reverse()) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (prisma as any)[item.model].delete({ where: { id: item.id } })
    } catch {
      // Ignore cleanup errors (might be cascade-deleted already)
    }
  }
  await prisma.$disconnect()
})

describe("Database Connection", () => {
  it("connects to the database", async () => {
    const result = await prisma.$queryRaw`SELECT 1 as ok`
    expect(result).toBeTruthy()
  })
})

describe("Symptome Model", () => {
  it("can read symptomes from seeded data", async () => {
    const symptomes = await prisma.symptome.findMany({ take: 5 })
    expect(symptomes.length).toBeGreaterThan(0)
  })

  it("each symptome has code, nom, and isActive", async () => {
    const symptomes = await prisma.symptome.findMany({ take: 10 })
    for (const s of symptomes) {
      expect(s.code).toBeTruthy()
      expect(s.nom).toBeTruthy()
      expect(s.isActive).toBe(true)
    }
  })

  it("symptome codes are unique", async () => {
    const all = await prisma.symptome.findMany()
    const codes = all.map(s => s.code)
    expect(new Set(codes).size).toBe(codes.length)
  })

  it("FIEVRE symptome exists", async () => {
    const fievre = await prisma.symptome.findUnique({ where: { code: "FIEVRE" } })
    expect(fievre).toBeTruthy()
    expect(fievre!.nom).toBe("Fièvre")
  })
})

describe("Germe Model", () => {
  it("can read germes from seeded data", async () => {
    const germes = await prisma.germe.findMany({ take: 5 })
    expect(germes.length).toBeGreaterThan(0)
  })

  it("each germe has code, nom, type, and isActive", async () => {
    const germes = await prisma.germe.findMany({ take: 10 })
    for (const g of germes) {
      expect(g.code).toBeTruthy()
      expect(g.nom).toBeTruthy()
      expect(g.type).toBeTruthy()
      expect(g.isActive).toBe(true)
    }
  })

  it("germe codes are unique", async () => {
    const all = await prisma.germe.findMany()
    const codes = all.map(g => g.code)
    expect(new Set(codes).size).toBe(codes.length)
  })

  it("SALMONELLA_TYPHI germe exists", async () => {
    const salmonella = await prisma.germe.findUnique({ where: { code: "SALMONELLA_TYPHI" } })
    expect(salmonella).toBeTruthy()
    expect(salmonella!.type).toBe("bacterie")
  })
})

describe("Maladie Model", () => {
  it("can read maladies", async () => {
    const maladies = await prisma.maladie.findMany({ take: 5 })
    expect(maladies.length).toBeGreaterThan(0)
  })

  it("each maladie has nom, codeCim10, and categorie", async () => {
    const maladies = await prisma.maladie.findMany({ take: 10 })
    for (const m of maladies) {
      expect(m.nom).toBeTruthy()
      expect(m.codeCim10).toBeTruthy()
      expect(m.categorie).toBeTruthy()
    }
  })

  it("codeCim10 is unique", async () => {
    const all = await prisma.maladie.findMany()
    const codes = all.map(m => m.codeCim10)
    expect(new Set(codes).size).toBe(codes.length)
  })
})

describe("Role Model", () => {
  it("has at least 3 roles (medecin, epidemiologiste, admin)", async () => {
    const roles = await prisma.role.findMany()
    expect(roles.length).toBeGreaterThanOrEqual(3)
    const slugs = roles.map(r => r.slug)
    expect(slugs).toContain("medecin")
    expect(slugs).toContain("epidemiologiste")
    expect(slugs).toContain("admin")
  })
})

describe("Permission Model", () => {
  it("cas.create permission exists", async () => {
    const perm = await prisma.permission.findUnique({ where: { slug: "cas.create" } })
    expect(perm).toBeTruthy()
  })

  it("admin role has cas.create permission", async () => {
    const admin = await prisma.role.findUnique({
      where: { slug: "admin" },
      include: { rolePermissions: { include: { permission: true } } },
    })
    expect(admin).toBeTruthy()
    const slugs = admin!.rolePermissions.map(rp => rp.permission.slug)
    expect(slugs).toContain("cas.create")
  })
})

describe("Wilaya & Commune Models", () => {
  it("has wilayas", async () => {
    const wilayas = await prisma.wilaya.findMany({ take: 5 })
    expect(wilayas.length).toBeGreaterThan(0)
  })

  it("wilayas have unique codes", async () => {
    const all = await prisma.wilaya.findMany()
    const codes = all.map(w => w.code)
    expect(new Set(codes).size).toBe(codes.length)
  })

  it("communes reference valid wilayas", async () => {
    const communes = await prisma.commune.findMany({ take: 10, include: { wilaya: true } })
    for (const c of communes) {
      expect(c.wilaya).toBeTruthy()
      expect(c.wilaya.nom).toBeTruthy()
    }
  })
})

describe("User Model", () => {
  it("has at least one user", async () => {
    const count = await prisma.user.count()
    expect(count).toBeGreaterThan(0)
  })

  it("users have required fields", async () => {
    const users = await prisma.user.findMany({ take: 3 })
    for (const u of users) {
      expect(u.email).toBeTruthy()
      expect(u.firstName).toBeTruthy()
      expect(u.lastName).toBeTruthy()
      expect(u.passwordHash).toBeTruthy()
    }
  })

  it("user emails are unique", async () => {
    const all = await prisma.user.findMany({ select: { email: true } })
    const emails = all.map(u => u.email)
    expect(new Set(emails).size).toBe(emails.length)
  })
})

describe("CasDeclare Model — Create and Read", () => {
  let testPatientId: string
  let testMaladieId: string
  let testCasId: string

  it("can create a patient", async () => {
    const maladie = await prisma.maladie.findFirst()
    testMaladieId = maladie!.id

    const patient = await prisma.patient.create({
      data: {
        identifiant: `TEST-${Date.now()}`,
        firstName: "TestPrenom",
        lastName: "TestNom",
        dateOfBirth: new Date("1990-01-01"),
        sex: "homme",
        address: "Test Address",
      },
    })
    testPatientId = patient.id
    cleanup.push({ model: "patient", id: patient.id })
    expect(patient.id).toBeTruthy()
    expect(patient.firstName).toBe("TestPrenom")
  })

  it("can create a case (CasDeclare)", async () => {
    const cas = await prisma.casDeclare.create({
      data: {
        codeCas: `CAS-TEST-${Date.now()}`,
        patientId: testPatientId,
        maladieId: testMaladieId,
        dateDebutSymptomes: new Date("2024-03-01"),
        dateDiagnostic: new Date("2024-03-05"),
        service: "Test Service",
        statut: "nouveau",
        // Phase E fields
        nationaliteCode: "DZ",
        evaluationClinique: { notes: "Test evaluation" },
      },
    })
    testCasId = cas.id
    cleanup.push({ model: "casDeclare", id: cas.id })
    expect(cas.id).toBeTruthy()
    expect(cas.statut).toBe("nouveau")
    expect(cas.nationaliteCode).toBe("DZ")
  })

  it("can read the created case with relations", async () => {
    const cas = await prisma.casDeclare.findUnique({
      where: { id: testCasId },
      include: { patient: true, maladie: true },
    })
    expect(cas).toBeTruthy()
    expect(cas!.patient.firstName).toBe("TestPrenom")
    expect(cas!.maladie?.nom).toBeTruthy()
  })

  it("can create CasSymptome links", async () => {
    const symptome = await prisma.symptome.findFirst()
    const cs = await prisma.casSymptome.create({
      data: { casId: testCasId, symptomeId: symptome!.id },
    })
    cleanup.push({ model: "casSymptome", id: cs.id })
    expect(cs.id).toBeTruthy()
  })

  it("enforces unique constraint on CasSymptome (same cas + same symptome)", async () => {
    const symptome = await prisma.symptome.findFirst()
    await expect(
      prisma.casSymptome.create({
        data: { casId: testCasId, symptomeId: symptome!.id },
      })
    ).rejects.toThrow()
  })

  it("can create CasLieu entries (up to 4)", async () => {
    const lieu = await prisma.casLieu.create({
      data: {
        casId: testCasId,
        ordre: 1,
        nom: "Marché Central",
        type: "marche",
        adresse: "Centre ville",
      },
    })
    cleanup.push({ model: "casLieu", id: lieu.id })
    expect(lieu.nom).toBe("Marché Central")
    expect(lieu.ordre).toBe(1)
  })

  it("enforces unique constraint on CasLieu (same cas + same ordre)", async () => {
    await expect(
      prisma.casLieu.create({
        data: {
          casId: testCasId,
          ordre: 1, // Already created above
          nom: "Duplicate Lieu",
        },
      })
    ).rejects.toThrow()
  })

  it("can create ResultatLabo entries", async () => {
    const germe = await prisma.germe.findFirst()
    const r = await prisma.resultatLabo.create({
      data: {
        casId: testCasId,
        typePrelevement: "SANG",
        datePrelevement: new Date("2024-03-05"),
        germeId: germe!.id,
        resultat: "positif",
        laboratoire: "Labo EHU",
      },
    })
    cleanup.push({ model: "resultatLabo", id: r.id })
    expect(r.resultat).toBe("positif")
    expect(r.typePrelevement).toBe("SANG")
  })

  it("can read case with all Phase E relations", async () => {
    const cas = await prisma.casDeclare.findUnique({
      where: { id: testCasId },
      include: {
        symptomes: { include: { symptome: true } },
        lieux: { orderBy: { ordre: "asc" } },
        resultatsLabo: { include: { germe: true } },
      },
    })
    expect(cas!.symptomes.length).toBeGreaterThan(0)
    expect(cas!.lieux.length).toBeGreaterThan(0)
    expect(cas!.resultatsLabo.length).toBeGreaterThan(0)
    expect(cas!.resultatsLabo[0].germe).toBeTruthy()
  })

  it("can update case status", async () => {
    const updated = await prisma.casDeclare.update({
      where: { id: testCasId },
      data: { statut: "en_cours" },
    })
    expect(updated.statut).toBe("en_cours")
  })

  it("cascade deletes symptomes, lieux, resultatsLabo when case is deleted", async () => {
    // Get counts before delete
    const symptomesBefore = await prisma.casSymptome.count({ where: { casId: testCasId } })
    const lieuxBefore = await prisma.casLieu.count({ where: { casId: testCasId } })
    const labsBefore = await prisma.resultatLabo.count({ where: { casId: testCasId } })

    expect(symptomesBefore).toBeGreaterThan(0)
    expect(lieuxBefore).toBeGreaterThan(0)
    expect(labsBefore).toBeGreaterThan(0)

    // Delete case
    await prisma.casDeclare.delete({ where: { id: testCasId } })

    // Verify cascade
    const symptomesAfter = await prisma.casSymptome.count({ where: { casId: testCasId } })
    const lieuxAfter = await prisma.casLieu.count({ where: { casId: testCasId } })
    const labsAfter = await prisma.resultatLabo.count({ where: { casId: testCasId } })

    expect(symptomesAfter).toBe(0)
    expect(lieuxAfter).toBe(0)
    expect(labsAfter).toBe(0)

    // Remove from cleanup since already deleted
    const casIdx = cleanup.findIndex(c => c.model === "casDeclare" && c.id === testCasId)
    if (casIdx !== -1) cleanup.splice(casIdx, 1)
    // Also remove child items from cleanup
    cleanup.splice(0, cleanup.length, ...cleanup.filter(c =>
      !(c.model === "casSymptome" || c.model === "casLieu" || c.model === "resultatLabo")
    ))
  })
})

describe("Self-referencing CasSimilaire FK", () => {
  it("can link two cases via casSimilaireId", async () => {
    const maladie = await prisma.maladie.findFirst()
    const patient1 = await prisma.patient.create({
      data: {
        identifiant: `SIM-P1-${Date.now()}`,
        firstName: "Patient1",
        lastName: "Sim",
        dateOfBirth: new Date("1990-01-01"),
        sex: "homme",
        address: "Addr 1",
      },
    })
    cleanup.push({ model: "patient", id: patient1.id })

    const patient2 = await prisma.patient.create({
      data: {
        identifiant: `SIM-P2-${Date.now()}`,
        firstName: "Patient2",
        lastName: "Sim",
        dateOfBirth: new Date("1990-01-01"),
        sex: "femme",
        address: "Addr 2",
      },
    })
    cleanup.push({ model: "patient", id: patient2.id })

    const casA = await prisma.casDeclare.create({
      data: {
        codeCas: `SIM-A-${Date.now()}`,
        patientId: patient1.id,
        maladieId: maladie!.id,
        dateDebutSymptomes: new Date(),
        dateDiagnostic: new Date(),
        service: "Test",
        statut: "nouveau",
      },
    })
    cleanup.push({ model: "casDeclare", id: casA.id })

    const casB = await prisma.casDeclare.create({
      data: {
        codeCas: `SIM-B-${Date.now()}`,
        patientId: patient2.id,
        maladieId: maladie!.id,
        dateDebutSymptomes: new Date(),
        dateDiagnostic: new Date(),
        service: "Test",
        statut: "nouveau",
        casSimilaireId: casA.id,
      },
    })
    cleanup.push({ model: "casDeclare", id: casB.id })

    // Verify link from B → A
    const casWithRef = await prisma.casDeclare.findUnique({
      where: { id: casB.id },
      include: { casSimilaireRef: { select: { codeCas: true } } },
    })
    expect(casWithRef!.casSimilaireRef).toBeTruthy()
    expect(casWithRef!.casSimilaireRef!.codeCas).toBe(casA.codeCas)

    // Verify reverse link A → casSimilairesLies
    const casWithLies = await prisma.casDeclare.findUnique({
      where: { id: casA.id },
      include: { casSimilairesLies: { select: { codeCas: true } } },
    })
    expect(casWithLies!.casSimilairesLies.length).toBe(1)
    expect(casWithLies!.casSimilairesLies[0].codeCas).toBe(casB.codeCas)
  })
})
