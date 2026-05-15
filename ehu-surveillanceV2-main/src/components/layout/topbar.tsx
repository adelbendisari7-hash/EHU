"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"
import NotificationBell from "@/components/notifications/notification-bell"

const BREADCRUMBS: Record<string, { label: string; parent?: string }> = {
  "/dashboard": { label: "Tableau de bord" },
  "/declarations": { label: "Déclarations" },
  "/declarations/new": { label: "Nouvelle Déclaration", parent: "/declarations" },
  "/investigations": { label: "Investigations" },
  "/analyses": { label: "Analyses & Statistiques" },
  "/alertes": { label: "Alertes Épidémiques" },
  "/predictions": { label: "Prédictions", parent: "/analyses" },
  "/utilisateurs": { label: "Utilisateurs" },
  "/parametres": { label: "Paramètres" },
  "/profil": { label: "Mon Profil" },
  "/rapports": { label: "Rapports" },
  "/parametres/historique": { label: "Historique des Activités", parent: "/parametres" },
  "/notifications": { label: "Notifications" },
  "/mes-stats": { label: "Mes Statistiques" },
  "/rapports/modeles": { label: "Modèles de Rapports", parent: "/rapports" },
}

function Breadcrumb({ pathname }: { pathname: string }) {
  const current = BREADCRUMBS[pathname]
  if (!current) return <span className="text-[14px] font-semibold" style={{ color: "var(--gray-800)" }}>EHU Surveillance</span>

  const crumbs: { label: string; href?: string }[] = []
  if (current.parent) {
    const parent = BREADCRUMBS[current.parent]
    if (parent) crumbs.push({ label: parent.label, href: current.parent })
  }
  crumbs.push({ label: current.label })

  return (
    <div className="flex items-center gap-1.5">
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight size={13} style={{ color: "var(--gray-400)" }} />}
          {crumb.href ? (
            <Link
              href={crumb.href}
              className="text-[13px] font-medium transition-colors"
              style={{ color: "var(--gray-400)" }}
              onMouseOver={e => (e.currentTarget.style.color = "var(--gray-600)")}
              onMouseOut={e => (e.currentTarget.style.color = "var(--gray-400)")}
            >
              {crumb.label}
            </Link>
          ) : (
            <span className="text-[14px] font-semibold" style={{ color: "var(--gray-800)" }}>
              {crumb.label}
            </span>
          )}
        </span>
      ))}
    </div>
  )
}

interface TopbarProps {
  userName: string
}

export default function Topbar({ userName }: TopbarProps) {
  const pathname = usePathname()

  return (
    <header
      className="fixed top-0 right-0 h-16 flex items-center justify-between px-4 lg:px-6 z-20 left-0 lg:left-64"
      style={{
        backgroundColor: "#ffffff",
        borderBottom: "1px solid var(--gray-200)",
        boxShadow: "0 1px 3px rgba(17, 24, 55, 0.05)",
      }}
    >
      <div className="pl-12 lg:pl-0">
        <Breadcrumb pathname={pathname} />
      </div>

      <div className="flex items-center gap-2">
        <NotificationBell />

        <div className="w-px h-5 mx-1" style={{ backgroundColor: "var(--gray-200)" }} />

        <Link
          href="/profil"
          className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-colors"
          style={{ color: "var(--gray-700)" }}
          onMouseOver={e => (e.currentTarget.style.backgroundColor = "var(--gray-50)")}
          onMouseOut={e => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[12px] font-bold shrink-0"
            style={{ backgroundColor: "#1B4F8A" }}
          >
            {userName.charAt(0).toUpperCase()}
          </div>
          <span className="text-[14px] font-medium hidden sm:block" style={{ color: "var(--gray-700)" }}>
            {userName}
          </span>
        </Link>
      </div>
    </header>
  )
}
