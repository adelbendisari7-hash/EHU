"use client"

import { useState, useEffect, useCallback } from "react"
import { Activity, Search, ChevronLeft, ChevronRight, Filter, RefreshCw } from "lucide-react"

interface Patient {
  codeCas: string
  patient: {
    identifiant: string
    nom: string
    prenom: string
    dateNaissance: string
    age: number
    sexe: string
    communeResidence: string
    wilayaResidence: string
  }
  mdo: {
    maladie: string
    codeCim10: string
    categorie: string
    dateDiagnostic: string | null
    statut: string
  }
  hospitalisation: {
    dateAdmission: string | null
    service: string
  }
  evolution: string | null
  dateDeces: string | null
  dateDeclaration: string
}

interface ApiResponse {
  total: number
  page: number
  limit: number
  pages: number
  patients: Patient[]
}

const STATUT_BADGE: Record<string, { label: string; bg: string; text: string }> = {
  confirme: { label: "Confirmé", bg: "#D1FAE5", text: "#065F46" },
  suspect: { label: "Suspect", bg: "#FEF3C7", text: "#92400E" },
  brouillon: { label: "Brouillon", bg: "#F3F4F6", text: "#374151" },
}

export default function UistiMorbiditePage() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [dateDebut, setDateDebut] = useState("")
  const [dateFin, setDateFin] = useState("")
  const [statut, setStatut] = useState("")
  const [search, setSearch] = useState("")

  const fetchData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: "20" })
    if (dateDebut) params.set("dateDebut", dateDebut)
    if (dateFin) params.set("dateFin", dateFin)
    if (statut) params.set("statut", statut)
    const res = await fetch(`/api/uisti/patients?${params}`)
    if (res.ok) setData(await res.json())
    setLoading(false)
  }, [page, dateDebut, dateFin, statut])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = data?.patients.filter(p =>
    !search || [p.patient.nom, p.patient.prenom, p.codeCas, p.mdo.maladie].some(v =>
      v.toLowerCase().includes(search.toLowerCase())
    )
  ) ?? []

  const sexeLabel = (s: string) => s === "homme" ? "M" : s === "femme" ? "F" : s

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#EFF6FF" }}>
              <Activity size={16} style={{ color: "#1B4F8A" }} />
            </div>
            <h1 className="text-xl font-semibold" style={{ color: "#111827" }}>Morbidité Hospitalière</h1>
          </div>
          <p className="text-sm" style={{ color: "#6B7280" }}>
            Section 1 — Données MDO partagées avec l&apos;unité UISTI
          </p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition-colors hover:bg-gray-50" style={{ color: "#374151", borderColor: "#E5E7EB" }}>
          <RefreshCw size={14} />
          Actualiser
        </button>
      </div>

      {/* Shared fields reference card */}
      <div className="rounded-xl border p-4" style={{ backgroundColor: "#F0F9FF", borderColor: "#BAE6FD" }}>
        <p className="text-sm font-medium mb-2" style={{ color: "#0369A1" }}>Données partagées automatiquement depuis le module MDO :</p>
        <div className="flex flex-wrap gap-2">
          {["Nom / Prénom", "Date de naissance / Âge", "Sexe", "Commune de résidence", "Date d'admission et service", "Pathologie / MDO déclarée / CIM10", "Date de diagnostic", "Statut déclaration MDO"].map(f => (
            <span key={f} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: "#E0F2FE", color: "#0369A1" }}>
              {f}
            </span>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9CA3AF" }} />
          <input
            type="text"
            placeholder="Rechercher patient, code cas, maladie..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ borderColor: "#E5E7EB", color: "#374151" }}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} style={{ color: "#6B7280" }} />
          <input type="date" value={dateDebut} onChange={e => { setDateDebut(e.target.value); setPage(1) }} className="px-3 py-2 text-sm border rounded-lg focus:outline-none" style={{ borderColor: "#E5E7EB", color: "#374151" }} />
          <span className="text-sm" style={{ color: "#6B7280" }}>→</span>
          <input type="date" value={dateFin} onChange={e => { setDateFin(e.target.value); setPage(1) }} className="px-3 py-2 text-sm border rounded-lg focus:outline-none" style={{ borderColor: "#E5E7EB", color: "#374151" }} />
        </div>
        <select value={statut} onChange={e => { setStatut(e.target.value); setPage(1) }} className="px-3 py-2 text-sm border rounded-lg focus:outline-none" style={{ borderColor: "#E5E7EB", color: "#374151" }}>
          <option value="">Tous les statuts</option>
          <option value="confirme">Confirmé</option>
          <option value="suspect">Suspect</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
        <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: "#F3F4F6", backgroundColor: "#FAFAFA" }}>
          <span className="text-sm font-medium" style={{ color: "#374151" }}>
            {loading ? "Chargement…" : `${data?.total ?? 0} patients MDO déclarés`}
          </span>
          {data && data.pages > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: "#9CA3AF" }}>Page {page} / {data.pages}</span>
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-1 rounded disabled:opacity-40 hover:bg-gray-100"><ChevronLeft size={14} /></button>
              <button disabled={page >= data.pages} onClick={() => setPage(p => p + 1)} className="p-1 rounded disabled:opacity-40 hover:bg-gray-100"><ChevronRight size={14} /></button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16" style={{ color: "#9CA3AF" }}>
            <Activity size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Aucun patient MDO trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
                  {["Code Cas", "Nom / Prénom", "Naissance / Âge", "Sexe", "Commune", "Pathologie MDO", "CIM-10", "Date Diagnostic", "Date Admission", "Service", "Statut MDO"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap" style={{ color: "#6B7280" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "#F3F4F6" }}>
                {filtered.map(p => {
                  const badge = STATUT_BADGE[p.mdo.statut] ?? { label: p.mdo.statut, bg: "#F3F4F6", text: "#374151" }
                  return (
                    <tr key={p.codeCas} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-medium" style={{ color: "#1B4F8A" }}>{p.codeCas}</td>
                      <td className="px-4 py-3 font-medium whitespace-nowrap" style={{ color: "#111827" }}>
                        {p.patient.nom} {p.patient.prenom}
                        <div className="text-xs font-normal mt-0.5" style={{ color: "#9CA3AF" }}>{p.patient.identifiant}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap" style={{ color: "#374151" }}>
                        {p.patient.dateNaissance}
                        <div className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>{p.patient.age} ans</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: p.patient.sexe === "homme" ? "#EFF6FF" : "#FDF2F8", color: p.patient.sexe === "homme" ? "#1D4ED8" : "#9D174D" }}>
                          {sexeLabel(p.patient.sexe)}
                        </span>
                      </td>
                      <td className="px-4 py-3" style={{ color: "#374151" }}>
                        {p.patient.communeResidence}
                        <div className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>{p.patient.wilayaResidence}</div>
                      </td>
                      <td className="px-4 py-3 max-w-[180px]" style={{ color: "#374151" }}>
                        <span className="line-clamp-2 text-xs leading-relaxed">{p.mdo.maladie}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: "#6B7280" }}>{p.mdo.codeCim10}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs" style={{ color: "#374151" }}>{p.mdo.dateDiagnostic ?? "—"}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs" style={{ color: "#374151" }}>{p.hospitalisation.dateAdmission ?? "—"}</td>
                      <td className="px-4 py-3 text-xs max-w-[140px]" style={{ color: "#374151" }}>
                        <span className="line-clamp-1">{p.hospitalisation.service}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: badge.bg, color: badge.text }}>
                          {badge.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
