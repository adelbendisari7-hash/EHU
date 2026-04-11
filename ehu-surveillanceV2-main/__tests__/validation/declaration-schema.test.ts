import { describe, it, expect } from "vitest"
import { z } from "zod"

// Helper matching the form's NaN-safe approach (rejects out-of-range, NaN→undefined)
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

const validMinimalData = {
  firstName: "Ahmed",
  lastName: "Benali",
  sex: "homme" as const,
  address: "123 Rue Oran",
  maladieId: "some-uuid",
  dateDebutSymptomes: "2024-03-01",
  dateDiagnostic: "2024-03-05",
  service: "Médecine interne",
}

const validFullData = {
  ...validMinimalData,
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
  estEtranger: false,
  nationalite: "Algérie",
  nationaliteCode: "DZ",
  symptomesTexte: "Fièvre, toux",
  observation: "cas_confirme" as const,
  modeConfirmation: "clinique" as const,
  atcd: "Diabète",
  casSimilaire: true,
  casSimilaireId: "cas-uuid",
  estHospitalise: true,
  dateHospitalisation: "2024-03-05",
  structureHospitalisationId: "etab-uuid",
  serviceHospitalisation: "Réanimation",
  evaluationClinique: "État stable",
  estEvacue: false,
  evolution: "en_cours_guerison" as const,
  etablissementId: "etab-uuid",
  notesCliniques: "Patient stable",
  resultatLabo: "PCR positif",
}

