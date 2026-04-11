import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const d = await prisma.protocoleDeclenchement.update({
    where: { id },
    data: body,
  })
  return NextResponse.json(d)
}
