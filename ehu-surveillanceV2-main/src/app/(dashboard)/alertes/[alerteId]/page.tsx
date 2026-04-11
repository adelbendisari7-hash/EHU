import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { formatDate, formatDateTime } from "@/utils/format-date"

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  epidemique: { label: "Épidémique", color: "#B91C1C", bg: "#FEF2F2", border: "#FECACA" },
  seuil: { label: "Seuil atteint", color: "#B45309", bg: "#FFFBEB", border: "#FDE68A" },
  information: { label: "Information", color: "#1B4F8A", bg: "#EEF4FF", border: "#C5DAFC" },
}

export default async function AlerteDetailPage({ params }: { params: Promise<{ alerteId: string }> }) {
  const { alerteId } = await params

  const alerte = await prisma.alerte.findUnique({
    where: { id: alerteId },
    include: {
      maladie: true,
      commune: true,
      auteur: { select: { firstName: true, lastName: true } },
    },
  })

  if (!alerte) notFound()

  const typeConf = TYPE_CONFIG[alerte.type] ?? TYPE_CONFIG.information

  // Get recent cases for this disease
  const recentCas = alerte.maladieId ? await prisma.casDeclare.findMany({
    where: { maladieId: alerte.maladieId },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { patient: { select: { firstName: true, lastName: true } }, commune: { select: { nom: true } } },
  }) : []

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/alertes" className="text-sm text-gray-400 hover:text-gray-600">← Alertes</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-semibold text-gray-800">Détail de l&apos;Alerte</h1>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Main content */}
        <div className="col-span-2 space-y-4">
          {/* Alert card */}
          <div className="bg-white rounded-xl border shadow-sm p-5" style={{ borderColor: typeConf.border }}>
            <div className="flex items-start gap-3 mb-4">
              <span className="px-2 py-1 rounded-full text-xs font-semibold border" style={{ color: typeConf.color, backgroundColor: typeConf.bg, borderColor: typeConf.border }}>
                {typeConf.label}
              </span>
              <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: alerte.statut === "active" ? "#FEF2F2" : "#ECFDF5", color: alerte.statut === "active" ? "#B91C1C" : "#047857" }}>
                {alerte.statut === "active" ? "Active" : alerte.statut === "resolue" ? "Résolue" : "Archivée"}
              </span>
            </div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">{alerte.titre}</h2>
            <p className="text-sm text-gray-600">{alerte.description}</p>
          </div>

          {/* Details grid */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-sm font-semibold text-gray-700 mb-4">Informations</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Maladie", value: alerte.maladie?.nom ?? "—" },
                { label: "Commune", value: alerte.commune?.nom ?? "—" },
                { label: "Nombre de cas", value: String(alerte.nombreCas) },
                { label: "Créée par", value: alerte.auteur ? `${alerte.auteur.firstName} ${alerte.auteur.lastName}` : "Système" },
                { label: "Date création", value: formatDateTime(alerte.createdAt) },
                { label: "Date résolution", value: alerte.resolvedAt ? formatDateTime(alerte.resolvedAt) : "—" },
              ].map(item => (
                <div key={item.label} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{item.label}</p>
                  <p className="text-sm font-medium text-gray-800">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent cases */}
          {recentCas.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <p className="text-sm font-semibold text-gray-700 mb-3">Cas Récents — {alerte.maladie?.nom}</p>
              <div className="space-y-2">
                {recentCas.map(c => (
                  <div key={c.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-gray-700">{c.patient.firstName} {c.patient.lastName}</span>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span>{c.commune?.nom ?? "—"}</span>
                      <span>{formatDate(c.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar — Recommandations */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">Recommandations</p>
            <ul className="space-y-2">
              {([
                "Renforcer la surveillance dans la zone",
                "Informer les établissements de santé",
                "Mettre en place des mesures de contrôle",
                "Suivre l'évolution quotidiennement",
                "Préparer les ressources nécessaires",
              ]).map((rec, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                  <span className="w-4 h-4 rounded-full flex items-center justify-center text-white text-xs shrink-0 mt-0.5" style={{ backgroundColor: "#1B4F8A", fontSize: "9px" }}>{i + 1}</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">Actions</p>
            <div className="space-y-2">
              <Link href="/alertes" className="block w-full py-2 px-3 rounded-lg border border-gray-200 text-sm text-center text-gray-600 hover:bg-gray-50 transition-colors">
                ← Retour aux alertes
              </Link>
              {alerte.maladieId && (
                <Link href={`/declarations?maladieId=${alerte.maladieId}`} className="block w-full py-2 px-3 rounded-lg text-sm text-center text-white transition-colors" style={{ backgroundColor: "#1B4F8A" }}>
                  Voir les cas →
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
