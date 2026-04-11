import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { calculateAge, calculateAgeDetailed } from "@/utils/calculate-age"

describe("calculateAge", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2024-06-15"))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it("calculates age in years from Date object", () => {
    expect(calculateAge(new Date("1990-01-01"))).toBe(34)
  })

  it("calculates age from ISO string", () => {
    expect(calculateAge("1990-01-01")).toBe(34)
  })

  it("returns 0 for newborn (born today)", () => {
    expect(calculateAge("2024-06-15")).toBe(0)
  })

  it("handles birthday not yet reached this year", () => {
    expect(calculateAge("1990-12-25")).toBe(33)
  })

  it("handles birthday already passed this year", () => {
    expect(calculateAge("1990-03-01")).toBe(34)
  })

  it("handles exact birthday", () => {
    expect(calculateAge("1990-06-15")).toBe(34)
  })

  it("handles elderly age", () => {
    expect(calculateAge("1924-01-01")).toBe(100)
  })
})

describe("calculateAgeDetailed", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2024-06-15"))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it("returns ans, mois, jours breakdown", () => {
    const result = calculateAgeDetailed("2024-01-01")
    expect(result.ans).toBe(0)
    expect(result.mois).toBe(5)
    expect(result.jours).toBe(14)
  })

  it("generates readable label", () => {
    const result = calculateAgeDetailed("1990-01-01")
    expect(result.label).toContain("34 ans")
  })

  it("shows 'jour' singular for 1 day", () => {
    const result = calculateAgeDetailed("2024-06-14")
    expect(result.jours).toBe(1)
    expect(result.label).toContain("1 jour")
  })

  it("shows 'jours' plural for > 1 day", () => {
    const result = calculateAgeDetailed("2024-06-10")
    expect(result.jours).toBe(5)
    expect(result.label).toContain("5 jours")
  })

  it("handles newborn (0 days)", () => {
    const result = calculateAgeDetailed("2024-06-15")
    expect(result.ans).toBe(0)
    expect(result.mois).toBe(0)
    expect(result.jours).toBe(0)
    expect(result.label).toContain("0 jour")
  })

  it("never returns negative values", () => {
    const result = calculateAgeDetailed("2024-06-15")
    expect(result.ans).toBeGreaterThanOrEqual(0)
    expect(result.mois).toBeGreaterThanOrEqual(0)
    expect(result.jours).toBeGreaterThanOrEqual(0)
  })
})
