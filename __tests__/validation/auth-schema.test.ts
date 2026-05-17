import { describe, it, expect } from "vitest"
import { z } from "zod"

// Replicate the login schema from auth.ts
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

describe("Login Schema", () => {
  it("accepts valid email and password", () => {
    const result = loginSchema.safeParse({ email: "admin@ehu.dz", password: "password123" })
    expect(result.success).toBe(true)
  })

  it("rejects missing email", () => {
    const result = loginSchema.safeParse({ password: "password123" })
    expect(result.success).toBe(false)
  })

  it("rejects missing password", () => {
    const result = loginSchema.safeParse({ email: "admin@ehu.dz" })
    expect(result.success).toBe(false)
  })

  it("rejects invalid email format", () => {
    const result = loginSchema.safeParse({ email: "not-email", password: "password123" })
    expect(result.success).toBe(false)
  })

  it("rejects password shorter than 8 characters", () => {
    const result = loginSchema.safeParse({ email: "admin@ehu.dz", password: "1234567" })
    expect(result.success).toBe(false)
  })

  it("accepts password of exactly 8 characters", () => {
    const result = loginSchema.safeParse({ email: "admin@ehu.dz", password: "12345678" })
    expect(result.success).toBe(true)
  })

  it("rejects empty email", () => {
    const result = loginSchema.safeParse({ email: "", password: "password123" })
    expect(result.success).toBe(false)
  })

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({ email: "admin@ehu.dz", password: "" })
    expect(result.success).toBe(false)
  })

  it("accepts email with subdomain", () => {
    const result = loginSchema.safeParse({ email: "user@mail.ehu.dz", password: "password123" })
    expect(result.success).toBe(true)
  })

  it("accepts long password", () => {
    const result = loginSchema.safeParse({ email: "admin@ehu.dz", password: "a".repeat(100) })
    expect(result.success).toBe(true)
  })
})
