import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"

export async function checkAndTriggerThresholds(maladieId: string, communeId: string | null) {
  const seuils = await prisma.seuilAlerte.findMany({
    where: { maladieId, isActive: true },
    include: {
      maladie: { select: { nom: true } },
      wilaya: { select: { nom: true } },
      commune: { select: { nom: true } },
    },
  })

  if (seuils.length === 0) return

  let communeWilayadId: string | null = null
  if (communeId) {
    const commune = await prisma.commune.findUnique({
      where: { id: communeId },
      select: { wilayadId: true },
    })
    communeWilayadId = commune?.wilayadId ?? null
  }

  for (const seuil of seuils) {
    // Skip if this seuil doesn't apply to the current case location
    if (seuil.perimetre === "commune" && seuil.communeId && seuil.communeId !== communeId) continue
    if (seuil.perimetre === "wilaya" && seuil.wilayadId && seuil.wilayadId !== communeWilayadId) continue

    const since = new Date(Date.now() - seuil.periodejours * 24 * 60 * 60 * 1000)

    const baseWhere: Prisma.CasDeclareWhereInput = {
      maladieId,
      statut: { notIn: ["brouillon"] },
      createdAt: { gte: since },
    }

    let whereClause: Prisma.CasDeclareWhereInput = baseWhere

    if (seuil.perimetre === "commune" && seuil.communeId) {
      whereClause = { ...baseWhere, communeId: seuil.communeId }
    } else if (seuil.perimetre === "wilaya" && seuil.wilayadId) {
      const communesInWilaya = await prisma.commune.findMany({
        where: { wilayadId: seuil.wilayadId },
        select: { id: true },
      })
      whereClause = { ...baseWhere, communeId: { in: communesInWilaya.map(c => c.id) } }
    }

    const count = await prisma.casDeclare.count({ where: whereClause })
    if (count < seuil.seuilNombre) continue

    // Skip if an active alerte already exists for this maladie/scope recently
    const existing = await prisma.alerte.findFirst({
      where: {
        maladieId,
        communeId: seuil.perimetre === "commune" ? (seuil.communeId ?? null) : null,
        statut: "active",
        createdAt: { gte: since },
      },
    })
    if (existing) continue

    const perimetreLabel =
      seuil.perimetre === "national" ? "à l'échelle nationale" :
      seuil.perimetre === "wilaya" ? `dans la wilaya ${seuil.wilaya?.nom ?? ""}` :
      `dans la commune ${seuil.commune?.nom ?? ""}`

    const titre = `Seuil dépassé : ${seuil.maladie.nom}`
    const description = `${count} cas de ${seuil.maladie.nom} détectés ${perimetreLabel} sur les ${seuil.periodejours} derniers jours (seuil : ${seuil.seuilNombre} cas).`

    if (seuil.autoAlerte) {
      await prisma.alerte.create({
        data: {
          type: "seuil",
          titre,
          description,
          statut: "active",
          nombreCas: count,
          maladieId,
          communeId: seuil.perimetre === "commune" ? (seuil.communeId ?? null) : null,
        },
      })
    }

    if (seuil.autoNotification) {
      const users = await prisma.user.findMany({
        where: {
          isActive: true,
          userRoles: {
            some: {
              role: { name: { in: ["epidemiologiste", "admin"] } },
            },
          },
        },
        select: { id: true },
      })

      if (users.length > 0) {
        await prisma.notification.createMany({
          data: users.map(u => ({
            userId: u.id,
            type: "seuil_depasse",
            titre,
            message: description,
          })),
          skipDuplicates: true,
        })
      }
    }
  }
}
