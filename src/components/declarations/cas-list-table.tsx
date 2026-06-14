"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Eye, Pencil, Trash2, ChevronLeft, ChevronRight, AlertCircle, RefreshCw, Search, ChevronDown, ChevronUp, AlertTriangle, FileSpreadsheet, CheckSquare } from "lucide-react"
import CasStatusBadge from "./cas-status-badge"
import { formatDate } from "@/utils/format-date"
import { TableSkeleton } from "@/components/shared/skeleton"
import { toast } from "sonner"
import { cn } from "@/utils/cn"
import { SERVICES_EHU } from "@/constants/services"
import type { CasStatut } from "@/types"

interface MaladieRef { id: string; nom: string; groupeEpidemiologique?: string | null }

interface Cas {
  id: string
  codeCas: string
  statut: CasStatut
  service: string | null
  serviceDeclarant: string | null
  observation: string | null
  createdAt: string
  patient: { firstName: string; lastName: string }
  maladie: { nom: string } | null
  commune: { nom: string } | null
  medecin: { firstName: string; lastName: string } | null
  etablissement: { nom: string } | null
}

interface CasResponse {
  cas: Cas[]
  total: number
  page: number
  totalPages: number
}

interface UistiCas {
  id: string
  codeCas: string
  statut: CasStatut
  serviceDeclarant: string | null
  service: string | null
  dateDeces: string | null
  donneesSpecifiques: { maladieSuspectee?: string; wilaya?: string } | null
  createdAt: string
  patient: { firstName: string; lastName: string }
  maladie: { nom: string } | null
}

const STATUTS = ["", "suspect", "confirme", "brouillon"]
const STATUT_LABELS: Record<string, string> = {
  "": "Tous",
  suspect: "Suspect",
  confirme: "Confirmé",
  brouillon: "Brouillons",
}

const GROUPE_LABELS: Record<string, string> = {
  pev: "PEV", mth: "MTH", zoonose: "Zoonose", ist: "IST",
  vectorielle: "Vectorielle", nosocomiale: "Nosocomiale", autre: "Autre",
}
const GROUPE_COLORS: Record<string, string> = {
  pev: "#7C3AED", mth: "#2563EB", zoonose: "#D97706",
  ist: "#DC2626", vectorielle: "#EA580C", nosocomiale: "#059669", autre: "#6B7280",
}
const GROUPES_ORDER = ["pev", "mth", "zoonose", "ist", "vectorielle", "nosocomiale", "autre"]

// Searchable maladie dropdown with category groups
function MaladieFilter({ value, onChange, maladies }: { value: string; onChange: (v: string) => void; maladies: MaladieRef[] }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const filtered = maladies.filter(m =>
    m.nom.toLowerCase().includes(search.toLowerCase())
  )
  const selected = maladies.find(m => m.id === value)

  // Group filtered maladies by groupeEpidemiologique
  const groupedFiltered = GROUPES_ORDER.reduce<Record<string, MaladieRef[]>>((acc, g) => {
    acc[g] = filtered.filter(m => (m.groupeEpidemiologique ?? "autre") === g)
    return acc
  }, {})

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "input flex items-center justify-between gap-2 h-[34px] text-[12px] w-44",
          value && "border-[#1B4F8A]"
        )}
      >
        <span className={cn("truncate", value ? "text-gray-900" : "text-gray-400")}>
          {selected?.nom ?? "Maladie..."}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {value && (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onChange(""); setOpen(false) }}
              className="text-gray-400 hover:text-gray-600 text-xs leading-none"
            >
              ✕
            </button>
          )}
          <ChevronDown size={12} className="text-gray-400" />
        </div>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher..."
                className="input w-full pl-8 text-[12px] h-7"
                autoFocus
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-48">
            <button
              type="button"
              onClick={() => { onChange(""); setOpen(false); setSearch("") }}
              className="w-full text-left px-3 py-2 text-[12px] text-gray-400 hover:bg-gray-50"
            >
              Toutes les maladies
            </button>
            {GROUPES_ORDER.map(g => {
              const list = groupedFiltered[g] ?? []
              if (list.length === 0) return null
              return (
                <div key={g}>
                  <div className="px-3 py-1 text-[9px] font-bold uppercase tracking-wider sticky top-0 bg-gray-50"
                    style={{ color: GROUPE_COLORS[g] }}>
                    {GROUPE_LABELS[g]}
                  </div>
                  {list.map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => { onChange(m.id); setOpen(false); setSearch("") }}
                      className={cn(
                        "w-full text-left px-3 py-2 text-[12px] hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0",
                        value === m.id && "bg-blue-50 text-[#1B4F8A] font-medium"
                      )}
                    >
                      {m.nom}
                    </button>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      )}
      {open && <div className="fixed inset-0 z-40" onClick={() => { setOpen(false); setSearch("") }} />}
    </div>
  )
}

