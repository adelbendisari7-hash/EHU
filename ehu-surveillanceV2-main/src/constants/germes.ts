// Référentiel des agents infectieux BMR — Codes CIM-10
// Source : EHU Oran — Service d'Épidémiologie et de Médecine Préventive
export interface GermeRef {
  code: string  // Code CIM-10
  nom: string
  type: "bacterie" | "virus" | "parasite" | "champignon"
}

export const GERME_TYPES = [
  { key: "bacterie", label: "Bactéries" },
  { key: "virus", label: "Virus" },
  { key: "parasite", label: "Parasites" },
  { key: "champignon", label: "Champignons" },
] as const

export const GERMES: GermeRef[] = [
  // ── BMR — Résistance aux antibactériens (U82) ──────────────────────────────
  { code: "U82.0", nom: "Staphylococcus aureus résistant à la méticilline (SARM/MRSA)", type: "bacterie" },
  { code: "U82.1", nom: "Enterococcus faecalis/faecium résistant à la vancomycine (ERV/VRE)", type: "bacterie" },
  { code: "U82.2", nom: "Enterobacter cloacae multirésistant", type: "bacterie" },
  { code: "U82.2", nom: "Entérobactéries productrices de carbapénémases (EPC/CRE)", type: "bacterie" },
  { code: "U82.2", nom: "Entérobactéries productrices de β-lactamases à spectre étendu (BLSE/ESBL)", type: "bacterie" },
  { code: "U82.2", nom: "Escherichia coli multirésistant (y compris BLSE)", type: "bacterie" },
  { code: "U82.2", nom: "Klebsiella pneumoniae multirésistante (BLSE ou carbapénémase)", type: "bacterie" },
  { code: "U82.2", nom: "Résistance des entérobactéries aux céphalosporines de 3e génération (BLSE)", type: "bacterie" },
  { code: "U82.3", nom: "Pseudomonas aeruginosa multirésistant", type: "bacterie" },
  { code: "U82.4", nom: "Acinetobacter baumannii multirésistant", type: "bacterie" },
  { code: "U82.5", nom: "Staphylococcus aureus résistant à la vancomycine (VRSA)", type: "bacterie" },
  { code: "U82.8", nom: "Autres bactéries résistantes (à préciser)", type: "bacterie" },
  { code: "U82.8", nom: "Stenotrophomonas maltophilia multirésistant", type: "bacterie" },
  { code: "U82.9", nom: "Résistance d'organisme non spécifié aux antibiotiques", type: "bacterie" },

  // ── Résistance aux antituberculeux (U83) ───────────────────────────────────
  { code: "U83.0", nom: "Mycobacterium tuberculosis multirésistant (MDR-TB)", type: "bacterie" },
  { code: "U83.0", nom: "Tuberculose multirésistante (MDR-TB)", type: "bacterie" },
  { code: "U83.1", nom: "Mycobacterium tuberculosis ultrarésistant (XDR-TB)", type: "bacterie" },
  { code: "U83.1", nom: "Tuberculose ultrarésistante (XDR-TB)", type: "bacterie" },
  { code: "U83.8", nom: "Résistance à d'autres antituberculeux précisés", type: "bacterie" },
  { code: "U83.9", nom: "Résistance non spécifiée aux antituberculeux", type: "bacterie" },

  // ── Résistance aux autres antimicrobiens (U84) ─────────────────────────────
  { code: "U84.0", nom: "Résistance aux antiviraux", type: "virus" },
  { code: "U84.1", nom: "Résistance aux antifongiques", type: "champignon" },
  { code: "U84.2", nom: "Résistance aux antiparasitaires", type: "parasite" },

  // ── Autres agents bactériens (B96) ─────────────────────────────────────────
  { code: "B96.4", nom: "Proteus mirabilis", type: "bacterie" },
  { code: "B96.9", nom: "Morganella morganii", type: "bacterie" },
]
