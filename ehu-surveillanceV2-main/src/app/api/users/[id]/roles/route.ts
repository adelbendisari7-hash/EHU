import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || !session.user.permissions?.includes("users.edit")) {
    return NextResponse.json({ error: "Permission refusée" }, { status: 403 })
  }
  const { id } = await params
  const { roleId }: { roleId: string } = await req.json()

  const userRole = await prisma.userRole.upsert({
    where: { userId_roleId: { userId: id, roleId } },
    update: {},
    create: { userId: id, roleId, assignedBy: session.user.id },
  })
  return NextResponse.json(userRole, { status: 201 })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || !session.user.permissions?.includes("users.edit")) {
    return NextResponse.json({ error: "Permission refusée" }, { status: 403 })
  }
  const { id } = await params
  const { roleId }: { roleId: string } = await req.json()

  await prisma.userRole.delete({ where: { userId_roleId: { userId: id, roleId } } })
  return NextResponse.json({ success: true })
}
