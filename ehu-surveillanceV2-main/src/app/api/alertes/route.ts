import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const statut = searchParams.get("statut") ?? ""

  const alertes = await prisma.alerte.findMany({
    where: statut ? { statut: statut as "active" | "resolue" | "archivee" } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      maladie: { select: { nom: true } },
      commune: { select: { nom: true } },
      auteur: { select: { firstName: true, lastName: true } },
    },
  })
  return NextResponse.json(alertes)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  if (!["epidemiologiste", "admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }

  const body = await req.json()

  const alerte = await prisma.alerte.create({
    data: {
      type: body.type,
      titre: body.titre,
      description: body.description,
      maladieId: body.maladieId || null,
      communeId: body.communeId || null,
      nombreCas: body.nombreCas || 0,
      recommandations: body.recommandations || null,
      statut: "active",
      createdBy: session.user.id,
    },
    include: {
      maladie: { select: { nom: true } },
      commune: { select: { nom: true } },
    },
  })

  // Create notifications for all epidemiologistes and admins
  const users = await prisma.user.findMany({
    where: { isActive: true, userRoles: { some: { role: { slug: { in: ["epidemiologiste", "admin"] } } } } },
    select: { id: true },
  })

  await prisma.notification.createMany({
    data: users.map(u => ({
      userId: u.id,
      type: "alerte",
      titre: `Nouvelle alerte : ${alerte.titre}`,
      message: alerte.description,
    })),
  })

  // Send email notifications (non-blocking)
  const { sendAlertEmail } = await import("@/lib/email")
  const userEmails = await prisma.user.findMany({
    where: { isActive: true, userRoles: { some: { role: { slug: { in: ["epidemiologiste", "admin"] } } } } },
    select: { email: true },
  })
  sendAlertEmail(
    userEmails.map(u => u.email),
    alerte.titre,
    alerte.description,
    alerte.type
  ).catch(console.error)

  return NextResponse.json(alerte, { status: 201 })
}

