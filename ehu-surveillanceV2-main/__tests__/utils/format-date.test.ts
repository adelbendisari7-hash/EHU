import { describe, it, expect } from "vitest"
import { formatDate, formatDateTime } from "@/utils/format-date"

describe("formatDate", () => {
  it("formats a Date object to DD/MM/YYYY", () => {
    const result = formatDate(new Date("2024-03-15"))
    expect(result).toBe("15/03/2024")
  })

  it("formats an ISO string to DD/MM/YYYY", () => {
    const result = formatDate("2024-01-01T00:00:00.000Z")
    expect(result).toBe("01/01/2024")
  })

  it("returns '—' for null", () => {
    expect(formatDate(null)).toBe("—")
  })

  it("returns '—' for undefined", () => {
    expect(formatDate(undefined)).toBe("—")
  })

  it("returns '—' for empty string", () => {
    // Empty string is falsy
    expect(formatDate("")).toBe("—")
  })

  it("handles dates with different months correctly", () => {
    expect(formatDate(new Date("2024-12-25"))).toBe("25/12/2024")
    expect(formatDate(new Date("2024-06-01"))).toBe("01/06/2024")
  })

  it("handles leap year date", () => {
    const result = formatDate(new Date("2024-02-29"))
    expect(result).toBe("29/02/2024")
  })
})

describe("formatDateTime", () => {
  it("formats date with time", () => {
    const result = formatDateTime(new Date("2024-03-15T14:30:00"))
    expect(result).toMatch(/15\/03\/2024/)
    expect(result).toMatch(/14:30/)
  })

  it("returns '—' for null", () => {
    expect(formatDateTime(null)).toBe("—")
  })

  it("returns '—' for undefined", () => {
    expect(formatDateTime(undefined)).toBe("—")
  })
})