// Searchable service dropdown
function ServiceFilter({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const filtered = SERVICES_EHU.filter(s =>
    s.nom.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "input flex items-center justify-between gap-2 h-[34px] text-[12px] w-44",
          value && "border-[#1B4F8A]"
        )}
      >
        <span className={value ? "text-gray-900 truncate" : "text-gray-400"}>
          {value || "Service..."}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {value && (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onChange(""); setOpen(false) }}
              className="text-gray-400 hover:text-gray-600 text-xs leading-none"
            >
              ✕
            </button>
          )}
          <ChevronDown size={12} className="text-gray-400" />
        </div>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher..."
                className="input w-full pl-8 text-[12px] h-7"
                autoFocus
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-48">
            <button
              type="button"
              onClick={() => { onChange(""); setOpen(false); setSearch("") }}
              className="w-full text-left px-3 py-2 text-[12px] text-gray-400 hover:bg-gray-50"
            >
              Tous les services
            </button>
            {filtered.map(s => (
              <button
                key={s.code}
                type="button"
                onClick={() => { onChange(s.nom); setOpen(false); setSearch("") }}
                className={cn(
                  "w-full text-left px-3 py-2 text-[12px] hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0",
                  value === s.nom && "bg-blue-50 text-[#1B4F8A] font-medium"
                )}
              >
                {s.nom}
              </button>
            ))}
          </div>
        </div>
      )}
      {open && <div className="fixed inset-0 z-40" onClick={() => { setOpen(false); setSearch("") }} />}
    </div>
  )
}

