"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Eye, Pencil, Trash2, ChevronLeft, ChevronRight, AlertCircle, RefreshCw, Search, Filter } from "lucide-react"
import CasStatusBadge from "./cas-status-badge"
import { formatDate } from "@/utils/format-date"
import { TableSkeleton } from "@/components/shared/skeleton"
import { toast } from "sonner"
import type { CasStatut } from "@/types"

interface Cas {
  id: string
  codeCas: string
  statut: CasStatut
  service: string
  observation: string | null
  createdAt: string
  patient: { firstName: string; lastName: string }
  maladie: { nom: string }
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

const STATUTS = ["", "nouveau", "en_cours", "confirme", "infirme", "cloture"]
const STATUT_LABELS: Record<string, string> = {
  "": "Tous", nouveau: "Nouveau", en_cours: "En cours",
  confirme: "Confirmé", infirme: "Infirmé", cloture: "Clôturé",
}

export default function CasListTable({ userRole }: { userRole: string }) {
  const [data, setData] = useState<CasResponse | null>(null)
  const [page, setPage] = useState(1)
  const [statut, setStatut] = useState("")
  const [search, setSearch] = useState("")
  const [service, setService] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchCas = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const params = new URLSearchParams({ page: String(page), limit: "10" })
      if (statut) params.set("statut", statut)
      if (search) params.set("search", search)
      if (service) params.set("service", service)
      const res = await fetch(`/api/cas?${params}`)
      if (!res.ok) throw new Error()
      const json = await res.json()
      setData(json)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [page, statut, search, service])

  useEffect(() => { fetchCas() }, [fetchCas])
  useEffect(() => { setPage(1) }, [service, statut, search])

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

  return (
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
        <input
          type="text"
          placeholder="Service..."
          value={service}
          onChange={e => setService(e.target.value)}
          className="input w-36 h-[34px] text-[12px]"
        />
        {/* Status pills */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
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
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="table-header">
              {["Code", "Patient", "Maladie", "Service", "Commune", "Date", "Statut", ""].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeleton rows={8} cols={8} />
            ) : error ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center">
                  <AlertCircle size={24} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-[13px] text-gray-500 mb-3">Impossible de charger les déclarations</p>
                  <button onClick={fetchCas} className="btn btn-secondary btn-sm">
                    <RefreshCw size={12} /> Réessayer
                  </button>
                </td>
              </tr>
            ) : !data?.cas.length ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center">
                  <p className="text-[13px] text-gray-400">Aucun cas trouvé</p>
                </td>
              </tr>
            ) : (
              data.cas.map((cas) => (
                <tr key={cas.id} className="table-row group">
                  <td className="text-mono text-[12px] text-gray-500">{cas.codeCas}</td>
                  <td className="font-medium text-gray-800">{cas.patient.firstName} {cas.patient.lastName}</td>
                  <td className="text-gray-600">{cas.maladie.nom}</td>
                  <td className="text-gray-500">{cas.service ?? "—"}</td>
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
              ))
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
                    {cas.maladie.nom} · {cas.commune?.nom ?? "—"} · {formatDate(cas.createdAt)}
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
            {/* Page numbers */}
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
  )
}
