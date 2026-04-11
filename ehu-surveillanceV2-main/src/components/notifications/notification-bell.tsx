"use client"

import { useState, useEffect, useRef } from "react"
import { Bell, X, Check } from "lucide-react"
import { formatDateTime } from "@/utils/format-date"

interface Notification {
  id: string
  type: string
  titre: string
  message: string
  isRead: boolean
  createdAt: string
}

const TYPE_COLORS: Record<string, string> = {
  seuil_depasse: "#DC2626",
  nouveau_cas: "#1B4F8A",
  investigation: "#D97706",
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications")
      const data = await res.json()
      setNotifications(data.notifications ?? [])
      setUnreadCount(data.unreadCount ?? 0)
    } catch { /* silent */ }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchNotifications()
    const interval = setInterval(() => { void fetchNotifications() }, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const markAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    })
    fetchNotifications()
  }

  const markRead = async (id: string) => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    fetchNotifications()
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={18} className="text-gray-500" />
        {unreadCount > 0 && (
          <span
            className="badge-pulse absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full text-white flex items-center justify-center font-bold"
            style={{ backgroundColor: "#DC2626", fontSize: "9px" }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="animate-scale-in absolute right-0 top-11 w-[340px] bg-white rounded-xl border border-gray-200 z-50 overflow-hidden" style={{ boxShadow: "var(--shadow-xl)" }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-gray-800">Notifications</span>
              {unreadCount > 0 && (
                <span className="badge" style={{ backgroundColor: "var(--danger-light)", color: "var(--danger)", fontSize: "10px" }}>
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="btn btn-ghost btn-sm text-[11px]">
                  <Check size={11} /> Tout lire
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-gray-100 transition-colors">
                <X size={14} className="text-gray-400" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Bell size={24} className="text-gray-200 mx-auto mb-2" />
                <p className="text-[13px] text-gray-400">Aucune notification</p>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => !n.isRead && markRead(n.id)}
                  className="px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors"
                  style={{ backgroundColor: n.isRead ? "white" : "var(--brand-50)" }}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                      style={{ backgroundColor: n.isRead ? "transparent" : (TYPE_COLORS[n.type] ?? "var(--brand-500)") }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-gray-800 truncate">{n.titre}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">{n.message}</p>
                      <p className="text-[10px] text-gray-400 mt-1 font-medium">{formatDateTime(n.createdAt)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
