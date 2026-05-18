import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  color: z.string().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ roleId: string }> }) {
  const session = await auth()
  if (!session || !session.user.permissions?.includes("roles.manage")) {
    return NextResponse.json({ error: "Permission refusée" }, { status: 403 })
  }
  const { roleId } = await params
  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const role = await prisma.role.update({
    where: { id: roleId },
    data: parsed.data,
  })
  return NextResponse.json(role)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ roleId: string }> }) {
  const session = await auth()
  if (!session || !session.user.permissions?.includes("roles.manage")) {
    return NextResponse.json({ error: "Permission refusée" }, { status: 403 })
  }
  const { roleId } = await params

  const role = await prisma.role.findUnique({ where: { id: roleId } })
  if (!role) return NextResponse.json({ error: "Rôle introuvable" }, { status: 404 })
  if (role.isSystem) return NextResponse.json({ error: "Impossible de supprimer un rôle système" }, { status: 400 })

  await prisma.role.delete({ where: { id: roleId } })
  return NextResponse.json({ success: true })
}
