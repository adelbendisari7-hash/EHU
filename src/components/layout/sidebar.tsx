"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  LayoutDashboard, FilePlus, List, Search,
  BarChart, AlertTriangle, Users, Settings, Shield, LogOut, Menu, X, FileBarChart,
  ChevronRight, TrendingUp, History, Bell, Activity, LayoutTemplate, ShieldCheck, Biohazard,
} from "lucide-react"
import { cn } from "@/utils/cn"
import { NAV_ITEMS } from "@/constants/navigation"
import { signOut } from "next-auth/react"

const ICONS: Record<string, React.ElementType> = {
  LayoutDashboard, FilePlus, List, Search,
  BarChart, AlertTriangle, Users, Settings, Shield, FileBarChart, TrendingUp, History, Bell, Activity, LayoutTemplate,
  ShieldCheck, Biohazard,
}

const NAV_GROUPS: Record<string, string[]> = {
  Principal: ["/dashboard"],
  Déclarations: ["/declarations/new", "/declarations"],
  Analyse: ["/investigations", "/analyses", "/predictions", "/rapports", "/rapports/modeles"],
  Alertes: ["/alertes"],
  Administration: ["/utilisateurs", "/roles", "/parametres", "/parametres/historique"],
  Compte: ["/notifications"],
  "Interface UISTI": ["/uisti/morbidite", "/uisti/mortalite"],
  "Interface UHH": ["/uhh/dashboard", "/uhh/ias"],
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
  return (
    <nav className="flex-1 overflow-y-auto py-3 px-3">
      {Object.entries(NAV_GROUPS).map(([group, hrefs]) => {
        const groupItems = hrefs
          .map(href => visibleItems.find(i => i.href === href))
          .filter(Boolean) as typeof NAV_ITEMS
        if (groupItems.length === 0) return null

        return (
          <div key={group} className="mb-2">
            <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.07em] select-none" style={{ color: "rgba(255,255,255,0.52)" }}>
              {group}
            </p>
            <ul className="space-y-0.5">
              {groupItems.map((item) => {
                const Icon = ICONS[item.icon]
                const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href) && !NAV_ITEMS.some(n => n.href !== item.href && n.href.startsWith(item.href) && pathname.startsWith(n.href)))
                if (item.isSubItem) {
                  return (
                    <li key={item.href} className="pl-4">
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        className={cn(
                          "group flex items-center gap-2 px-3 py-1.5 rounded-md text-[13px] transition-all relative border-l border-white/20 ml-1",
                          isActive
                            ? "font-medium bg-white/12"
                            : "hover:bg-white/8"
                        )}
                        style={{ color: isActive ? "#fff" : "rgba(255,255,255,0.72)" }}
                      >
                        {Icon && <Icon size={13} className="shrink-0" />}
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </li>
                  )
                }
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "group flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[14px] transition-all relative",
                        isActive
                          ? "bg-white/16 font-semibold shadow-sm"
                          : "hover:bg-white/10"
                      )}
                      style={{ color: isActive ? "#fff" : "rgba(255,255,255,0.78)" }}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-white" />
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
    <div className="flex items-center gap-3 px-5 h-16 border-b shrink-0" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-md overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.95)" }}>
        <Image src="/ehu-logo.png" alt="Logo EHU" width={36} height={36} className="object-contain" />
      </div>
      <div className="min-w-0">
        <p className="text-white font-semibold text-[14px] leading-tight">EHU Oran</p>
        <p className="text-[11px] mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.58)" }}>Surveillance Épidémiologique</p>
      </div>
    </div>
  )
}

function SidebarFooter({ userName, userRole }: { userName: string; userRole: string }) {
  const roleLabels: Record<string, string> = {
    medecin: "Médecin",
    epidemiologiste: "Épidémiologiste",
    admin: "Administrateur",
    uisti: "Unité UISTI",
    uhh: "Hygiéniste UHH",
  }

  return (
    <div className="p-3 shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
      <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg transition-colors cursor-default" style={{ }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 ring-2 ring-white/10" style={{ backgroundColor: "rgba(255,255,255,0.18)" }}>
          <span className="text-white text-[13px] font-semibold">
            {userName.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-[14px] font-medium truncate leading-tight">{userName}</p>
          <p className="text-[12px] mt-0.5" style={{ color: "rgba(255,255,255,0.60)" }}>{roleLabels[userRole] ?? userRole}</p>
        </div>
      </div>
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="flex items-center gap-2 w-full px-3 py-2 mt-1 rounded-lg text-[13px] transition-all hover:bg-white/10"
        style={{ color: "rgba(255,255,255,0.68)" }}
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
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg text-white shadow-md"
        style={{ backgroundColor: "#1B4F8A" }}
        aria-label="Ouvrir le menu"
      >
        <Menu size={18} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 backdrop-blur-sm z-40 transition-opacity"
          style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "lg:hidden fixed left-0 top-0 h-full w-64 flex flex-col z-50 transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ backgroundColor: "#132B4A" }}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 p-1 rounded-md transition-colors hover:bg-white/10"
          style={{ color: "rgba(255,255,255,0.65)" }}
          aria-label="Fermer le menu"
        >
          <X size={18} />
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex fixed left-0 top-0 h-full w-64 flex-col z-30"
        style={{ backgroundColor: "#132B4A" }}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
