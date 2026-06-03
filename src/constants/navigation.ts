export interface NavItem {
  label: string
  href: string
  icon: string
  permission: string
  isSubItem?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard", permission: "dashboard.view" },
  { label: "Nouvelle Déclaration", href: "/declarations/new", icon: "FilePlus", permission: "cas.create" },
  { label: "Liste des Cas", href: "/declarations", icon: "List", permission: "cas.view_own" },
  { label: "Investigations", href: "/investigations", icon: "Search", permission: "investigation.view" },
  { label: "Analyses & Statistiques", href: "/analyses", icon: "BarChart", permission: "analyses.view" },
  { label: "Prédictions", href: "/predictions", icon: "TrendingUp", permission: "analyses.view" },
  { label: "Rapports", href: "/rapports", icon: "FileBarChart", permission: "rapports.view" },
  { label: "Modèles Rapports", href: "/rapports/modeles", icon: "LayoutTemplate", permission: "users.view", isSubItem: true },
  { label: "Alertes", href: "/alertes", icon: "AlertTriangle", permission: "alertes.view" },
  { label: "Utilisateurs", href: "/utilisateurs", icon: "Users", permission: "users.view" },
  { label: "Rôles", href: "/roles", icon: "Shield", permission: "roles.manage" },
  { label: "Paramètres", href: "/parametres", icon: "Settings", permission: "users.view" },
  { label: "Historique", href: "/parametres/historique", icon: "History", permission: "users.view" },
  { label: "Notifications", href: "/notifications", icon: "Bell", permission: "dashboard.view" },
  // UISTI
  { label: "Morbidité Hospitalière", href: "/uisti/morbidite", icon: "Activity", permission: "uisti.morbidite" },
  { label: "Croisement Mortalité", href: "/uisti/mortalite", icon: "AlertTriangle", permission: "uisti.mortalite" },
  // UHH — Unité d'Hygiène Hospitalière
  { label: "Tableau de bord UHH", href: "/uhh/dashboard", icon: "ShieldCheck", permission: "uhh.dashboard" },
  { label: "Infections IAS", href: "/uhh/ias", icon: "Biohazard", permission: "uhh.ias.view" },
]
