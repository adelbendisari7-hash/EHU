import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { generatePatientId } from "@/utils/generate-id"

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
