import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { id } = await params
  const contacts = await prisma.contact.findMany({
    where: { investigationId: id },
    orderBy: { createdAt: "asc" },
  })
  return NextResponse.json(contacts)
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const contact = await prisma.contact.create({
    data: {
      investigationId: id,
      nom: body.nom,
      telephone: body.telephone,
      relation: body.relation || null,
      statutSuivi: "a_contacter",
      notes: body.notes || null,
    },
  })
  return NextResponse.json(contact, { status: 201 })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  await params // id not needed; contactId is in body
  const body = await req.json()

  const contact = await prisma.contact.update({
    where: { id: body.contactId },
    data: {
      statutSuivi: body.statutSuivi,
      notes: body.notes,
    },
  })
  return NextResponse.json(contact)
}
