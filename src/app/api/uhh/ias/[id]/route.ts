import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// PATCH /api/uhh/ias/[id]
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const perms: string[] = session.user.permissions ?? []
  if (!perms.includes("uhh.ias.edit") && session.user.role !== "admin") {
    return NextResponse.json({ error: "Accès réservé à l'UHH" }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()

  const existing = await prisma.infectionIAS.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: "IAS introuvable" }, { status: 404 })

  const updated = await prisma.infectionIAS.update({
    where: { id },
    data: {
      typeIAS: body.typeIAS ?? existing.typeIAS,
      serviceId: body.serviceId ?? existing.serviceId,
      germeId: body.germeId !== undefined ? (body.germeId || null) : existing.germeId,
      isBMR: body.isBMR ?? existing.isBMR,
      dateDetection: body.dateDetection ? new Date(body.dateDetection) : existing.dateDetection,
      dateHospitalisation: body.dateHospitalisation !== undefined
        ? (body.dateHospitalisation ? new Date(body.dateHospitalisation) : null)
        : existing.dateHospitalisation,
      agePatient: body.agePatient !== undefined ? (body.agePatient ? parseInt(body.agePatient) : null) : existing.agePatient,
      sexePatient: body.sexePatient !== undefined ? (body.sexePatient || null) : existing.sexePatient,
      antibiogramme: body.antibiogramme !== undefined ? (body.antibiogramme || null) : existing.antibiogramme,
      notes: body.notes !== undefined ? (body.notes || null) : existing.notes,
      statut: body.statut ?? existing.statut,
    },
    include: {
      service: { select: { nom: true } },
      germe: { select: { nom: true } },
    },
  })

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "UPDATE",
      entity: "InfectionIAS",
      entityId: id,
      details: body,
    },
  })

  return NextResponse.json(updated)
}

// DELETE /api/uhh/ias/[id]
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const perms: string[] = session.user.permissions ?? []
  if (!perms.includes("uhh.ias.edit") && session.user.role !== "admin") {
    return NextResponse.json({ error: "Accès réservé à l'UHH" }, { status: 403 })
  }

  const { id } = await params
  const existing = await prisma.infectionIAS.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: "IAS introuvable" }, { status: 404 })

  await prisma.infectionIAS.delete({ where: { id } })

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "DELETE",
      entity: "InfectionIAS",
      entityId: id,
    },
  })

  return NextResponse.json({ success: true })
}
