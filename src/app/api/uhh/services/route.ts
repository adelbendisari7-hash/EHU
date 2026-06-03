import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET /api/uhh/services — liste des services hospitaliers pour les formulaires UHH
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const perms: string[] = session.user.permissions ?? []
  const hasAccess = perms.some(p => p.startsWith("uhh.")) || session.user.role === "admin"
  if (!hasAccess) return NextResponse.json({ error: "Accès réservé à l'UHH" }, { status: 403 })

  const services = await prisma.service.findMany({
    where: { isActive: true },
    orderBy: { nom: "asc" },
    select: { id: true, nom: true, codeService: true },
  })

  return NextResponse.json({ services })
}
