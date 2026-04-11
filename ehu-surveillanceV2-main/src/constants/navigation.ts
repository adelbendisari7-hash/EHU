export interface NavItem {
  label: string
  href: string
  icon: string
  permission: string
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard", permission: "dashboard.view" },
  { label: "Nouvelle Déclaration", href: "/declarations/new", icon: "FilePlus", permission: "cas.create" },
  { label: "Liste des Cas", href: "/declarations", icon: "List", permission: "cas.view_own" },
  { label: "Investigations", href: "/investigations", icon: "Search", permission: "investigation.view" },
  { label: "Analyses & Statistiques", href: "/analyses", icon: "BarChart", permission: "analyses.view" },
  { label: "Rapports", href: "/rapports", icon: "FileBarChart", permission: "rapports.view" },
  { label: "Alertes", href: "/alertes", icon: "AlertTriangle", permission: "alertes.view" },
  { label: "Groupes de Maladies", href: "/alertes/groupes", icon: "Shield", permission: "alertes.view" },
  { label: "Utilisateurs", href: "/utilisateurs", icon: "Users", permission: "users.view" },
  { label: "Rôles", href: "/roles", icon: "Shield", permission: "roles.manage" },
  { label: "Paramètres", href: "/parametres", icon: "Settings", permission: "protocoles.view" },
]
