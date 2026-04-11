import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const permissions = await prisma.permission.findMany({ orderBy: [{ module: "asc" }, { name: "asc" }] })

  // Group by module
  const grouped: Record<string, typeof permissions> = {}
  for (const p of permissions) {
    if (!grouped[p.module]) grouped[p.module] = []
    grouped[p.module].push(p)
  }

  return NextResponse.json({ permissions, grouped })
}

