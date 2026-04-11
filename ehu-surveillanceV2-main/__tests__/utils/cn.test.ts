import { describe, it, expect } from "vitest"
import { cn } from "@/utils/cn"

describe("cn (class name utility)", () => {
  it("merges simple class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar")
  })

  it("handles conditional classes", () => {
    expect(cn("base", true && "active")).toBe("base active")
    expect(cn("base", false && "active")).toBe("base")
  })

  it("handles undefined and null", () => {
    expect(cn("base", undefined, null)).toBe("base")
  })

  it("resolves Tailwind conflicts (twMerge)", () => {
    // twMerge resolves px-2 vs px-4 to the last one
    expect(cn("px-2", "px-4")).toBe("px-4")
  })

  it("handles empty inputs", () => {
    expect(cn()).toBe("")
    expect(cn("")).toBe("")
  })

  it("handles arrays", () => {
    expect(cn(["foo", "bar"])).toBe("foo bar")
  })
})
