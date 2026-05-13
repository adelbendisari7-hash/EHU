"use client"

import { useState, useEffect, useCallback } from "react"
import { Bell, Check, CheckCheck, Filter, X, AlertTriangle, FileText, Search, Activity } from "lucide-react"
import { formatDateTime } from "@/utils/format-date"

interface Notification {
  id: string
  type: string
  titre: string
  message: string
  isRead: boolean
  createdAt: string
}

const TYPE_OPTIONS = [
  { value: "", label: "Tous les types" },
  { value: "seuil_depasse", label: "Seuil dépassé" },
  { value: "nouveau_cas", label: "Nouveau cas" },
  { value: "investigation", label: "Investigation" },
  { value: "alerte", label: "Alerte" },
]

const TYPE_ICONS: Record<string, React.ElementType> = {
  seuil_depasse: AlertTriangle,
  nouveau_cas: FileText,
  investigation: Search,
  alerte: Bell,
}

const TYPE_COLORS: Record<string, string> = {
  seuil_depasse: "#DC2626",
  nouveau_cas: "#1B4F8A",
  investigation: "#D97706",
  alerte: "#7C3AED",
}

const TYPE_BG: Record<string, string> = {
  seuil_depasse: "#FEF2F2",
  nouveau_cas: "#EFF6FF",
  investigation: "#FFFBEB",
  alerte: "#F5F3FF",
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [total, setTotal] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState("")
  const [isReadFilter, setIsReadFilter] = useState("")
  const [dateDebut, setDateDebut] = useState("")
  const [dateFin, setDateFin] = useState("")

  const LIMIT = 20

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("limit", String(LIMIT))
      params.set("page", String(page))
      if (typeFilter) params.set("type", typeFilter)
      if (isReadFilter) params.set("is_read", isReadFilter)
      if (dateDebut) params.set("date_debut", dateDebut)
      if (dateFin) params.set("date_fin", dateFin)

      const res = await fetch(`/api/notifications?${params}`)
      const data = await res.json()
      setNotifications(data.notifications ?? [])
      setTotal(data.total ?? 0)
      setUnreadCount(data.unreadCount ?? 0)
    } finally {
      setLoading(false)
    }
  }, [page, typeFilter, isReadFilter, dateDebut, dateFin])

  useEffect(() => { void fetchNotifications() }, [fetchNotifications])

  const markAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    })
    void fetchNotifications()
  }

  const markRead = async (id: string) => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const resetFilters = () => {
    setTypeFilter("")
    setIsReadFilter("")
    setDateDebut("")
    setDateFin("")
    setPage(1)
  }

  const totalPages = Math.ceil(total / LIMIT)
  const hasFilters = typeFilter || isReadFilter || dateDebut || dateFin

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Notifications</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? "s" : ""}` : "Tout est lu"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <CheckCheck size={15} />
            Tout marquer comme lu
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-gray-500 shrink-0">
            <Filter size={14} />
            <span>Filtres</span>
          </div>
          <select
            value={typeFilter}
            onChange={e => { setTypeFilter(e.target.value); setPage(1) }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select
            value={isReadFilter}
            onChange={e => { setIsReadFilter(e.target.value); setPage(1) }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Tous les statuts</option>
            <option value="false">Non lues</option>
            <option value="true">Lues</option>
          </select>
          <input
            type="date"
            value={dateDebut}
            onChange={e => { setDateDebut(e.target.value); setPage(1) }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          <span className="text-gray-400 text-sm">→</span>
          <input
            type="date"
            value={dateFin}
            onChange={e => { setDateFin(e.target.value); setPage(1) }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          {hasFilters && (
            <button onClick={resetFilters} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors">
              <X size={13} /> Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Activity size={20} className="text-gray-300 animate-pulse" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Bell size={36} className="text-gray-200 mb-3" />
            <p className="text-sm font-medium text-gray-500">Aucune notification</p>
            <p className="text-xs text-gray-400 mt-1">{hasFilters ? "Aucun résultat pour ces filtres" : "Vous êtes à jour !"}</p>
          </div>
        ) : (
          notifications.map(n => {
            const Icon = TYPE_ICONS[n.type] ?? Bell
            const color = TYPE_COLORS[n.type] ?? "#6B7280"
            const bg = TYPE_BG[n.type] ?? "#F9FAFB"
            return (
              <div
                key={n.id}
                onClick={() => !n.isRead && markRead(n.id)}
                className="flex items-start gap-4 px-5 py-4 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50/50 transition-colors"
                style={{ backgroundColor: n.isRead ? "white" : "#FAFBFF" }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                  style={{ backgroundColor: bg }}
                >
                  <Icon size={16} style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <p className={`text-[13px] font-semibold ${n.isRead ? "text-gray-600" : "text-gray-900"}`}>{n.titre}</p>
                    <span className="text-[11px] text-gray-400 shrink-0 mt-0.5">{formatDateTime(n.createdAt)}</span>
                  </div>
                  <p className="text-[12px] text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
                  {!n.isRead && (
                    <button
                      onClick={e => { e.stopPropagation(); void markRead(n.id) }}
                      className="flex items-center gap-1 text-[11px] text-blue-500 hover:text-blue-700 mt-1.5 transition-colors"
                    >
                      <Check size={11} /> Marquer comme lu
                    </button>
                  )}
                </div>
                {!n.isRead && (
                  <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-2" />
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
          <span>{total} notification{total > 1 ? "s" : ""} au total</span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              Précédent
            </button>
            <span className="text-xs px-2">{page} / {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
