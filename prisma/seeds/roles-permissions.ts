export const PERMISSIONS_SEED = [
  // Dashboard
  { slug: "dashboard.view", name: "Voir le tableau de bord", module: "dashboard" },
  // Cas
  { slug: "cas.create", name: "Déclarer un nouveau cas", module: "cas" },
  { slug: "cas.view_own", name: "Voir ses propres cas", module: "cas" },
  { slug: "cas.view_all", name: "Voir tous les cas", module: "cas" },
  { slug: "cas.edit", name: "Modifier un cas", module: "cas" },
  { slug: "cas.delete", name: "Supprimer un cas", module: "cas" },
  { slug: "cas.change_status", name: "Changer le statut d'un cas", module: "cas" },
  // Investigation
  { slug: "investigation.create", name: "Créer une investigation", module: "investigation" },
  { slug: "investigation.view", name: "Voir les investigations", module: "investigation" },
  { slug: "investigation.edit", name: "Modifier une investigation", module: "investigation" },
  // Contacts
  { slug: "contacts.manage", name: "Gérer le traçage des contacts", module: "contacts" },
  // Alertes
  { slug: "alertes.view", name: "Voir les alertes", module: "alertes" },
  { slug: "alertes.create", name: "Créer une alerte", module: "alertes" },
  { slug: "alertes.manage", name: "Résoudre et archiver les alertes", module: "alertes" },
  // Analyses
  { slug: "analyses.view", name: "Voir les analyses", module: "analyses" },
  // Rapports
  { slug: "rapports.view", name: "Voir les rapports", module: "rapports" },
  { slug: "rapports.generate", name: "Générer un rapport", module: "rapports" },
  { slug: "rapports.export", name: "Exporter PDF/Excel", module: "rapports" },
  // Utilisateurs
  { slug: "users.view", name: "Voir les utilisateurs", module: "utilisateurs" },
  { slug: "users.create", name: "Créer un utilisateur", module: "utilisateurs" },
  { slug: "users.edit", name: "Modifier un utilisateur", module: "utilisateurs" },
  { slug: "users.delete", name: "Supprimer un utilisateur", module: "utilisateurs" },
  // Rôles
  { slug: "roles.manage", name: "Gérer les rôles", module: "roles" },
  // Permissions
  { slug: "permissions.manage", name: "Gérer les permissions", module: "permissions" },
  // Paramètres
  { slug: "settings.view", name: "Voir les paramètres", module: "parametres" },
  { slug: "settings.edit", name: "Modifier les paramètres", module: "parametres" },
  // Protocoles
  { slug: "protocoles.view", name: "Voir les protocoles", module: "protocoles" },
  { slug: "protocoles.manage", name: "Gérer les protocoles", module: "protocoles" },
  // Seuils
  { slug: "seuils.manage", name: "Configurer les seuils d'alerte", module: "seuils" },
  // OCR
  { slug: "ocr.scan", name: "Scanner un formulaire OCR", module: "ocr" },
  // UISTI
  { slug: "uisti.morbidite", name: "Accéder à la morbidité hospitalière MDO", module: "uisti" },
  { slug: "uisti.mortalite", name: "Accéder au croisement mortalité-MDO", module: "uisti" },
  // UHH — Unité d'Hygiène Hospitalière
  { slug: "uhh.ias.view", name: "Voir les infections IAS", module: "uhh" },
  { slug: "uhh.ias.create", name: "Déclarer une infection IAS", module: "uhh" },
  { slug: "uhh.ias.edit", name: "Modifier une infection IAS", module: "uhh" },
  { slug: "uhh.dashboard", name: "Voir le tableau de bord UHH", module: "uhh" },
]

export const ROLES_SEED = [
  {
    name: "Médecin Déclarant",
    slug: "medecin",
    description: "Médecin autorisé à déclarer des cas MDO",
    color: "#1B4F8A",
    isSystem: true,
    permissions: [
      "dashboard.view",
      "cas.create", "cas.view_own", "cas.edit",
      "alertes.view",
      "protocoles.view",
      "ocr.scan",
    ],
  },
  {
    name: "Épidémiologiste",
    slug: "epidemiologiste",
    description: "Épidémiologiste chargé des investigations et analyses",
    color: "#0E7C5A",
    isSystem: true,
    permissions: [
      "dashboard.view",
      "cas.create", "cas.view_own", "cas.view_all", "cas.edit", "cas.change_status",
      "investigation.create", "investigation.view", "investigation.edit",
      "contacts.manage",
      "alertes.view", "alertes.create", "alertes.manage",
      "analyses.view",
      "rapports.view", "rapports.generate", "rapports.export",
      "protocoles.view", "protocoles.manage",
      "seuils.manage",
      "ocr.scan",
    ],
  },
  {
    name: "Unité UISTI",
    slug: "uisti",
    description: "Unité d'Information Sanitaire et Techniques Informatiques — accès aux données MDO hospitalisées",
    color: "#B45309",
    isSystem: true,
    permissions: [
      "uisti.morbidite",
      "uisti.mortalite",
    ],
  },
  {
    name: "Hygiéniste UHH",
    slug: "uhh",
    description: "Unité d'Hygiène Hospitalière — surveillance des infections associées aux soins (IAS)",
    color: "#0F766E",
    isSystem: true,
    permissions: [
      "uhh.dashboard",
      "uhh.ias.view",
      "uhh.ias.create",
      "uhh.ias.edit",
    ],
  },
  {
    name: "Administrateur",
    slug: "admin",
    description: "Administrateur système avec accès complet",
    color: "#7C3AED",
    isSystem: true,
    permissions: [
      "dashboard.view",
      "cas.create", "cas.view_own", "cas.view_all", "cas.edit", "cas.delete", "cas.change_status",
      "investigation.create", "investigation.view", "investigation.edit",
      "contacts.manage",
      "alertes.view", "alertes.create", "alertes.manage",
      "analyses.view",
      "rapports.view", "rapports.generate", "rapports.export",
      "users.view", "users.create", "users.edit", "users.delete",
      "roles.manage",
      "permissions.manage",
      "settings.view", "settings.edit",
      "protocoles.view",
    ],
  },
]
