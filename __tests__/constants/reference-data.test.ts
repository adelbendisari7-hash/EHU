import { describe, it, expect } from "vitest"
import { NATIONALITIES } from "@/constants/nationalities"
import { SYMPTOMS, SYMPTOM_CATEGORIES } from "@/constants/symptoms"
import { GERMES, GERME_TYPES } from "@/constants/germes"
import { SAMPLE_TYPES } from "@/constants/sample-types"
import { LIEU_TYPES } from "@/constants/lieu-types"

describe("NATIONALITIES", () => {
  it("has at least 50 entries", () => {
    expect(NATIONALITIES.length).toBeGreaterThanOrEqual(50)
  })

  it("Algeria is first entry", () => {
    expect(NATIONALITIES[0].code).toBe("DZ")
    expect(NATIONALITIES[0].label).toBe("Algérie")
  })

  it("all entries have code and label", () => {
    for (const n of NATIONALITIES) {
      expect(n.code).toBeTruthy()
      expect(n.label).toBeTruthy()
      expect(n.code.length).toBe(2) // ISO alpha-2
    }
  })

  it("has no duplicate codes", () => {
    const codes = NATIONALITIES.map(n => n.code)
    expect(new Set(codes).size).toBe(codes.length)
  })

  it("includes common nationalities (France, Tunisia, Morocco)", () => {
    const codes = NATIONALITIES.map(n => n.code)
    expect(codes).toContain("FR")
    expect(codes).toContain("TN")
    expect(codes).toContain("MA")
  })
})

describe("SYMPTOMS", () => {
  it("has at least 30 symptoms", () => {
    expect(SYMPTOMS.length).toBeGreaterThanOrEqual(30)
  })

  it("all symptoms have code, nom, and categorie", () => {
    for (const s of SYMPTOMS) {
      expect(s.code).toBeTruthy()
      expect(s.nom).toBeTruthy()
      expect(s.categorie).toBeTruthy()
    }
  })

  it("has no duplicate codes", () => {
    const codes = SYMPTOMS.map(s => s.code)
    expect(new Set(codes).size).toBe(codes.length)
  })

  it("all categories are defined in SYMPTOM_CATEGORIES", () => {
    const validCats = SYMPTOM_CATEGORIES.map(c => c.key)
    for (const s of SYMPTOMS) {
      expect(validCats).toContain(s.categorie)
    }
  })

  it("SYMPTOM_CATEGORIES has key and label", () => {
    for (const cat of SYMPTOM_CATEGORIES) {
      expect(cat.key).toBeTruthy()
      expect(cat.label).toBeTruthy()
    }
  })

  it("includes critical epidemiological symptoms (fièvre, diarrhée, toux)", () => {
    const codes = SYMPTOMS.map(s => s.code)
    expect(codes).toContain("FIEVRE")
    expect(codes).toContain("DIARRHEE")
    expect(codes).toContain("TOUX")
  })
})

describe("GERMES", () => {
  it("has at least 30 germs", () => {
    expect(GERMES.length).toBeGreaterThanOrEqual(30)
  })

  it("all germs have code, nom, and type", () => {
    for (const g of GERMES) {
      expect(g.code).toBeTruthy()
      expect(g.nom).toBeTruthy()
      expect(g.type).toBeTruthy()
    }
  })

  it("has no duplicate codes", () => {
    const codes = GERMES.map(g => g.code)
    expect(new Set(codes).size).toBe(codes.length)
  })

  it("all types are valid", () => {
    const validTypes = GERME_TYPES.map(t => t.key)
    for (const g of GERMES) {
      expect(validTypes).toContain(g.type)
    }
  })

  it("includes key pathogens (Salmonella, SARS-CoV-2, Plasmodium)", () => {
    const codes = GERMES.map(g => g.code)
    expect(codes).toContain("SALMONELLA_TYPHI")
    expect(codes).toContain("SARS_COV_2")
    expect(codes).toContain("PLASMODIUM_FALCIPARUM")
  })
})

describe("SAMPLE_TYPES", () => {
  it("has at least 10 sample types", () => {
    expect(SAMPLE_TYPES.length).toBeGreaterThanOrEqual(10)
  })

  it("all entries have code and label", () => {
    for (const t of SAMPLE_TYPES) {
      expect(t.code).toBeTruthy()
      expect(t.label).toBeTruthy()
    }
  })

  it("has no duplicate codes", () => {
    const codes = SAMPLE_TYPES.map(t => t.code)
    expect(new Set(codes).size).toBe(codes.length)
  })

  it("includes SANG, URINE, LCR, SELLES", () => {
    const codes = SAMPLE_TYPES.map(t => t.code)
    expect(codes).toContain("SANG")
    expect(codes).toContain("URINE")
    expect(codes).toContain("LCR")
    expect(codes).toContain("SELLES")
  })

  it("includes AUTRE as fallback", () => {
    const codes = SAMPLE_TYPES.map(t => t.code)
    expect(codes).toContain("AUTRE")
  })
})

describe("LIEU_TYPES", () => {
  it("has at least 5 lieu types", () => {
    expect(LIEU_TYPES.length).toBeGreaterThanOrEqual(5)
  })

  it("all entries have code and label", () => {
    for (const t of LIEU_TYPES) {
      expect(t.code).toBeTruthy()
      expect(t.label).toBeTruthy()
    }
  })

  it("has no duplicate codes", () => {
    const codes = LIEU_TYPES.map(t => t.code)
    expect(new Set(codes).size).toBe(codes.length)
  })

  it("includes domicile, travail, ecole, marche", () => {
    const codes = LIEU_TYPES.map(t => t.code)
    expect(codes).toContain("domicile")
    expect(codes).toContain("travail")
    expect(codes).toContain("ecole")
    expect(codes).toContain("marche")
  })
})
