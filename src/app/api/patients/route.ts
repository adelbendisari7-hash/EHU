import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { generatePatientId } from "@/utils/generate-id"

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get("search") ?? ""

  const patients = await prisma.patient.findMany({
    where: search ? {
      OR: [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { identifiant: { contains: search } },
      ],
    } : undefined,
    take: 20,
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(patients)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  try {
    const body = await req.json()
    const patient = await prisma.patient.create({
      data: {
        identifiant: generatePatientId(),
        firstName: body.firstName,
        lastName: body.lastName,
        dateOfBirth: new Date(body.dateOfBirth),
        sex: body.sex,
        address: body.address,
        communeId: body.communeId || null,
        phone: body.phone || null,
      },
    })
    return NextResponse.json(patient, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Erreur création patient" }, { status: 500 })
  }
}

