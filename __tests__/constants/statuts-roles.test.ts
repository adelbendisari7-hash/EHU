import { describe, it, expect } from "vitest"
import { CAS_STATUTS } from "@/constants/statuts"

describe("CAS_STATUTS", () => {
  const expectedStatuts = ["brouillon", "suspect", "confirme"]

  it("has exactly 3 case statuses", () => {
    expect(Object.keys(CAS_STATUTS)).toHaveLength(3)
    for (const s of expectedStatuts) {
      expect(CAS_STATUTS).toHaveProperty(s)
    }
  })

  it("each status has label, color, bg, and border", () => {
    for (const [key, val] of Object.entries(CAS_STATUTS)) {
      expect(val.label, `${key} missing label`).toBeTruthy()
      expect(val.color, `${key} missing color`).toMatch(/^#[0-9A-Fa-f]{6}$/)
      expect(val.bg, `${key} missing bg`).toMatch(/^#[0-9A-Fa-f]{6}$/)
      expect(val.border, `${key} missing border`).toMatch(/^#[0-9A-Fa-f]{6}$/)
    }
  })

  it("confirmé is red (danger semantic)", () => {
    expect(CAS_STATUTS.confirme.color).toBe("#DC2626")
  })

  it("suspect is amber/orange (warning semantic)", () => {
    expect(CAS_STATUTS.suspect.color).toBe("#D97706")
  })

  it("brouillon is gray (neutral semantic)", () => {
    expect(CAS_STATUTS.brouillon.color).toBe("#6B7280")
  })

  it("labels are in French", () => {
    expect(CAS_STATUTS.brouillon.label).toBe("Brouillon")
    expect(CAS_STATUTS.suspect.label).toBe("Suspect")
    expect(CAS_STATUTS.confirme.label).toBe("Confirmé")
  })
})
