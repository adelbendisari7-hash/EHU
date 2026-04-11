import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ roleId: string }> }) {
  const session = await auth()
  if (!session || !session.user.permissions?.includes("roles.manage")) {
    return NextResponse.json({ error: "Permission refusée" }, { status: 403 })
  }
  const { roleId } = await params
  const { permissionIds }: { permissionIds: string[] } = await req.json()

  // Replace all permissions
  await prisma.rolePermission.deleteMany({ where: { roleId } })
  if (permissionIds.length > 0) {
    await prisma.rolePermission.createMany({
      data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
      skipDuplicates: true,
    })
  }

  const role = await prisma.role.findUnique({
    where: { id: roleId },
    include: { rolePermissions: { include: { permission: true } } },
  })
  return NextResponse.json(role)
}
