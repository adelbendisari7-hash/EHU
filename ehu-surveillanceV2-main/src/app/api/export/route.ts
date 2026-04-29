import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  if (!["epidemiologiste", "admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const format = searchParams.get("format") ?? "json"
  const type = searchParams.get("type") ?? "cas"
  const days = parseInt(searchParams.get("days") ?? "30")

  const since = new Date()
  since.setDate(since.getDate() - days)

  if (type === "cas") {
    const cas = await prisma.casDeclare.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      include: {
        patient: { select: { firstName: true, lastName: true, dateOfBirth: true, sex: true } },
        maladie: { select: { nom: true, codeCim10: true } },
        commune: { select: { nom: true } },
        medecin: { select: { firstName: true, lastName: true } },
      },
    })

    const rows = cas.map(c => ({
      "Code Cas": c.codeCas,
      "Patient": `${c.patient.firstName} ${c.patient.lastName}`,
      "Sexe": c.patient.sex,
      "Maladie": c.maladie?.nom ?? "—",
      "Code CIM-10": c.maladie?.codeCim10 ?? "—",
      "Commune": c.commune?.nom ?? "",
      "Statut": c.statut,
      "Mode Confirmation": c.modeConfirmation,
      "Service": c.service,
      "Date Déclaration": new Date(c.createdAt).toLocaleDateString("fr-FR"),
    }))

    if (format === "csv") {
      const headers = Object.keys(rows[0] ?? {}).join(",")
      const lines = rows.map(r => Object.values(r).map(v => `"${v}"`).join(","))
      const csv = [headers, ...lines].join("\n")
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="cas-${new Date().toISOString().slice(0,10)}.csv"`,
        },
      })
    }

    return NextResponse.json(rows)
  }

  return NextResponse.json({ error: "Type non supporté" }, { status: 400 })
}

