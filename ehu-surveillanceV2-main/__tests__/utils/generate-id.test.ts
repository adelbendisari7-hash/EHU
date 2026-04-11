import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { generatePatientId, generateCaseCode } from "@/utils/generate-id"

describe("generatePatientId", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2024-03-15T10:00:00"))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it("returns a string in YYYYMMDD-XXXX format", () => {
    const id = generatePatientId()
    expect(id).toMatch(/^\d{8}-\d{4}$/)
  })

  it("starts with the current date prefix", () => {
    const id = generatePatientId()
    expect(id).toMatch(/^20240315-/)
  })

  it("generates unique IDs (not always the same)", () => {
    const ids = new Set(Array.from({ length: 100 }, () => generatePatientId()))
    // With 4-digit random (1000-9999), 100 calls should produce many unique IDs
    expect(ids.size).toBeGreaterThan(50)
  })

  it("random part is 4 digits between 1000 and 9999", () => {
    for (let i = 0; i < 50; i++) {
      const id = generatePatientId()
      const randomPart = parseInt(id.split("-")[1])
      expect(randomPart).toBeGreaterThanOrEqual(1000)
      expect(randomPart).toBeLessThanOrEqual(9999)
    }
  })
})

describe("generateCaseCode", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2024-03-15T10:00:00"))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it("returns a string in CAS-YYYY-XXXXXX format", () => {
    const code = generateCaseCode()
    expect(code).toMatch(/^CAS-\d{4}-\d{6}$/)
  })

  it("includes the current year", () => {
    const code = generateCaseCode()
    expect(code).toMatch(/^CAS-2024-/)
  })

  it("generates unique codes", () => {
    const codes = new Set(Array.from({ length: 100 }, () => generateCaseCode()))
    expect(codes.size).toBeGreaterThan(50)
  })

  it("random part is 6 digits between 100000 and 999999", () => {
    for (let i = 0; i < 50; i++) {
      const code = generateCaseCode()
      const randomPart = parseInt(code.split("-")[2])
      expect(randomPart).toBeGreaterThanOrEqual(100000)
      expect(randomPart).toBeLessThanOrEqual(999999)
    }
  })
})
