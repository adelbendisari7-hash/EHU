import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const rows = await prisma.casDeclare.groupBy({
    by: ["service"],
    where: { service: { not: null } },
    orderBy: { service: "asc" },
  })

  const services = rows
    .map(r => r.service)
    .filter((s): s is string => !!s && s.trim() !== "")

  return NextResponse.json({ services })
}
