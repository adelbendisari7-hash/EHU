"use client"

import { useState, useEffect, useCallback } from "react"
import { History, Search, X, ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import { formatDate } from "@/utils/format-date"

interface AuditLog {
  id: string
  action: string
  entity: string
  entityId: string | null
  details: unknown
  ip: string | null
  createdAt: string
  user: { firstName: string; lastName: string; email: string } | null
}

const ACTION_CONFIG: Record<string, { color: string; bg: string }> = {
  CREATE:  { color: "#047857", bg: "#ECFDF5" },
  UPDATE:  { color: "#1B4F8A", bg: "#EEF4FF" },
  DELETE:  { color: "#B91C1C", bg: "#FEF2F2" },
  LOGIN:   { color: "#7C3AED", bg: "#F5F3FF" },
  LOGOUT:  { color: "#6B7280", bg: "#F9FAFB" },
  PATCH:   { color: "#B45309", bg: "#FFFBEB" },
  RESOLVE: { color: "#059669", bg: "#ECFDF5" },
}

const ENTITY_LABELS: Record<string, string> = {
  CasDeclare: "Cas déclaré",
  User: "Utilisateur",
  Investigation: "Investigation",
  Alerte: "Alerte",
  SeuilAlerte: "Seuil d'alerte",
  Maladie: "Maladie",
  Notification: "Notification",
}

function actionLabel(action: string) {
  const cfg = ACTION_CONFIG[action.toUpperCase()]
  if (!cfg) return { color: "#6B7280", bg: "#F9FAFB" }
  return cfg
}

export default function HistoriquePage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [entityFilter, setEntityFilter] = useState("")
  const [dateDebut, setDateDebut] = useState("")
  const [dateFin, setDateFin] = useState("")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: "50" })
      if (search) params.set("action", search)
      if (entityFilter) params.set("entity", entityFilter)
      if (dateDebut) params.set("dateDebut", dateDebut)
      if (dateFin) params.set("dateFin", dateFin)
      const res = await fetch(`/api/audit-logs?${params}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setLogs(data.logs ?? [])
      setTotal(data.total ?? 0)
      setTotalPages(data.totalPages ?? 1)
    } catch {
      setLogs([])
    } finally {
      setLoading(false)
    }
  }, [page, search, entityFilter, dateDebut, dateFin])

  useEffect(() => { void fetchLogs() }, [fetchLogs])

  const resetFilters = () => {
    setSearch("")
    setEntityFilter("")
    setDateDebut("")
    setDateFin("")
    setPage(1)
  }

  const hasFilters = search || entityFilter || dateDebut || dateFin
  const entities = ["CasDeclare", "User", "Investigation", "Alerte", "SeuilAlerte", "Maladie"]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Historique des Activités</h1>
          <p className="page-subtitle">Journal complet des actions effectuées sur le système</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200">
          <History size={14} className="text-amber-600" />
          <span className="text-[12px] font-medium text-amber-700">Admin uniquement</span>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-4 space-y-3">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Rechercher une action..."
              className="h-8 pl-8 pr-3 rounded-lg border border-gray-200 text-[12px] outline-none focus:border-[#1B4F8A] min-w-[180px]"
            />
          </div>
          <select
            value={entityFilter}
            onChange={e => { setEntityFilter(e.target.value); setPage(1) }}
            className="h-8 px-3 rounded-lg border border-gray-200 text-[12px] outline-none focus:border-[#1B4F8A] bg-white"
          >
            <option value="">Tous les éléments</option>
            {entities.map(e => (
              <option key={e} value={e}>{ENTITY_LABELS[e] ?? e}</option>
            ))}
          </select>
          <div className="flex items-center gap-1.5">
            <Calendar size={13} className="text-gray-400" />
            <input
              type="date"
              value={dateDebut}
              onChange={e => { setDateDebut(e.target.value); setPage(1) }}
              className="h-8 px-2 rounded-lg border border-gray-200 text-[12px] outline-none focus:border-[#1B4F8A]"
            />
            <span className="text-gray-400 text-[12px]">→</span>
            <input
              type="date"
              value={dateFin}
              onChange={e => { setDateFin(e.target.value); setPage(1) }}
              className="h-8 px-2 rounded-lg border border-gray-200 text-[12px] outline-none focus:border-[#1B4F8A]"
            />
          </div>
          {hasFilters && (
            <button onClick={resetFilters} className="flex items-center gap-1 text-[12px] text-gray-400 hover:text-gray-600">
              <X size={12} /> Réinitialiser
            </button>
          )}
        </div>
        <p className="text-[11px] text-gray-400">{total.toLocaleString("fr-FR")} entrée{total !== 1 ? "s" : ""} au total</p>
      </div>

      {/* Table */}
      {loading ? (
        <div className="card p-12 text-center text-sm text-gray-400">Chargement...</div>
      ) : logs.length === 0 ? (
        <div className="card p-12 text-center">
          <History size={36} className="text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Aucune activité trouvée</p>
        </div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80">
                  {["Date", "Utilisateur", "Action", "Élément", "ID", "IP", "Détails"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => {
                  const actConf = actionLabel(log.action)
                  const isExpanded = expandedId === log.id
                  return (
                    <>
                      <tr
                        key={log.id}
                        className={`border-b border-gray-50 transition-colors cursor-pointer hover:bg-gray-50/50 ${i % 2 === 1 ? "bg-gray-50/30" : ""}`}
                        onClick={() => setExpandedId(isExpanded ? null : log.id)}
                      >
                        <td className="px-4 py-2.5 text-[12px] text-gray-500 whitespace-nowrap">
                          {formatDate(log.createdAt)}
                        </td>
                        <td className="px-4 py-2.5">
                          {log.user ? (
                            <div>
                              <p className="text-[12px] font-medium text-gray-800">
                                {log.user.firstName} {log.user.lastName}
                              </p>
                              <p className="text-[10px] text-gray-400">{log.user.email}</p>
                            </div>
                          ) : (
                            <span className="text-[12px] text-gray-400">Système</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ color: actConf.color, backgroundColor: actConf.bg }}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-[12px] text-gray-600">
                          {ENTITY_LABELS[log.entity] ?? log.entity}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="text-[10px] text-gray-400 font-mono">
                            {log.entityId ? `${log.entityId.slice(0, 8)}…` : "—"}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-[12px] text-gray-400">
                          {log.ip ?? "—"}
                        </td>
                        <td className="px-4 py-2.5 text-[12px] text-[#1B4F8A]">
                          {log.details ? (isExpanded ? "▲ Masquer" : "▼ Voir") : "—"}
                        </td>
                      </tr>
                      {isExpanded && log.details && (
                        <tr key={`${log.id}-details`} className="bg-blue-50/40 border-b border-gray-100">
                          <td colSpan={7} className="px-4 py-3">
                            <pre className="text-[11px] text-gray-600 font-mono whitespace-pre-wrap bg-white rounded-lg p-3 border border-gray-200 max-h-48 overflow-y-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-[12px] text-gray-400">
                Page {page} / {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-[12px] text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={13} /> Précédent
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-[12px] text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Suivant <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
