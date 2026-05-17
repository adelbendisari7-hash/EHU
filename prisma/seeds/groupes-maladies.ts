/**
 * Tableau groupe de maladies — from official Algerian MDO classification
 * Maps each disease to its epidemiological group, alert threshold, and declaration delay.
 */

export interface GroupeMaladieEntry {
  codeCim10: string
  groupe: string
  seuilTexte: string
  seuilNombre: number
  delaiTexte: string
  delaiHeures: number
  periodeJours: number
  gravite: "attention" | "urgent" | "critique"
}

export const GROUPE_LABELS: Record<string, { label: string; color: string; description: string }> = {
  zoonose:      { label: "Zoonose",       color: "#D97706", description: "Maladies transmises de l'animal à l'homme" },
  pev:          { label: "PEV",           color: "#7C3AED", description: "Programme Élargi de Vaccination" },
  mth:          { label: "MTH",           color: "#2563EB", description: "Maladies à Transmission Hydrique" },
  ist:          { label: "IST",           color: "#DC2626", description: "Infections Sexuellement Transmissibles" },
  nosocomiale:  { label: "Nosocomiale",   color: "#059669", description: "Infections associées aux soins" },
  vectorielle:  { label: "Vectorielle",   color: "#EA580C", description: "Maladies transmises par un vecteur" },
  autre:        { label: "Autre",         color: "#6B7280", description: "Autres maladies à déclaration obligatoire" },
}

