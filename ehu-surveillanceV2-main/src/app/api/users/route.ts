import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import bcrypt from "bcryptjs"
export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== "admin") return NextResponse.json({ error: "Admin requis" }, { status: 403 })

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      etablissement: { select: { nom: true } },
      wilaya: { select: { nom: true } },
      userRoles: { include: { role: { select: { id: true, name: true, slug: true, color: true } } } },
    },
  })
  return NextResponse.json(users)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== "admin") return NextResponse.json({ error: "Admin requis" }, { status: 403 })

  const body = await req.json() as {
    email: string; password: string; firstName: string; lastName: string;
    roleSlug?: string; roleIds?: string[];
    etablissementId?: string; wilayadId?: string
  }

  const existing = await prisma.user.findUnique({ where: { email: body.email } })
  if (existing) return NextResponse.json({ error: "Email déjà utilisé" }, { status: 400 })

  const passwordHash = await bcrypt.hash(body.password, 12)

  const user = await prisma.user.create({
    data: {
      email: body.email,
      passwordHash,
      firstName: body.firstName,
      lastName: body.lastName,
      etablissementId: body.etablissementId || null,
      wilayadId: body.wilayadId || null,
      isActive: true,
    },
    include: {
      etablissement: { select: { nom: true } },
      wilaya: { select: { nom: true } },
    },
  })

  // Assign role(s)
  const roleIds: string[] = body.roleIds ?? []
  if (body.roleSlug && roleIds.length === 0) {
    const role = await prisma.role.findUnique({ where: { slug: body.roleSlug } })
    if (role) roleIds.push(role.id)
  }
  for (const roleId of roleIds) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId } },
      update: {},
      create: { userId: user.id, roleId, assignedBy: session.user.id },
    })
  }

  return NextResponse.json(user, { status: 201 })
}

