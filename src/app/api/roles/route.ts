import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const roles = await prisma.role.findMany({
    where: { isActive: true },
    include: {
      rolePermissions: { include: { permission: true } },
      _count: { select: { userRoles: true } },
    },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json(roles.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    description: r.description,
    color: r.color,
    isSystem: r.isSystem,
    isActive: r.isActive,
    userCount: r._count.userRoles,
    permissions: r.rolePermissions.map((rp) => rp.permission),
  })))
}

const createRoleSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9_]+$/),
  description: z.string().optional(),
  color: z.string().optional(),
  permissionIds: z.array(z.string()).optional(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || !session.user.permissions?.includes("roles.manage")) {
    return NextResponse.json({ error: "Permission refusée" }, { status: 403 })
  }

  const body = await req.json()
  const parsed = createRoleSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { name, slug, description, color, permissionIds } = parsed.data

  const role = await prisma.role.create({
    data: {
      name, slug,
      description: description ?? null,
      color: color ?? "#1B4F8A",
      isSystem: false,
      rolePermissions: permissionIds?.length
        ? { create: permissionIds.map((id) => ({ permissionId: id })) }
        : undefined,
    },
    include: { rolePermissions: { include: { permission: true } } },
  })

  return NextResponse.json(role, { status: 201 })
}

