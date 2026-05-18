import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { saveUploadedFile, deleteUploadedFile } from "@/lib/storage"
import { writeAudit, getIp } from "@/lib/audit"

// POST /api/upload — upload a file and create a Fichier record
export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const casId = formData.get("casId") as string | null
    const type = (formData.get("type") as string | null) ?? "declaration"

    if (!file) return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 })
    if (!casId) return NextResponse.json({ error: "casId manquant" }, { status: 400 })

    // Verify case exists and user has access
    const cas = await prisma.casDeclare.findUnique({ where: { id: casId }, select: { id: true, medecinId: true } })
    if (!cas) return NextResponse.json({ error: "Déclaration introuvable" }, { status: 404 })

    const { url, filename } = await saveUploadedFile(file)

    const fichier = await prisma.fichier.create({
      data: {
        casId,
        type,
        url,
        filename,
        uploadedBy: session.user.id,
      },
    })

    await writeAudit({
      userId: session.user.id,
      action: "CREATE",
      entity: "Fichier",
      entityId: fichier.id,
      details: { casId, type, filename },
      ip: getIp(req),
    })

    return NextResponse.json(fichier, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur lors de l'upload"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE /api/upload?id=<fichierId> — delete a file
export async function DELETE(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id manquant" }, { status: 400 })

  const fichier = await prisma.fichier.findUnique({ where: { id } })
  if (!fichier) return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 })

  await deleteUploadedFile(fichier.url)
  await prisma.fichier.delete({ where: { id } })

  await writeAudit({
    userId: session.user.id,
    action: "DELETE",
    entity: "Fichier",
    entityId: id,
    details: { filename: fichier.filename },
    ip: getIp(req),
  })

  return NextResponse.json({ success: true })
}