export const GROUPES_MALADIES: GroupeMaladieEntry[] = [
  // ═══ ZOONOSES ═══
  { codeCim10: "A23",   groupe: "zoonose",     seuilTexte: ">= 2 cas",   seuilNombre: 2, delaiTexte: "24h",          delaiHeures: 24,  periodeJours: 30, gravite: "urgent" },
  { codeCim10: "A22",   groupe: "zoonose",     seuilTexte: "1 cas",      seuilNombre: 1, delaiTexte: "24h",          delaiHeures: 24,  periodeJours: 30, gravite: "critique" },
  { codeCim10: "B67",   groupe: "zoonose",     seuilTexte: ">= 2 cas",   seuilNombre: 2, delaiTexte: "24h",          delaiHeures: 24,  periodeJours: 30, gravite: "urgent" },
  { codeCim10: "A27",   groupe: "zoonose",     seuilTexte: "1 cas",      seuilNombre: 1, delaiTexte: "24h",          delaiHeures: 24,  periodeJours: 30, gravite: "critique" },
  { codeCim10: "A32",   groupe: "zoonose",     seuilTexte: "1 cas",      seuilNombre: 1, delaiTexte: "24h",          delaiHeures: 24,  periodeJours: 30, gravite: "critique" },
  { codeCim10: "A82",   groupe: "zoonose",     seuilTexte: "1 cas",      seuilNombre: 1, delaiTexte: "24h",          delaiHeures: 24,  periodeJours: 30, gravite: "critique" },

  // ═══ PEV ═══
  { codeCim10: "A37",   groupe: "pev",         seuilTexte: ">= 2 cas",   seuilNombre: 2, delaiTexte: "24h",          delaiHeures: 24,  periodeJours: 30, gravite: "urgent" },
  { codeCim10: "A36",   groupe: "pev",         seuilTexte: "1 cas",      seuilNombre: 1, delaiTexte: "24h",          delaiHeures: 24,  periodeJours: 30, gravite: "critique" },
  { codeCim10: "B05",   groupe: "pev",         seuilTexte: "1 cas hospitalisé ou 2 cas liés", seuilNombre: 1, delaiTexte: "immédiat", delaiHeures: 1, periodeJours: 30, gravite: "critique" },
  { codeCim10: "B06",   groupe: "pev",         seuilTexte: ">= 2 cas",   seuilNombre: 2, delaiTexte: "24h",          delaiHeures: 24,  periodeJours: 30, gravite: "urgent" },
  { codeCim10: "A33",   groupe: "pev",         seuilTexte: "1 cas",      seuilNombre: 1, delaiTexte: "24h",          delaiHeures: 24,  periodeJours: 30, gravite: "critique" },
  { codeCim10: "A35",   groupe: "pev",         seuilTexte: "1 cas",      seuilNombre: 1, delaiTexte: "24h",          delaiHeures: 24,  periodeJours: 30, gravite: "critique" },
  { codeCim10: "A15",   groupe: "pev",         seuilTexte: "augmentation inhabituelle", seuilNombre: 10, delaiTexte: "mensuel", delaiHeures: 720, periodeJours: 30, gravite: "attention" },
  { codeCim10: "A18",   groupe: "pev",         seuilTexte: "augmentation inhabituelle", seuilNombre: 10, delaiTexte: "mensuel", delaiHeures: 720, periodeJours: 30, gravite: "attention" },
  { codeCim10: "A80",   groupe: "pev",         seuilTexte: "1 cas",      seuilNombre: 1, delaiTexte: "immédiat",     delaiHeures: 1,   periodeJours: 30, gravite: "critique" },
  { codeCim10: "B03",   groupe: "pev",         seuilTexte: "1 cas",      seuilNombre: 1, delaiTexte: "24h",          delaiHeures: 24,  periodeJours: 30, gravite: "critique" },

  // ═══ MTH ═══
  { codeCim10: "A06",   groupe: "mth",         seuilTexte: ">= 3 cas",   seuilNombre: 3, delaiTexte: "24h",          delaiHeures: 24,  periodeJours: 30, gravite: "urgent" },
  { codeCim10: "A01",   groupe: "mth",         seuilTexte: ">= 2 cas",   seuilNombre: 2, delaiTexte: "24h",          delaiHeures: 24,  periodeJours: 30, gravite: "urgent" },
  { codeCim10: "B15",   groupe: "mth",         seuilTexte: ">= 2 cas",   seuilNombre: 2, delaiTexte: "24h",          delaiHeures: 24,  periodeJours: 30, gravite: "urgent" },
  { codeCim10: "A48",   groupe: "mth",         seuilTexte: ">= 2 cas",   seuilNombre: 2, delaiTexte: "24h",          delaiHeures: 24,  periodeJours: 30, gravite: "urgent" },
  { codeCim10: "B65",   groupe: "mth",         seuilTexte: "1 cas",      seuilNombre: 1, delaiTexte: "24h",          delaiHeures: 24,  periodeJours: 30, gravite: "critique" },
  { codeCim10: "A05.9", groupe: "mth",         seuilTexte: ">= 2 cas",   seuilNombre: 2, delaiTexte: "24h",          delaiHeures: 24,  periodeJours: 30, gravite: "urgent" },
  { codeCim10: "A00",   groupe: "mth",         seuilTexte: "1 cas suspect", seuilNombre: 1, delaiTexte: "24h",       delaiHeures: 24,  periodeJours: 30, gravite: "critique" },

  // ═══ IST ═══
  { codeCim10: "B16",   groupe: "ist",         seuilTexte: ">= 3 cas",   seuilNombre: 3, delaiTexte: "hebdomadaire", delaiHeures: 168, periodeJours: 30, gravite: "attention" },
  { codeCim10: "B17",   groupe: "ist",         seuilTexte: ">= 3 cas",   seuilNombre: 3, delaiTexte: "hebdomadaire", delaiHeures: 168, periodeJours: 30, gravite: "attention" },
  { codeCim10: "A74",   groupe: "ist",         seuilTexte: ">= 3 cas",   seuilNombre: 3, delaiTexte: "hebdomadaire", delaiHeures: 168, periodeJours: 30, gravite: "attention" },
  { codeCim10: "B24",   groupe: "ist",         seuilTexte: "1 cas confirmé", seuilNombre: 1, delaiTexte: "hebdomadaire", delaiHeures: 168, periodeJours: 30, gravite: "urgent" },
  { codeCim10: "A53",   groupe: "ist",         seuilTexte: ">= 3 cas",   seuilNombre: 3, delaiTexte: "hebdomadaire", delaiHeures: 168, periodeJours: 30, gravite: "attention" },
  { codeCim10: "A54",   groupe: "ist",         seuilTexte: ">= 3 cas",   seuilNombre: 3, delaiTexte: "hebdomadaire", delaiHeures: 168, periodeJours: 30, gravite: "attention" },

  // ═══ NOSOCOMIALES ═══
  { codeCim10: "U82",   groupe: "nosocomiale", seuilTexte: "1 cas BTR ou >= 2 cas liés", seuilNombre: 1, delaiTexte: "immédiat", delaiHeures: 1, periodeJours: 7, gravite: "critique" },
  { codeCim10: "Y62",   groupe: "nosocomiale", seuilTexte: ">= 2 cas même chirurgie",    seuilNombre: 2, delaiTexte: "immédiat", delaiHeures: 1, periodeJours: 7, gravite: "critique" },
  { codeCim10: "J95",   groupe: "nosocomiale", seuilTexte: ">= 2 cas même service / 7j", seuilNombre: 2, delaiTexte: "immédiat", delaiHeures: 1, periodeJours: 7, gravite: "critique" },

  // ═══ VECTORIELLES ═══
  { codeCim10: "B551",  groupe: "vectorielle", seuilTexte: ">= 3 cas / localité", seuilNombre: 3, delaiTexte: "24h", delaiHeures: 24, periodeJours: 30, gravite: "urgent" },
  { codeCim10: "B550",  groupe: "vectorielle", seuilTexte: "1 cas",      seuilNombre: 1, delaiTexte: "24h",          delaiHeures: 24,  periodeJours: 30, gravite: "critique" },
  { codeCim10: "B54",   groupe: "vectorielle", seuilTexte: "1 cas",      seuilNombre: 1, delaiTexte: "immédiat",     delaiHeures: 1,   periodeJours: 30, gravite: "critique" },
  { codeCim10: "A20",   groupe: "vectorielle", seuilTexte: "1 cas suspect", seuilNombre: 1, delaiTexte: "24h",       delaiHeures: 24,  periodeJours: 30, gravite: "critique" },
  { codeCim10: "A77",   groupe: "vectorielle", seuilTexte: "1 cas",      seuilNombre: 1, delaiTexte: "24h",          delaiHeures: 24,  periodeJours: 30, gravite: "urgent" },
  { codeCim10: "A71",   groupe: "vectorielle", seuilTexte: "1 cas",      seuilNombre: 1, delaiTexte: "24h",          delaiHeures: 24,  periodeJours: 30, gravite: "urgent" },
  { codeCim10: "A75",   groupe: "vectorielle", seuilTexte: "1 cas",      seuilNombre: 1, delaiTexte: "24h",          delaiHeures: 24,  periodeJours: 30, gravite: "critique" },
  { codeCim10: "A92",   groupe: "vectorielle", seuilTexte: "1 cas",      seuilNombre: 1, delaiTexte: "24h",          delaiHeures: 24,  periodeJours: 30, gravite: "critique" },
  { codeCim10: "A90",   groupe: "vectorielle", seuilTexte: "1 cas",      seuilNombre: 1, delaiTexte: "24h",          delaiHeures: 24,  periodeJours: 30, gravite: "critique" },
  { codeCim10: "A984",  groupe: "vectorielle", seuilTexte: "1 cas",      seuilNombre: 1, delaiTexte: "24h",          delaiHeures: 24,  periodeJours: 30, gravite: "critique" },
  { codeCim10: "A95",   groupe: "vectorielle", seuilTexte: "1 cas",      seuilNombre: 1, delaiTexte: "24h",          delaiHeures: 24,  periodeJours: 30, gravite: "critique" },
  { codeCim10: "A923",  groupe: "vectorielle", seuilTexte: "1 cas",      seuilNombre: 1, delaiTexte: "24h",          delaiHeures: 24,  periodeJours: 30, gravite: "critique" },
  { codeCim10: "A924",  groupe: "vectorielle", seuilTexte: "1 cas",      seuilNombre: 1, delaiTexte: "24h",          delaiHeures: 24,  periodeJours: 30, gravite: "critique" },
  { codeCim10: "A988",  groupe: "vectorielle", seuilTexte: "1 cas",      seuilNombre: 1, delaiTexte: "24h",          delaiHeures: 24,  periodeJours: 30, gravite: "critique" },

  // ═══ AUTRES ═══
  { codeCim10: "A05.1", groupe: "autre",       seuilTexte: "1 cas",      seuilNombre: 1, delaiTexte: "24h",          delaiHeures: 24,  periodeJours: 30, gravite: "critique" },
  { codeCim10: "A30",   groupe: "autre",       seuilTexte: "1 cas",      seuilNombre: 1, delaiTexte: "24h",          delaiHeures: 24,  periodeJours: 30, gravite: "urgent" },
  { codeCim10: "G000",  groupe: "autre",       seuilTexte: "1 cas",      seuilNombre: 1, delaiTexte: "immédiat",     delaiHeures: 1,   periodeJours: 30, gravite: "critique" },
  { codeCim10: "G01A39",groupe: "autre",       seuilTexte: "1 cas",      seuilNombre: 1, delaiTexte: "immédiat",     delaiHeures: 1,   periodeJours: 30, gravite: "critique" },
  { codeCim10: "G01",   groupe: "autre",       seuilTexte: ">= 2 cas",   seuilNombre: 2, delaiTexte: "immédiat",     delaiHeures: 1,   periodeJours: 30, gravite: "critique" },
  { codeCim10: "G03",   groupe: "autre",       seuilTexte: ">= 2 cas",   seuilNombre: 2, delaiTexte: "immédiat",     delaiHeures: 1,   periodeJours: 30, gravite: "urgent" },
  { codeCim10: "G05",   groupe: "autre",       seuilTexte: "1 cas",      seuilNombre: 1, delaiTexte: "immédiat",     delaiHeures: 1,   periodeJours: 30, gravite: "critique" },
  { codeCim10: "G82",   groupe: "autre",       seuilTexte: "1 cas",      seuilNombre: 1, delaiTexte: "immédiat",     delaiHeures: 1,   periodeJours: 30, gravite: "critique" },
  { codeCim10: "J10",   groupe: "autre",       seuilTexte: "1 cas",      seuilNombre: 1, delaiTexte: "24h",          delaiHeures: 24,  periodeJours: 30, gravite: "critique" },
  { codeCim10: "U04",   groupe: "autre",       seuilTexte: "1 cas",      seuilNombre: 1, delaiTexte: "24h",          delaiHeures: 24,  periodeJours: 30, gravite: "critique" },
  { codeCim10: "U07",   groupe: "autre",       seuilTexte: "1 cas",      seuilNombre: 1, delaiTexte: "24h",          delaiHeures: 24,  periodeJours: 30, gravite: "critique" },
  { codeCim10: "U071",  groupe: "autre",       seuilTexte: "1 cas",      seuilNombre: 1, delaiTexte: "24h",          delaiHeures: 24,  periodeJours: 30, gravite: "critique" },
]
