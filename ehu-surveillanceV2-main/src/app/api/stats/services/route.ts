import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const rows = await prisma.casDeclare.groupBy({
    by: ["serviceDeclarant"],
    where: { serviceDeclarant: { not: null } },
  })

  const services = rows
    .map(r => r.serviceDeclarant!.trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "fr"))

  return NextResponse.json(services)
}
