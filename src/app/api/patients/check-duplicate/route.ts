import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const firstName = searchParams.get("firstName")?.trim().toLowerCase()
  const lastName = searchParams.get("lastName")?.trim().toLowerCase()
  const dateOfBirth = searchParams.get("dateOfBirth")

  if (!firstName || !lastName) {
    return NextResponse.json({ matches: [] })
  }

  // Find patients with matching name (case-insensitive)
  const patients = await prisma.patient.findMany({
    where: {
      AND: [
        { firstName: { contains: firstName, mode: "insensitive" } },
        { lastName: { contains: lastName, mode: "insensitive" } },
      ],
    },
    include: {
      cas: {
        include: { maladie: { select: { nom: true } } },
        orderBy: { createdAt: "desc" },
        take: 3,
      },
    },
    take: 5,
  })

  // If dateOfBirth provided, filter to within ±1 year
  let filtered = patients
  if (dateOfBirth) {
    const dob = new Date(dateOfBirth)
    filtered = patients.filter(p => {
      if (!p.dateOfBirth) return true
      const diff = Math.abs(new Date(p.dateOfBirth).getFullYear() - dob.getFullYear())
      return diff <= 1
    })
  }

  const matches = filtered.flatMap(p =>
    p.cas.map(c => ({
      id: c.id,
      codeCas: c.codeCas,
      statut: c.statut,
      maladie: c.maladie?.nom ?? "—",
    }))
  )

  return NextResponse.json({ matches })
}
