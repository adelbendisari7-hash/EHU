import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import bcrypt from "bcryptjs"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== "admin") return NextResponse.json({ error: "Admin requis" }, { status: 403 })

  const { id } = await params
  const body = await req.json() as {
    isActive?: boolean; roleSlug?: string; roleIds?: string[];
    firstName?: string; lastName?: string; password?: string
  }

  const data: Record<string, unknown> = {}
  if (body.isActive !== undefined) data.isActive = body.isActive
  if (body.firstName) data.firstName = body.firstName
  if (body.lastName) data.lastName = body.lastName
  if (body.password) data.passwordHash = await bcrypt.hash(body.password, 12)

  const user = await prisma.user.update({
    where: { id },
    data,
    include: {
      etablissement: { select: { nom: true } },
      userRoles: { include: { role: { select: { id: true, name: true, slug: true, color: true } } } },
    },
  })

  // Update roles if provided
  if (body.roleIds) {
    await prisma.userRole.deleteMany({ where: { userId: id } })
    for (const roleId of body.roleIds) {
      await prisma.userRole.create({ data: { userId: id, roleId, assignedBy: session.user.id } })
    }
  } else if (body.roleSlug) {
    const role = await prisma.role.findUnique({ where: { slug: body.roleSlug } })
    if (role) {
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: id, roleId: role.id } },
        update: {},
        create: { userId: id, roleId: role.id, assignedBy: session.user.id },
      })
    }
  }

  return NextResponse.json(user)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== "admin") return NextResponse.json({ error: "Admin requis" }, { status: 403 })

  const { id } = await params
  await prisma.user.update({ where: { id }, data: { isActive: false } })
  return NextResponse.json({ success: true })
}
