// Global test setup
import { vi } from "vitest"

// Mock next-auth for API route tests
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}))

// Mock email service
vi.mock("@/lib/email", () => ({
  sendAlertEmail: vi.fn().mockResolvedValue(undefined),
  sendWelcomeEmail: vi.fn().mockResolvedValue(undefined),
}))
