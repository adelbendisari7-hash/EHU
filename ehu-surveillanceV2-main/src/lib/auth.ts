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
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { email, password } = parsed.data

        const user = await prisma.user.findUnique({
          where: { email },
          include: {
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

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: roles[0] ?? "medecin",
          roles,
          permissions,
          etablissementId: user.etablissementId,
          wilayadId: user.wilayadId,
        } as EHUUser
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        const u = user as EHUUser
        token.id = u.id
        token.role = u.role
        token.roles = u.roles
        token.permissions = u.permissions
        token.etablissementId = u.etablissementId
        token.wilayadId = u.wilayadId
      }
      return token
    },
    session({ session, token }) {
      session.user.id = token.id as string
      session.user.role = token.role as string
      session.user.roles = token.roles as string[]
      session.user.permissions = token.permissions as string[]
      session.user.etablissementId = token.etablissementId as string
      session.user.wilayadId = token.wilayadId as string
      return session
    },
  },
})
