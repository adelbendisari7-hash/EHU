"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import NotificationBell from "@/components/notifications/notification-bell"

const BREADCRUMBS: Record<string, { label: string; parent?: string }> = {
  "/dashboard": { label: "Dashboard" },
  "/declarations": { label: "Déclarations" },
  "/declarations/new": { label: "Nouvelle Déclaration", parent: "/declarations" },
  "/investigations": { label: "Investigations" },
  "/analyses": { label: "Analyses" },
  "/alertes": { label: "Alertes" },
  "/alertes/groupes": { label: "Groupes de Maladies", parent: "/alertes" },
  "/utilisateurs": { label: "Utilisateurs" },
  "/parametres": { label: "Paramètres" },
  "/profil": { label: "Mon Profil" },
  "/rapports": { label: "Rapports" },
}

function Breadcrumb({ pathname }: { pathname: string }) {
  const current = BREADCRUMBS[pathname]
  if (!current) return <span className="text-sm font-medium text-gray-800">EHU Surveillance</span>

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
          {i > 0 && <ChevronRight size={12} className="text-gray-400" />}
          {crumb.href ? (
            <Link href={crumb.href} className="text-[13px] text-gray-400 transition-colors hover:text-gray-600">
              {crumb.label}
            </Link>
          ) : (
            <span className="text-[13px] font-medium text-gray-800">{crumb.label}</span>
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
      className="fixed top-0 right-0 h-14 bg-white/88 backdrop-blur-md border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 z-20 left-0 lg:left-64"
    >
      <div className="pl-12 lg:pl-0">
        <Breadcrumb pathname={pathname} />
      </div>

      <div className="flex items-center gap-2">
        <NotificationBell />

        <div className="w-px h-5 mx-1 bg-gray-200" />

        <Link
          href="/profil"
          className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-semibold" style={{ backgroundColor: "#1B4F8A" }}>
            {userName.charAt(0).toUpperCase()}
          </div>
          <span className="text-[13px] font-medium text-gray-700 hidden sm:block">{userName}</span>
        </Link>
      </div>
    </header>
  )
}
