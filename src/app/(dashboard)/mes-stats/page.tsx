import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { formatDate } from "@/utils/format-date"
import MesStatsClient from "./mes-stats-client"

export default async function MesStatsPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const userId = session.user.id
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [totalCas, casMois, casAnnee, casByStatut, casByMaladie, recentCas] = await Promise.all([
    prisma.casDeclare.count({ where: { medecinId: userId, statut: { not: "brouillon" } } }),
    prisma.casDeclare.count({ where: { medecinId: userId, statut: { not: "brouillon" }, createdAt: { gte: startOfMonth } } }),
    prisma.casDeclare.count({ where: { medecinId: userId, statut: { not: "brouillon" }, createdAt: { gte: startOfYear } } }),
    prisma.casDeclare.groupBy({
      by: ["statut"],
      where: { medecinId: userId, statut: { not: "brouillon" } },
      _count: true,
    }),
    prisma.casDeclare.groupBy({
      by: ["maladieId"],
      where: { medecinId: userId, statut: { not: "brouillon" } },
      _count: true,
      orderBy: { _count: { maladieId: "desc" } },
      take: 8,
    }),
    prisma.casDeclare.findMany({
      where: { medecinId: userId, statut: { not: "brouillon" }, createdAt: { gte: last30 } },
      include: { maladie: { select: { nom: true } }, patient: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ])

  // Resolve maladie names for grouped data
  const maladieIds = casByMaladie.map(m => m.maladieId).filter(Boolean) as string[]
  const maladies = await prisma.maladie.findMany({
    where: { id: { in: maladieIds } },
    select: { id: true, nom: true },
  })
  const maladieMap = Object.fromEntries(maladies.map(m => [m.id, m.nom]))

  // Monthly declaration trend (last 6 months)
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    return { month: d, label: d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }) }
  })
  const monthlyTrend = await Promise.all(
    months.map(async ({ month, label }) => {
      const end = new Date(month.getFullYear(), month.getMonth() + 1, 0)
      const count = await prisma.casDeclare.count({
        where: { medecinId: userId, statut: { not: "brouillon" }, createdAt: { gte: month, lte: end } },
      })
      return { label, count }
    })
  )

  const casDecedes = casByStatut.find(s => s.statut === "confirme")?._count ?? 0
  const cfr = totalCas > 0 ? ((casDecedes / totalCas) * 100).toFixed(1) : "0.0"

  return (
    <MesStatsClient
      stats={{
        totalCas,
        casMois,
        casAnnee,
        cfr,
        casByStatut: casByStatut.map(s => ({ statut: s.statut, count: s._count })),
        casByMaladie: casByMaladie.map(m => ({
          maladie: m.maladieId ? (maladieMap[m.maladieId] ?? "—") : "—",
          count: m._count,
        })),
        monthlyTrend,
        recentCas: recentCas.map(c => ({
          id: c.id,
          codeCas: c.codeCas,
          statut: c.statut,
          maladie: c.maladie?.nom ?? "—",
          patient: `${c.patient.firstName} ${c.patient.lastName}`,
          createdAt: formatDate(c.createdAt),
        })),
      }}
    />
  )
}
