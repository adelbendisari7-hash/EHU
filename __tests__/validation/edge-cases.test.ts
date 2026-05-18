import { describe, it, expect } from "vitest"
import { z } from "zod"

// Replicate helpers from declaration form
function optNum(min: number, max: number) {
  return z.union([
    z.number().refine(n => !isNaN(n)).pipe(z.number().min(min).max(max)),
    z.nan().transform(() => undefined),
  ]).optional()
}
function optInt() {
  return z.union([
    z.number().refine(n => !isNaN(n)).pipe(z.number().int()),
    z.nan().transform(() => undefined),
  ]).optional()
}

const declarationSchema = z.object({
  serviceDeclarant: z.string().optional(),
  moisDeclaration: optInt(),
  anneeDeclaration: optInt(),
  dateDeclaration: z.string().optional(),
  firstName: z.string().min(2, "Minimum 2 caractères"),
  lastName: z.string().min(2, "Minimum 2 caractères"),
  nin: z.string().max(18).optional(),
  dateOfBirth: z.string().optional(),
  ageAns: optNum(0, 150),
  ageMois: optNum(0, 11),
  ageJours: optNum(0, 30),
  sex: z.enum(["homme", "femme"], { message: "Sexe requis" }),
  address: z.string().min(2, "Adresse requise"),
  wilayadId: z.string().optional(),
  communeId: z.string().optional(),
  phone: z.string().optional(),
  emailPatient: z.string().email("Email invalide").optional().or(z.literal("")),
  profession: z.string().optional(),
  lieuTravail: z.string().optional(),
  estEtranger: z.boolean().optional(),
  nationalite: z.string().optional(),
  nationaliteCode: z.string().optional(),
  maladieId: z.string().min(1, "Maladie requise"),
  dateDebutSymptomes: z.string().min(1, "Date requise"),
  dateDiagnostic: z.string().min(1, "Date requise"),
  symptomesTexte: z.string().optional(),
  observation: z.enum(["cas_confirme", "cas_suspect"]).optional(),
  modeConfirmation: z.enum(["clinique", "biologique", "epidemiologique"]).optional(),
  atcd: z.string().optional(),
  casSimilaire: z.boolean().optional(),
  casSimilaireId: z.string().optional(),
  estHospitalise: z.boolean().optional(),
  dateHospitalisation: z.string().optional(),
  structureHospitalisationId: z.string().optional(),
  serviceHospitalisation: z.string().optional(),
  evaluationClinique: z.string().optional(),
  estEvacue: z.boolean().optional(),
  dateEvacuation: z.string().optional(),
  structureEvacuation: z.string().optional(),
  evolution: z.enum(["guerison", "en_cours_guerison", "sortant", "toujours_malade", "autre", "deces"]).optional(),
  dateSortie: z.string().optional(),
  dateDeces: z.string().optional(),
  etablissementId: z.string().optional(),
  service: z.string().min(1, "Service requis"),
  notesCliniques: z.string().optional(),
  resultatLabo: z.string().optional(),
})

const minData = {
  firstName: "Ahmed",
  lastName: "Benali",
  sex: "homme" as const,
  address: "123 Rue Oran",
  maladieId: "some-uuid",
  dateDebutSymptomes: "2024-03-01",
  dateDiagnostic: "2024-03-05",
  service: "Médecine interne",
}

describe("Edge Cases — Long inputs", () => {
  it("accepts very long address (500 chars)", () => {
    const data = { ...minData, address: "A".repeat(500) }
    expect(declarationSchema.safeParse(data).success).toBe(true)
  })

  it("accepts very long notesCliniques (2000 chars)", () => {
    const data = { ...minData, notesCliniques: "X".repeat(2000) }
    expect(declarationSchema.safeParse(data).success).toBe(true)
  })

  it("accepts very long symptomesTexte", () => {
    const data = { ...minData, symptomesTexte: "Fièvre ".repeat(300) }
    expect(declarationSchema.safeParse(data).success).toBe(true)
  })
})

describe("Edge Cases — Special Characters", () => {
  it("accepts Arabic text in firstName", () => {
    const data = { ...minData, firstName: "أحمد" }
    expect(declarationSchema.safeParse(data).success).toBe(true)
  })

  it("accepts Arabic text in lastName", () => {
    const data = { ...minData, lastName: "بنعلي" }
    expect(declarationSchema.safeParse(data).success).toBe(true)
  })

  it("accepts mixed French/Arabic in address", () => {
    const data = { ...minData, address: "حي 08 ماي 1945, وهران" }
    expect(declarationSchema.safeParse(data).success).toBe(true)
  })

  it("accepts accented characters (àéèêëïôùûç)", () => {
    const data = { ...minData, firstName: "Éléonore", lastName: "Bérénice" }
    expect(declarationSchema.safeParse(data).success).toBe(true)
  })

  it("accepts special medical characters in notes", () => {
    const data = { ...minData, notesCliniques: "T° 39.5°C, TA 12/8, SpO2 98%, pH 7.35" }
    expect(declarationSchema.safeParse(data).success).toBe(true)
  })
})

