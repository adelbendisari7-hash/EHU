"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  LayoutDashboard, FilePlus, List, Search,
  BarChart, AlertTriangle, Users, Settings, Shield, LogOut, Menu, X, FileBarChart,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/utils/cn"
import { NAV_ITEMS } from "@/constants/navigation"
import { signOut } from "next-auth/react"

const ICONS: Record<string, React.ElementType> = {
  LayoutDashboard, FilePlus, List, Search,
  BarChart, AlertTriangle, Users, Settings, Shield, FileBarChart,
}

// Group nav items for visual hierarchy
const NAV_GROUPS: Record<string, string[]> = {
  Principal: ["/dashboard"],
  Déclarations: ["/declarations/new", "/declarations"],
  Analyse: ["/investigations", "/analyses", "/rapports"],
  Alertes: ["/alertes", "/alertes/groupes"],
  Administration: ["/utilisateurs", "/roles", "/parametres"],
}

function NavLinks({
  visibleItems,
  pathname,
  onNavigate,
}: {
  visibleItems: typeof NAV_ITEMS
  pathname: string
  onNavigate?: () => void
}) {
  const visibleHrefs = new Set(visibleItems.map(i => i.href))

  return (
    <nav className="flex-1 overflow-y-auto py-3 px-3">
      {Object.entries(NAV_GROUPS).map(([group, hrefs]) => {
        const groupItems = hrefs
          .map(href => visibleItems.find(i => i.href === href))
          .filter(Boolean) as typeof NAV_ITEMS
        if (groupItems.length === 0) return null

        return (
          <div key={group} className="mb-1">
            <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-white/40 select-none">
              {group}
            </p>
            <ul className="space-y-0.5">
              {groupItems.map((item) => {
                const Icon = ICONS[item.icon]
                const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href) && !NAV_ITEMS.some(n => n.href !== item.href && n.href.startsWith(item.href) && pathname.startsWith(n.href)))
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "group flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all relative",
                        isActive
                          ? "bg-white/15 text-white font-medium shadow-sm"
                          : "text-white/65 hover:bg-white/8 hover:text-white/90"
                      )}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-white" />
                      )}
                      {Icon && <Icon size={16} className="shrink-0" />}
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </nav>
  )
}

function SidebarLogo() {
  return (
    <div className="flex items-center gap-3 px-5 h-14 border-b border-white/8 shrink-0">
      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shrink-0 shadow-sm">
        <span className="font-bold text-xs" style={{ color: "#1B4F8A" }}>EHU</span>
      </div>
      <div className="min-w-0">
        <p className="text-white font-semibold text-sm leading-none">EHU Oran</p>
        <p className="text-white/45 text-[11px] mt-0.5 truncate">Surveillance Épidémiologique</p>
      </div>
    </div>
  )
}

function SidebarFooter({ userName, userRole }: { userName: string; userRole: string }) {
  const roleLabels: Record<string, string> = {
    medecin: "Médecin",
    epidemiologiste: "Épidémiologiste",
    admin: "Administrateur",
  }

  return (
    <div className="border-t border-white/8 p-3 shrink-0">
      <div className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-default">
        <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center shrink-0 ring-2 ring-white/10">
          <span className="text-white text-xs font-semibold">
            {userName.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-[13px] font-medium truncate leading-none">{userName}</p>
          <p className="text-white/45 text-[11px] mt-0.5">{roleLabels[userRole] ?? userRole}</p>
        </div>
      </div>
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="flex items-center gap-2 w-full px-3 py-2 mt-1 rounded-lg text-white/50 hover:text-white hover:bg-white/8 text-[13px] transition-all"
      >
        <LogOut size={15} />
        <span>Déconnexion</span>
      </button>
    </div>
  )
}

interface SidebarProps {
  userName: string
  userRole: string
  permissions: string[]
}

export default function Sidebar({ userName, userRole, permissions }: SidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const visibleItems = NAV_ITEMS.filter((item) =>
    permissions.includes(item.permission)
  )

  const sidebarContent = (
    <>
      <SidebarLogo />
      <NavLinks
        visibleItems={visibleItems}
        pathname={pathname}
        onNavigate={() => setMobileOpen(false)}
      />
      <SidebarFooter userName={userName} userRole={userRole} />
    </>
  )

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3.5 left-3.5 z-50 p-2 rounded-lg text-white shadow-md"
        style={{ backgroundColor: "#1B4F8A" }}
        aria-label="Ouvrir le menu"
      >
        <Menu size={18} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "lg:hidden fixed left-0 top-0 h-full w-64 flex flex-col z-50 transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ backgroundColor: "#142D4F" }}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-3.5 right-3.5 text-white/50 hover:text-white p-1"
          aria-label="Fermer le menu"
        >
          <X size={18} />
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex fixed left-0 top-0 h-full w-64 flex-col z-30"
        style={{ backgroundColor: "#142D4F" }}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
