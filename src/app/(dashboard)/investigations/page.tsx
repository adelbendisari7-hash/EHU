"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Search, ClipboardList, Clock, CheckCircle2, Users, RefreshCw, AlertCircle, ExternalLink } from "lucide-react"
import { formatDate } from "@/utils/format-date"

interface Investigation {
  id: string
  statut: string
  dateDebut: string
  dateFin: string | null
  casId: string
  cas: {
    codeCas: string
    statut: string
    patient: { firstName: string; lastName: string }
    maladie: { nom: string } | null
    commune: { nom: string } | null
  }
  epidemiologiste: { firstName: string; lastName: string } | null
  contacts: { id: string }[]
}

const STATUT_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  en_cours:   { label: "En cours",   color: "#B45309", bg: "#FFFBEB" },
  terminee:   { label: "Terminée",   color: "#047857", bg: "#ECFDF5" },
  en_attente: { label: "En attente", color: "#4A5164", bg: "#F5F6F7" },
}

type Filtre = "toutes" | "en_cours" | "en_attente" | "terminee"

export default function InvestigationsPage() {
  const router = useRouter()
  const [investigations, setInvestigations] = useState<Investigation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [filtre, setFiltre] = useState<Filtre>("toutes")
  const [search, setSearch] = useState("")

  const fetchInvestigations = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch("/api/investigations")
      if (!res.ok) throw new Error()
      const data = await res.json()
      setInvestigations(data)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchInvestigations() }, [fetchInvestigations])

  const filtered = investigations.filter(inv => {
    if (filtre !== "toutes" && inv.statut !== filtre) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        inv.cas.patient.firstName.toLowerCase().includes(q) ||
        inv.cas.patient.lastName.toLowerCase().includes(q) ||
        inv.cas.codeCas.toLowerCase().includes(q) ||
        (inv.cas.maladie?.nom.toLowerCase().includes(q) ?? false)
      )
    }
    return true
  })

  const stats = {
    total: investigations.length,
    enCours: investigations.filter(i => i.statut === "en_cours").length,
    enAttente: investigations.filter(i => i.statut === "en_attente").length,
    terminees: investigations.filter(i => i.statut === "terminee").length,
    contacts: investigations.reduce((sum, i) => sum + i.contacts.length, 0),
  }

  const FILTRES: { key: Filtre; label: string; count: number }[] = [
    { key: "toutes",     label: "Toutes",     count: stats.total },
    { key: "en_cours",   label: "En cours",   count: stats.enCours },
    { key: "en_attente", label: "En attente", count: stats.enAttente },
    { key: "terminee",   label: "Terminées",  count: stats.terminees },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Investigations</h1>
          <p className="page-subtitle">Suivi des enquêtes épidémiologiques</p>
        </div>
        <button onClick={fetchInvestigations} className="btn btn-secondary btn-sm">
          <RefreshCw size={13} /> Actualiser
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { icon: ClipboardList, label: "Total",     value: stats.total,     color: "#1B4F8A", bg: "#EBF1FA" },
          { icon: Clock,         label: "En cours",  value: stats.enCours,   color: "#B45309", bg: "#FFFBEB" },
          { icon: CheckCircle2,  label: "Terminées", value: stats.terminees, color: "#047857", bg: "#ECFDF5" },
          { icon: Users,         label: "Contacts",  value: stats.contacts,  color: "#7C3AED", bg: "#F5F0FF" },
        ].map(c => (
          <div key={c.label} className="card p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: c.bg }}>
              <c.icon size={17} style={{ color: c.color }} />
            </div>
            <div>
              <p className="text-xl font-bold leading-none" style={{ color: c.color }}>{c.value}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          {FILTRES.map(f => (
            <button
              key={f.key}
              onClick={() => setFiltre(f.key)}
              className={`px-3 h-[30px] text-[12px] font-medium border-r border-gray-200 last:border-r-0 transition-all flex items-center gap-1.5 ${
                filtre === f.key ? "bg-[#1B4F8A] text-white" : "bg-white text-gray-500 hover:bg-gray-50"
              }`}
            >
              {f.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                filtre === f.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
              }`}>{f.count}</span>
            </button>
          ))}
        </div>
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Patient, code ou maladie..."
            className="input pl-8 h-[30px] text-[12px] min-w-[220px]"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="card p-10 text-center text-sm text-gray-400">Chargement des investigations...</div>
      ) : error ? (
        <div className="card p-10 text-center">
          <AlertCircle size={28} className="text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500 mb-3">Impossible de charger les données</p>
          <button onClick={fetchInvestigations} className="btn btn-secondary btn-sm"><RefreshCw size={12} /> Réessayer</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <ClipboardList size={36} className="text-gray-200 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-500 mb-1">
            {search || filtre !== "toutes" ? "Aucun résultat pour ce filtre" : "Aucune investigation enregistrée"}
          </p>
          <p className="text-xs text-gray-400">Les investigations sont créées depuis la fiche d&apos;un cas</p>
          {(search || filtre !== "toutes") && (
            <button onClick={() => { setSearch(""); setFiltre("toutes") }} className="btn btn-ghost btn-sm mt-3">
              Réinitialiser les filtres
            </button>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                {["Patient / Code", "Maladie", "Commune", "Épidémiologiste", "Contacts", "Ouverture", "Statut", ""].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv, i) => {
                const s = STATUT_CONFIG[inv.statut] ?? STATUT_CONFIG.en_attente
                return (
                  <tr
                    key={inv.id}
                    className={`border-b border-gray-50 hover:bg-blue-50/40 transition-colors cursor-pointer ${i % 2 === 1 ? "bg-gray-50/40" : ""}`}
                    onClick={() => router.push(`/declarations/${inv.casId}/investigation`)}
                  >
                    <td className="px-4 py-3">
                      <p className="text-[13px] font-semibold text-gray-800">
                        {inv.cas.patient.firstName} {inv.cas.patient.lastName}
                      </p>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">{inv.cas.codeCas}</p>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-gray-600">{inv.cas.maladie?.nom ?? "—"}</td>
                    <td className="px-4 py-3 text-[13px] text-gray-500">{inv.cas.commune?.nom ?? "—"}</td>
                    <td className="px-4 py-3 text-[13px] text-gray-500">
                      {inv.epidemiologiste
                        ? `${inv.epidemiologiste.firstName} ${inv.epidemiologiste.lastName}`
                        : <span className="text-gray-300 text-[12px]">Non assigné</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-[12px] font-medium" style={{ color: inv.contacts.length > 0 ? "#7C3AED" : "#D1D5DB" }}>
                        <Users size={12} /> {inv.contacts.length}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-gray-400 whitespace-nowrap">{formatDate(inv.dateDebut)}</td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] font-medium px-2 py-1 rounded-full whitespace-nowrap"
                        style={{ color: s.color, backgroundColor: s.bg }}>
                        {s.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/declarations/${inv.casId}/investigation`}
                        onClick={e => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-[#1B4F8A] hover:underline"
                      >
                        Ouvrir <ExternalLink size={10} />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/50">
            <p className="text-[11px] text-gray-400">
              {filtered.length} investigation{filtered.length !== 1 ? "s" : ""} affiché{filtered.length !== 1 ? "es" : "e"}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