describe("Edge Cases — Boundary values", () => {
  it("accepts ageAns = 0 (newborn)", () => {
    const data = { ...minData, ageAns: 0 }
    expect(declarationSchema.safeParse(data).success).toBe(true)
  })

  it("accepts ageAns = 150 (max)", () => {
    const data = { ...minData, ageAns: 150 }
    expect(declarationSchema.safeParse(data).success).toBe(true)
  })

  it("rejects ageAns = 151", () => {
    const data = { ...minData, ageAns: 151 }
    expect(declarationSchema.safeParse(data).success).toBe(false)
  })

  it("accepts ageMois = 0", () => {
    const data = { ...minData, ageMois: 0 }
    expect(declarationSchema.safeParse(data).success).toBe(true)
  })

  it("accepts ageMois = 11", () => {
    const data = { ...minData, ageMois: 11 }
    expect(declarationSchema.safeParse(data).success).toBe(true)
  })

  it("rejects ageMois = 12", () => {
    const data = { ...minData, ageMois: 12 }
    expect(declarationSchema.safeParse(data).success).toBe(false)
  })

  it("accepts ageJours = 0", () => {
    const data = { ...minData, ageJours: 0 }
    expect(declarationSchema.safeParse(data).success).toBe(true)
  })

  it("accepts ageJours = 30", () => {
    const data = { ...minData, ageJours: 30 }
    expect(declarationSchema.safeParse(data).success).toBe(true)
  })

  it("rejects ageJours = 31", () => {
    const data = { ...minData, ageJours: 31 }
    expect(declarationSchema.safeParse(data).success).toBe(false)
  })

  it("accepts firstName of exactly 2 characters", () => {
    const data = { ...minData, firstName: "AB" }
    expect(declarationSchema.safeParse(data).success).toBe(true)
  })

  it("rejects firstName of 1 character", () => {
    const data = { ...minData, firstName: "A" }
    expect(declarationSchema.safeParse(data).success).toBe(false)
  })
})

describe("Edge Cases — Empty vs null vs undefined", () => {
  it("optional string fields accept undefined", () => {
    const data = { ...minData, phone: undefined, profession: undefined }
    expect(declarationSchema.safeParse(data).success).toBe(true)
  })

  it("email allows empty string (treated as optional)", () => {
    const data = { ...minData, emailPatient: "" }
    expect(declarationSchema.safeParse(data).success).toBe(true)
  })

  it("boolean fields accept undefined", () => {
    const data = { ...minData, estEtranger: undefined, estHospitalise: undefined, estEvacue: undefined }
    expect(declarationSchema.safeParse(data).success).toBe(true)
  })

  it("NaN in age fields becomes undefined (not error)", () => {
    const data = { ...minData, ageAns: NaN, ageMois: NaN, ageJours: NaN }
    const result = declarationSchema.safeParse(data)
    expect(result.success).toBe(true)
  })
})

describe("Edge Cases — Maximum data payload", () => {
  it("accepts a fully-loaded declaration with every field filled", () => {
    const data = {
      ...minData,
      serviceDeclarant: "Service A",
      moisDeclaration: 3,
      anneeDeclaration: 2024,
      dateDeclaration: "2024-03-15",
      nin: "123456789012345678",
      dateOfBirth: "1990-01-01",
      ageAns: 34,
      ageMois: 5,
      ageJours: 14,
      wilayadId: "w-uuid",
      communeId: "c-uuid",
      phone: "0555123456",
      emailPatient: "ahmed@test.com",
      profession: "Enseignant",
      lieuTravail: "Lycée d'Oran",
      estEtranger: true,
      nationalite: "France",
      nationaliteCode: "FR",
      symptomesTexte: "Fièvre élevée, toux sèche, céphalées",
      observation: "cas_confirme" as const,
      modeConfirmation: "biologique" as const,
      atcd: "Diabète type 2, HTA",
      casSimilaire: true,
      casSimilaireId: "cas-uuid",
      estHospitalise: true,
      dateHospitalisation: "2024-03-05",
      structureHospitalisationId: "etab-uuid",
      serviceHospitalisation: "Réanimation",
      evaluationClinique: "État stable, constantes normales",
      estEvacue: true,
      dateEvacuation: "2024-03-06",
      structureEvacuation: "CHU Oran",
      evolution: "en_cours_guerison" as const,
      etablissementId: "etab-uuid",
      notesCliniques: "Patient en amélioration clinique progressive",
      resultatLabo: "PCR positif SARS-CoV-2",
    }
    expect(declarationSchema.safeParse(data).success).toBe(true)
  })
})
