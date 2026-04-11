import NextAuth, { type User as NextAuthUser } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

interface EHUUser extends NextAuthUser {
  role: string
  roles: string[]
  permissions: string[]
  etablissementId?: string | null
  wilayadId?: string | null
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { email, password } = parsed.data

        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            etablissement: true,
            wilaya: true,
            userRoles: {
              include: {
                role: {
                  include: {
                    rolePermissions: { include: { permission: true } },
                  },
                },
              },
            },
          },
        })

        if (!user || !user.isActive) return null

        const passwordMatch = await bcrypt.compare(password, user.passwordHash)
        if (!passwordMatch) return null

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        })

        const roles = user.userRoles.map((ur) => ur.role.slug)
        const permissions = [
          ...new Set(
            user.userRoles.flatMap((ur) =>
              ur.role.rolePermissions.map((rp) => rp.permission.slug)
            )
          ),
        ]
        // Primary role for backward compatibility
        const primaryRole = roles[0] ?? "medecin"

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: primaryRole,
          roles,
          permissions,
          etablissementId: user.etablissementId,
          wilayadId: user.wilayadId,
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as EHUUser).role
        token.roles = (user as EHUUser).roles
        token.permissions = (user as EHUUser).permissions
        token.etablissementId = (user as EHUUser).etablissementId
        token.wilayadId = (user as EHUUser).wilayadId
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
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 60,
  },
})
