import "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string          // primary role slug (backward compat)
      roles: string[]       // all role slugs
      permissions: string[] // all permission slugs
      etablissementId?: string
      wilayadId?: string
    }
  }
}
