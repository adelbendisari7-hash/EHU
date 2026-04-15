export type Secteur = "Médecine" | "Chirurgie" | "Réanimation" | "Laboratoire"

export interface ServiceEHU {
  code: number
  nom: string
  secteur: Secteur
}

export const SERVICES_EHU: ServiceEHU[] = [
  // ── Médecine ──────────────────────────────────────────────────────────
  { code: 1,  nom: "MPR",                                       secteur: "Médecine" },
  { code: 2,  nom: "Cardiologie",                               secteur: "Médecine" },
  { code: 3,  nom: "Médecine interne",                          secteur: "Médecine" },
  { code: 4,  nom: "Hépato-gastro-entérologie",                 secteur: "Médecine" },
  { code: 5,  nom: "Nephrologie-hémodialyse",                   secteur: "Médecine" },
  { code: 6,  nom: "Dermatologie",                              secteur: "Médecine" },
  { code: 7,  nom: "Pneumologie",                               secteur: "Médecine" },
  { code: 8,  nom: "Hématologie",                               secteur: "Médecine" },
  { code: 9,  nom: "Oncologie",                                 secteur: "Médecine" },
  { code: 10, nom: "Endocrinologie",                            secteur: "Médecine" },
  { code: 11, nom: "Neurologie médicale",                       secteur: "Médecine" },
  { code: 12, nom: "Médecine de travail",                       secteur: "Médecine" },
  { code: 13, nom: "Médecine légale",                           secteur: "Médecine" },

  // ── Chirurgie ──────────────────────────────────────────────────────────
  { code: 14, nom: "Chirurgie Hépato-biliaire",                 secteur: "Chirurgie" },
  { code: 15, nom: "Neurochirurgie",                            secteur: "Chirurgie" },
  { code: 16, nom: "Chirurgie générale",                        secteur: "Chirurgie" },
  { code: 17, nom: "Chirurgie urologique",                      secteur: "Chirurgie" },
  { code: 18, nom: "Chirurgie traumatologique et orthopédique", secteur: "Chirurgie" },
  { code: 19, nom: "Chirurgie thoracique",                      secteur: "Chirurgie" },
  { code: 20, nom: "Chirurgie vasculaire",                      secteur: "Chirurgie" },
  { code: 21, nom: "Chirurgie cardiaque",                       secteur: "Chirurgie" },
  { code: 22, nom: "Chirurgie maxillo-faciale",                 secteur: "Chirurgie" },
  { code: 23, nom: "ORL",                                       secteur: "Chirurgie" },
  { code: 24, nom: "Gynécologie obstétrique",                   secteur: "Chirurgie" },

  // ── Réanimation ────────────────────────────────────────────────────────
  { code: 25, nom: "Réanimation médicale",                      secteur: "Réanimation" },
  { code: 26, nom: "Réanimation chirurgicale",                  secteur: "Réanimation" },
  { code: 27, nom: "Réanimation pédiatrique",                   secteur: "Réanimation" },
  { code: 28, nom: "UMC",                                       secteur: "Réanimation" },
  { code: 29, nom: "USIC",                                      secteur: "Réanimation" },
  { code: 30, nom: "Réa-UMC",                                   secteur: "Réanimation" },

  // ── Laboratoire ───────────────────────────────────────────────────────
  { code: 31, nom: "Bactériologie",                             secteur: "Laboratoire" },
  { code: 32, nom: "Biochimie",                                 secteur: "Laboratoire" },
  { code: 33, nom: "Immunologie",                               secteur: "Laboratoire" },
  { code: 34, nom: "Médecine nucléaire",                        secteur: "Laboratoire" },
  { code: 35, nom: "Cytogénétique",                             secteur: "Laboratoire" },
  { code: 36, nom: "Hémobiologie",                              secteur: "Laboratoire" },
  { code: 37, nom: "Pharmacologie",                             secteur: "Laboratoire" },
  { code: 38, nom: "Anapath",                                   secteur: "Laboratoire" },
  { code: 39, nom: "Toxicologie",                               secteur: "Laboratoire" },
  { code: 40, nom: "Neurophysiologie",                          secteur: "Laboratoire" },
  { code: 41, nom: "CTS",                                       secteur: "Laboratoire" },
  { code: 42, nom: "Imagerie",                                  secteur: "Laboratoire" },
]

// Groupés par secteur pour les selects
export const SERVICES_PAR_SECTEUR = SERVICES_EHU.reduce<Record<Secteur, ServiceEHU[]>>(
  (acc, s) => { acc[s.secteur].push(s); return acc },
  { Médecine: [], Chirurgie: [], Réanimation: [], Laboratoire: [] }
)

// Valeur stockée en base : "01 — MPR" (code zéro-paddé + nom)
export function serviceLabel(s: ServiceEHU): string {
  return `${String(s.code).padStart(2, "0")} — ${s.nom}`
}
