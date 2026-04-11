import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const wilayadId = searchParams.get("wilayadId")
    const communes = await prisma.commune.findMany({
      where: wilayadId ? { wilayadId } : undefined,
      orderBy: { nom: "asc" },
      include: { wilaya: true },
    })
    return NextResponse.json(communes)
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