export default function CasListTable({ userRole }: { userRole: string }) {
  const [data, setData] = useState<CasResponse | null>(null)
  const [page, setPage] = useState(1)
  const [statut, setStatut] = useState("")
  const [search, setSearch] = useState("")
  const [service, setService] = useState("")
  const [maladieId, setMaladieId] = useState("")
  const [maladies, setMaladies] = useState<MaladieRef[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  // Selection state for export
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [exporting, setExporting] = useState(false)

  // UISTI sub-group state
  const [uistiCas, setUistiCas] = useState<UistiCas[]>([])
  const [uistiExpanded, setUistiExpanded] = useState(true)

  const fetchUistiCas = useCallback(async () => {
    try {
      const res = await fetch("/api/cas?sourceUisti=true&limit=50")
      if (res.ok) {
        const json = await res.json()
        setUistiCas(json.cas ?? [])
      }
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    fetch("/api/maladies")
      .then(r => r.json())
      .then(d => setMaladies(d.maladies ?? []))
      .catch(() => {})
    fetchUistiCas()
  }, [fetchUistiCas])

  const fetchCas = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const params = new URLSearchParams({ page: String(page), limit: "10" })
      if (statut) params.set("statut", statut)
      if (search) params.set("search", search)
      if (service) params.set("service", service)
      if (maladieId) params.set("maladieId", maladieId)
      const res = await fetch(`/api/cas?${params}`)
      if (!res.ok) throw new Error()
      const json = await res.json()
      setData(json)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [page, statut, search, service, maladieId])

  useEffect(() => { fetchCas() }, [fetchCas])
  useEffect(() => { setPage(1); setSelectedIds(new Set()) }, [service, statut, search, maladieId])

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce cas ?")) return
    const res = await fetch(`/api/cas/${id}`, { method: "DELETE" })
    if (res.ok) {
      toast.success("Cas supprimé")
      fetchCas()
    } else {
      toast.error("Erreur lors de la suppression")
    }
  }

  const currentPageIds = data?.cas.map(c => c.id) ?? []
  const allPageSelected = currentPageIds.length > 0 && currentPageIds.every(id => selectedIds.has(id))
  const somePageSelected = currentPageIds.some(id => selectedIds.has(id))

  const toggleSelectAll = () => {
    if (allPageSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev)
        currentPageIds.forEach(id => next.delete(id))
        return next
      })
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev)
        currentPageIds.forEach(id => next.add(id))
        return next
      })
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const params = new URLSearchParams({ format: "excel", type: "cas" })
      if (selectedIds.size > 0) {
        params.set("casIds", [...selectedIds].join(","))
      } else {
        if (statut) params.set("statut", statut)
        if (search) params.set("search", search)
        if (service) params.set("service", service)
        if (maladieId) params.set("maladieId", maladieId)
      }
      const res = await fetch(`/api/export?${params}`)
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `cas-ehu-${new Date().toISOString().slice(0, 10)}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success(selectedIds.size > 0 ? `${selectedIds.size} cas exportés` : "Cas exportés avec succès")
    } catch {
      toast.error("Erreur lors de l'export")
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-4">

    {/* ── UISTI: Décès liés à une MDO non encore déclarée ───────────────────── */}
    {uistiCas.length > 0 && (
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#FED7AA" }}>
        <button
          onClick={() => setUistiExpanded(v => !v)}
          className="w-full flex items-center justify-between px-5 py-3.5 text-left transition-colors hover:bg-amber-50/50"
        >
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "#FEF3C7" }}>
              <AlertTriangle size={14} style={{ color: "#D97706" }} />
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: "#92400E" }}>
                Décès liés à une MDO non encore déclarée
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#B45309" }}>
                Déclarations pré-remplies par l&apos;UISTI — à compléter par le service épidémiologique
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: "#FEF3C7", color: "#92400E" }}>
              {uistiCas.length}
            </span>
            {uistiExpanded ? <ChevronUp size={15} style={{ color: "#B45309" }} /> : <ChevronDown size={15} style={{ color: "#B45309" }} />}
          </div>
        </button>

        {uistiExpanded && (
          <div className="border-t overflow-x-auto" style={{ borderColor: "#FED7AA" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "#FFFBEB", borderBottom: "1px solid #FDE68A" }}>
                  {["Code", "Patient", "MDO suspectée", "Service", "Wilaya", "Date décès", "Date admission", ""].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap" style={{ color: "#92400E" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "#FEF3C7" }}>
                {uistiCas.map(cas => {
                  const ds = cas.donneesSpecifiques
                  return (
                    <tr key={cas.id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="px-4 py-2.5 font-mono text-xs font-medium" style={{ color: "#D97706" }}>{cas.codeCas}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-xs font-medium" style={{ color: "#111827" }}>
                        {cas.patient.firstName} {cas.patient.lastName}
                      </td>
                      <td className="px-4 py-2.5 text-xs max-w-[160px]" style={{ color: "#374151" }}>
                        {cas.maladie?.nom ?? ds?.maladieSuspectee ?? "—"}
                      </td>
                      <td className="px-4 py-2.5 text-xs" style={{ color: "#6B7280" }}>{cas.serviceDeclarant ?? cas.service ?? "—"}</td>
                      <td className="px-4 py-2.5 text-xs" style={{ color: "#6B7280" }}>{ds?.wilaya ?? "—"}</td>
                      <td className="px-4 py-2.5 text-xs font-medium whitespace-nowrap" style={{ color: "#DC2626" }}>{formatDate(cas.dateDeces)}</td>
                      <td className="px-4 py-2.5 text-xs whitespace-nowrap" style={{ color: "#6B7280" }}>{formatDate(cas.createdAt)}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-0.5">
                          <Link
                            href={`/declarations/${cas.id}`}
                            className="p-1.5 rounded-md hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Voir / Compléter"
                          >
                            <Eye size={14} />
                          </Link>
                          <Link
                            href={`/declarations/${cas.id}/edit`}
                            className="p-1.5 rounded-md hover:bg-amber-50 text-gray-400 hover:text-amber-600 transition-colors"
                            title="Compléter la déclaration"
                          >
                            <Pencil size={14} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )}

    <div className="card">
      {/* Filters */}
      <div className="p-4 border-b border-gray-100 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher patient ou code cas..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-9 h-[34px] text-[12px]"
          />
        </div>
        <MaladieFilter value={maladieId} onChange={setMaladieId} maladies={maladies} />
        <ServiceFilter value={service} onChange={setService} />
        {/* Status pills */}
        <div className="flex flex-wrap rounded-lg border border-gray-200 overflow-hidden">
          {STATUTS.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setStatut(s)}
              className={`px-2.5 h-[34px] text-[11px] font-medium transition-all border-r border-gray-200 last:border-r-0 whitespace-nowrap ${
                statut === s
                  ? "bg-[#1B4F8A] text-white"
                  : "bg-white text-gray-500 hover:bg-gray-50"
              }`}
            >
              {STATUT_LABELS[s]}
            </button>
          ))}
        </div>

        {/* Export button */}
        <div className="ml-auto flex items-center gap-2">
          {selectedIds.size > 0 && (
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="text-[11px] text-gray-400 hover:text-gray-600 flex items-center gap-1"
            >
              <CheckSquare size={12} />
              {selectedIds.size} sélectionné{selectedIds.size > 1 ? "s" : ""}  ✕
            </button>
          )}
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-1.5 px-3 h-[34px] rounded-lg text-[12px] font-medium text-white transition-colors disabled:opacity-60"
            style={{ backgroundColor: "#1B4F8A" }}
          >
            <FileSpreadsheet size={13} />
            {exporting
              ? "Export…"
              : selectedIds.size > 0
                ? `Exporter (${selectedIds.size})`
                : "Exporter tout"}
          </button>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="table-header">
              <th className="w-10 px-4">
                <input
                  type="checkbox"
                  checked={allPageSelected}
                  ref={el => { if (el) el.indeterminate = somePageSelected && !allPageSelected }}
                  onChange={toggleSelectAll}
                  className="w-3.5 h-3.5 rounded accent-[#1B4F8A] cursor-pointer"
                  title="Sélectionner toute la page"
                />
              </th>
              {["Code", "Patient", "Maladie", "Service", "Commune", "Date", "Statut", ""].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeleton rows={8} cols={9} />
            ) : error ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center">
                  <AlertCircle size={24} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-[13px] text-gray-500 mb-3">Impossible de charger les déclarations</p>
                  <button onClick={fetchCas} className="btn btn-secondary btn-sm">
                    <RefreshCw size={12} /> Réessayer
                  </button>
                </td>
              </tr>
            ) : !data?.cas.length ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center">
                  <p className="text-[13px] text-gray-400">Aucun cas trouvé</p>
                </td>
              </tr>
            ) : (
              data.cas.map((cas) => {
                const isSelected = selectedIds.has(cas.id)
                return (
                  <tr
                    key={cas.id}
                    className={cn("table-row group", isSelected && "bg-blue-50/60")}
                  >
                    <td className="w-10 px-4" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(cas.id)}
                        className="w-3.5 h-3.5 rounded accent-[#1B4F8A] cursor-pointer"
                      />
                    </td>
                    <td className="text-mono text-[12px] text-gray-500">{cas.codeCas}</td>
                    <td className="font-medium text-gray-800">{cas.patient.firstName} {cas.patient.lastName}</td>
                    <td className="text-gray-600">{cas.maladie?.nom ?? <span className="text-gray-300">—</span>}</td>
                    <td className="text-gray-500">{cas.serviceDeclarant ?? cas.service ?? "—"}</td>
                    <td className="text-gray-500">{cas.commune?.nom ?? "—"}</td>
                    <td className="text-gray-500 text-mono text-[12px]">{formatDate(cas.createdAt)}</td>
                    <td><CasStatusBadge statut={cas.statut} /></td>
                    <td>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          href={`/declarations/${cas.id}`}
                          className="p-1.5 rounded-md hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Voir"
                        >
                          <Eye size={14} />
                        </Link>
                        <Link
                          href={`/declarations/${cas.id}/edit`}
                          className="p-1.5 rounded-md hover:bg-amber-50 text-gray-400 hover:text-amber-600 transition-colors"
                          title="Éditer"
                        >
                          <Pencil size={14} />
                        </Link>
                        {userRole === "admin" && (
                          <button
                            onClick={() => handleDelete(cas.id)}
                            className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-gray-100">
        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton h-20 rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <div className="p-10 text-center">
            <AlertCircle size={24} className="text-gray-300 mx-auto mb-2" />
            <p className="text-[13px] text-gray-500 mb-3">Erreur de chargement</p>
            <button onClick={fetchCas} className="btn btn-secondary btn-sm">
              <RefreshCw size={12} /> Réessayer
            </button>
          </div>
        ) : !data?.cas.length ? (
          <div className="p-10 text-center text-[13px] text-gray-400">Aucun cas trouvé</div>
        ) : (
          data.cas.map(cas => (
            <div key={cas.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-mono text-[11px] text-gray-400">{cas.codeCas}</span>
                    <CasStatusBadge statut={cas.statut} />
                  </div>
                  <p className="text-[13px] font-medium text-gray-800 truncate">
                    {cas.patient.firstName} {cas.patient.lastName}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {cas.maladie?.nom ?? "—"} · {cas.commune?.nom ?? "—"} · {formatDate(cas.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <Link href={`/declarations/${cas.id}`} className="p-1.5 rounded-md hover:bg-blue-50 text-gray-400 hover:text-blue-600" title="Voir"><Eye size={14} /></Link>
                  <Link href={`/declarations/${cas.id}/edit`} className="p-1.5 rounded-md hover:bg-amber-50 text-gray-400 hover:text-amber-600" title="Éditer"><Pencil size={14} /></Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[12px] text-gray-400 font-medium">{data.total} cas au total</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => p - 1)}
              disabled={page === 1}
              className="btn btn-ghost btn-sm disabled:opacity-30"
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: Math.min(data.totalPages, 5) }, (_, i) => {
              const p = i + 1
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-md text-[12px] font-medium transition-all ${
                    page === p
                      ? "bg-[#1B4F8A] text-white"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {p}
                </button>
              )
            })}
            {data.totalPages > 5 && (
              <span className="text-[12px] text-gray-400 px-1">...</span>
            )}
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page === data.totalPages}
              className="btn btn-ghost btn-sm disabled:opacity-30"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>

    </div>
  )
}
