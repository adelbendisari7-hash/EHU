"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { FileBarChart, Plus, Eye, AlertCircle, RefreshCw } from "lucide-react"
import { RapportListSkeleton } from "@/components/shared/skeleton"

interface Rapport {
  id: string
  type: string
  titre: string
  dateDebut: string
  dateFin: string
  statut: string
  generePar: string
  createdAt: string
}

const TYPE_LABELS: Record<string, string> = {
  mensuel: "Mensuel", trimestriel: "Trimestriel", semestriel: "Semestriel",
  annuel: "Annuel", personnalise: "Personnalisé",
}

const TYPE_COLORS: Record<string, string> = {
  mensuel: "#1B4F8A", trimestriel: "#7C3AED", semestriel: "#0891B2",
  annuel: "#B45309", personnalise: "#374151",
}

export default function RapportsPage() {
  const [rapports, setRapports] = useState<Rapport[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const [filter, setFilter] = useState("")

  const fetchRapports = async () => {
    setLoading(true)
    setFetchError(false)
    try {
      const url = filter ? `/api/rapports?type=${filter}` : "/api/rapports"
      const res = await fetch(url)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setRapports(data)
    } catch {
      setFetchError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void fetchRapports() }, [filter]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Rapports Épidémiologiques</h1>
          <p className="text-sm text-gray-500 mt-1">Rapports périodiques et personnalisés</p>
        </div>
        <Link
          href="/rapports/generate"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ backgroundColor: "#1B4F8A" }}
        >
          <Plus size={16} />
          Générer un Rapport
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5">
        {["", "mensuel", "trimestriel", "semestriel", "annuel", "personnalise"].map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === t ? "text-white" : "border border-gray-200 text-gray-500 hover:bg-gray-50"}`}
            style={filter === t ? { backgroundColor: TYPE_COLORS[t] ?? "#1B4F8A" } : {}}
          >
            {t === "" ? "Tous" : TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {loading ? (
        <RapportListSkeleton />
      ) : fetchError ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <AlertCircle size={36} className="text-red-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium mb-1">Erreur de chargement</p>
          <p className="text-sm text-gray-400 mb-4">Impossible de récupérer les rapports</p>
          <button onClick={fetchRapports} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
            <RefreshCw size={15} /> Réessayer
          </button>
        </div>
      ) : rapports.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <FileBarChart size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">Aucun rapport disponible</p>
          <p className="text-gray-400 text-sm mt-1">Générez votre premier rapport épidémiologique</p>
          <Link
            href="/rapports/generate"
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-white"
            style={{ backgroundColor: "#1B4F8A" }}
          >
            <Plus size={15} /> Générer un rapport
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {rapports.map(r => (
            <div key={r.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center justify-between card-hover">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: (TYPE_COLORS[r.type] ?? "#1B4F8A") + "18" }}>
                  <FileBarChart size={18} style={{ color: TYPE_COLORS[r.type] ?? "#1B4F8A" }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{r.titre}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(r.dateDebut).toLocaleDateString("fr-FR")} → {new Date(r.dateFin).toLocaleDateString("fr-FR")}
                    <span className="mx-2">•</span>
                    {r.generePar === "systeme" ? "Auto-généré" : "Manuel"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-medium px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: (TYPE_COLORS[r.type] ?? "#1B4F8A") + "15", color: TYPE_COLORS[r.type] ?? "#1B4F8A" }}
                >
                  {TYPE_LABELS[r.type] ?? r.type}
                </span>
                <Link
                  href={`/rapports/${r.id}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50"
                >
                  <Eye size={13} /> Voir
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