describe("Declaration Zod Schema — Required Fields", () => {
  it("accepts valid minimal data (only required fields)", () => {
    const result = declarationSchema.safeParse(validMinimalData)
    expect(result.success).toBe(true)
  })

  it("accepts valid full data (all fields)", () => {
    const result = declarationSchema.safeParse(validFullData)
    expect(result.success).toBe(true)
  })

  it("rejects missing firstName", () => {
    const data = { ...validMinimalData, firstName: undefined }
    const result = declarationSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it("rejects firstName shorter than 2 characters", () => {
    const data = { ...validMinimalData, firstName: "A" }
    const result = declarationSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it("rejects empty firstName", () => {
    const data = { ...validMinimalData, firstName: "" }
    const result = declarationSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it("rejects missing lastName", () => {
    const data = { ...validMinimalData, lastName: undefined }
    const result = declarationSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it("rejects lastName shorter than 2 characters", () => {
    const data = { ...validMinimalData, lastName: "B" }
    const result = declarationSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it("rejects missing sex", () => {
    const data = { ...validMinimalData, sex: undefined }
    const result = declarationSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it("rejects invalid sex value", () => {
    const data = { ...validMinimalData, sex: "other" }
    const result = declarationSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it("rejects missing address", () => {
    const data = { ...validMinimalData, address: undefined }
    const result = declarationSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it("rejects address shorter than 2 characters", () => {
    const data = { ...validMinimalData, address: "A" }
    const result = declarationSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it("rejects missing maladieId", () => {
    const data = { ...validMinimalData, maladieId: undefined }
    const result = declarationSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it("rejects empty maladieId", () => {
    const data = { ...validMinimalData, maladieId: "" }
    const result = declarationSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it("rejects missing dateDebutSymptomes", () => {
    const data = { ...validMinimalData, dateDebutSymptomes: undefined }
    const result = declarationSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it("rejects empty dateDebutSymptomes", () => {
    const data = { ...validMinimalData, dateDebutSymptomes: "" }
    const result = declarationSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it("rejects missing dateDiagnostic", () => {
    const data = { ...validMinimalData, dateDiagnostic: undefined }
    const result = declarationSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it("rejects missing service", () => {
    const data = { ...validMinimalData, service: undefined }
    const result = declarationSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it("rejects empty service", () => {
    const data = { ...validMinimalData, service: "" }
    const result = declarationSchema.safeParse(data)
    expect(result.success).toBe(false)
  })
})

describe("Declaration Zod Schema — Optional Fields", () => {
  it("allows submission without phone", () => {
    const data = { ...validMinimalData, phone: undefined }
    expect(declarationSchema.safeParse(data).success).toBe(true)
  })

  it("allows submission without emailPatient", () => {
    const data = { ...validMinimalData, emailPatient: undefined }
    expect(declarationSchema.safeParse(data).success).toBe(true)
  })

  it("allows empty string email", () => {
    const data = { ...validMinimalData, emailPatient: "" }
    expect(declarationSchema.safeParse(data).success).toBe(true)
  })

  it("rejects invalid email format", () => {
    const data = { ...validMinimalData, emailPatient: "not-an-email" }
    expect(declarationSchema.safeParse(data).success).toBe(false)
  })

  it("allows submission without observation", () => {
    const data = { ...validMinimalData, observation: undefined }
    expect(declarationSchema.safeParse(data).success).toBe(true)
  })

  it("allows submission without casSimilaire", () => {
    const data = { ...validMinimalData, casSimilaire: undefined }
    expect(declarationSchema.safeParse(data).success).toBe(true)
  })

  it("allows submission without estHospitalise", () => {
    const data = { ...validMinimalData, estHospitalise: undefined }
    expect(declarationSchema.safeParse(data).success).toBe(true)
  })

  it("allows submission without estEvacue", () => {
    const data = { ...validMinimalData, estEvacue: undefined }
    expect(declarationSchema.safeParse(data).success).toBe(true)
  })

  it("allows submission without evolution", () => {
    const data = { ...validMinimalData, evolution: undefined }
    expect(declarationSchema.safeParse(data).success).toBe(true)
  })

  it("allows submission without notesCliniques", () => {
    const data = { ...validMinimalData, notesCliniques: undefined }
    expect(declarationSchema.safeParse(data).success).toBe(true)
  })

  it("allows submission without resultatLabo", () => {
    const data = { ...validMinimalData, resultatLabo: undefined }
    expect(declarationSchema.safeParse(data).success).toBe(true)
  })
})

describe("Declaration Zod Schema — Enum Validation", () => {
  it("accepts 'homme' for sex", () => {
    const data = { ...validMinimalData, sex: "homme" }
    expect(declarationSchema.safeParse(data).success).toBe(true)
  })

  it("accepts 'femme' for sex", () => {
    const data = { ...validMinimalData, sex: "femme" }
    expect(declarationSchema.safeParse(data).success).toBe(true)
  })

  it("accepts valid observation values", () => {
    expect(declarationSchema.safeParse({ ...validMinimalData, observation: "cas_confirme" }).success).toBe(true)
    expect(declarationSchema.safeParse({ ...validMinimalData, observation: "cas_suspect" }).success).toBe(true)
  })

  it("rejects invalid observation value", () => {
    const data = { ...validMinimalData, observation: "invalid" }
    expect(declarationSchema.safeParse(data).success).toBe(false)
  })

  it("accepts all valid evolution values", () => {
    for (const evo of ["guerison", "en_cours_guerison", "sortant", "toujours_malade", "autre", "deces"]) {
      expect(declarationSchema.safeParse({ ...validMinimalData, evolution: evo }).success).toBe(true)
    }
  })

  it("rejects invalid evolution value", () => {
    const data = { ...validMinimalData, evolution: "invalid" }
    expect(declarationSchema.safeParse(data).success).toBe(false)
  })

  it("accepts all valid modeConfirmation values", () => {
    for (const mode of ["clinique", "biologique", "epidemiologique"]) {
      expect(declarationSchema.safeParse({ ...validMinimalData, modeConfirmation: mode }).success).toBe(true)
    }
  })

  it("rejects invalid modeConfirmation value", () => {
    expect(declarationSchema.safeParse({ ...validMinimalData, modeConfirmation: "invalid" }).success).toBe(false)
  })
})

describe("Declaration Zod Schema — Number Fields with .catch(undefined)", () => {
  it("converts NaN to undefined for ageAns", () => {
    const data = { ...validMinimalData, ageAns: NaN }
    const result = declarationSchema.safeParse(data)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.ageAns).toBeUndefined()
    }
  })

  it("converts NaN to undefined for ageMois", () => {
    const data = { ...validMinimalData, ageMois: NaN }
    const result = declarationSchema.safeParse(data)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.ageMois).toBeUndefined()
    }
  })

  it("converts NaN to undefined for ageJours", () => {
    const data = { ...validMinimalData, ageJours: NaN }
    const result = declarationSchema.safeParse(data)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.ageJours).toBeUndefined()
    }
  })

  it("converts NaN to undefined for moisDeclaration", () => {
    const data = { ...validMinimalData, moisDeclaration: NaN }
    const result = declarationSchema.safeParse(data)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.moisDeclaration).toBeUndefined()
    }
  })

  it("rejects ageAns > 150", () => {
    const data = { ...validMinimalData, ageAns: 200 }
    const result = declarationSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it("rejects ageAns < 0", () => {
    const data = { ...validMinimalData, ageAns: -1 }
    const result = declarationSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it("rejects ageMois > 11", () => {
    const data = { ...validMinimalData, ageMois: 12 }
    const result = declarationSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it("rejects ageJours > 30", () => {
    const data = { ...validMinimalData, ageJours: 31 }
    const result = declarationSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it("accepts valid age values", () => {
    const data = { ...validMinimalData, ageAns: 34, ageMois: 5, ageJours: 14 }
    expect(declarationSchema.safeParse(data).success).toBe(true)
  })
})

describe("Declaration Zod Schema — Special Characters", () => {
  it("accepts French accented characters in names", () => {
    const data = { ...validMinimalData, firstName: "Éloïse", lastName: "Bénédicte" }
    expect(declarationSchema.safeParse(data).success).toBe(true)
  })

  it("accepts Arabic characters in names", () => {
    const data = { ...validMinimalData, firstName: "أحمد", lastName: "بنعلي" }
    expect(declarationSchema.safeParse(data).success).toBe(true)
  })

  it("accepts special characters in address", () => {
    const data = { ...validMinimalData, address: "N° 5, Rue d'Oran — Cité 08 Mai 1945" }
    expect(declarationSchema.safeParse(data).success).toBe(true)
  })

  it("accepts long text in notesCliniques", () => {
    const data = { ...validMinimalData, notesCliniques: "A".repeat(2000) }
    expect(declarationSchema.safeParse(data).success).toBe(true)
  })

  it("rejects NIN longer than 18 characters", () => {
    const data = { ...validMinimalData, nin: "1234567890123456789" }
    expect(declarationSchema.safeParse(data).success).toBe(false)
  })

  it("accepts NIN of exactly 18 characters", () => {
    const data = { ...validMinimalData, nin: "123456789012345678" }
    expect(declarationSchema.safeParse(data).success).toBe(true)
  })
})
