import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        const u = user as never as {
          role: string; roles: string[]; permissions: string[];
          etablissementId?: string | null; wilayadId?: string | null
        }
        token.id = user.id
        token.role = u.role
        token.roles = u.roles
        token.permissions = u.permissions
        token.etablissementId = u.etablissementId
        token.wilayadId = u.wilayadId
      }
      return token
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.roles = token.roles as string[]
        session.user.permissions = token.permissions as string[]
        session.user.etablissementId = token.etablissementId as string
        session.user.wilayadId = token.wilayadId as string
      }
      return session
    },
  },
  session: { strategy: "jwt", maxAge: 30 * 60 },
  providers: [],
} satisfies NextAuthConfig
