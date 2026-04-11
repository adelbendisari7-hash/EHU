// Reference symptom codes for epidemiological surveillance
// Grouped by category for the multi-select combobox

export interface SymptomRef {
  code: string
  nom: string
  categorie: string
}

export const SYMPTOM_CATEGORIES = [
  { key: "general", label: "Généraux" },
  { key: "respiratoire", label: "Respiratoires" },
  { key: "digestif", label: "Digestifs" },
  { key: "neurologique", label: "Neurologiques" },
  { key: "cutane", label: "Cutanés" },
  { key: "musculosquelettique", label: "Musculo-squelettiques" },
  { key: "urinaire", label: "Urinaires" },
  { key: "orl", label: "ORL" },
  { key: "ophtalmologique", label: "Ophtalmologiques" },
  { key: "cardiovasculaire", label: "Cardiovasculaires" },
] as const

export const SYMPTOMS: SymptomRef[] = [
  // Généraux
  { code: "FIEVRE", nom: "Fièvre", categorie: "general" },
  { code: "ASTHENIE", nom: "Asthénie", categorie: "general" },
  { code: "AMAIGRISSEMENT", nom: "Amaigrissement", categorie: "general" },
  { code: "FRISSONS", nom: "Frissons", categorie: "general" },
  { code: "SUEURS_NOCTURNES", nom: "Sueurs nocturnes", categorie: "general" },
  { code: "ANOREXIE", nom: "Anorexie", categorie: "general" },
  { code: "MALAISE", nom: "Malaise général", categorie: "general" },
  { code: "DESHYDRATATION", nom: "Déshydratation", categorie: "general" },

  // Respiratoires
  { code: "TOUX", nom: "Toux", categorie: "respiratoire" },
  { code: "DYSPNEE", nom: "Dyspnée", categorie: "respiratoire" },
  { code: "EXPECTORATION", nom: "Expectoration", categorie: "respiratoire" },
  { code: "HEMOPTYSIE", nom: "Hémoptysie", categorie: "respiratoire" },
  { code: "DOULEUR_THORACIQUE", nom: "Douleur thoracique", categorie: "respiratoire" },
  { code: "RHINORRHEE", nom: "Rhinorrhée", categorie: "respiratoire" },
  { code: "CYANOSE", nom: "Cyanose", categorie: "respiratoire" },

  // Digestifs
  { code: "DIARRHEE", nom: "Diarrhée", categorie: "digestif" },
  { code: "VOMISSEMENTS", nom: "Vomissements", categorie: "digestif" },
  { code: "NAUSEES", nom: "Nausées", categorie: "digestif" },
  { code: "DOULEUR_ABDOMINALE", nom: "Douleur abdominale", categorie: "digestif" },
  { code: "ICTERE", nom: "Ictère", categorie: "digestif" },
  { code: "HEPATOMEGALIE", nom: "Hépatomégalie", categorie: "digestif" },
  { code: "SPLENOMEGALIE", nom: "Splénomégalie", categorie: "digestif" },
  { code: "RECTORRAGIE", nom: "Rectorragie", categorie: "digestif" },
  { code: "DYSPHAGIE", nom: "Dysphagie", categorie: "digestif" },

  // Neurologiques
  { code: "CEPHALEE", nom: "Céphalée", categorie: "neurologique" },
  { code: "RAIDEUR_NUQUE", nom: "Raideur de la nuque", categorie: "neurologique" },
  { code: "CONVULSIONS", nom: "Convulsions", categorie: "neurologique" },
  { code: "CONFUSION", nom: "Confusion", categorie: "neurologique" },
  { code: "PARALYSIE", nom: "Paralysie", categorie: "neurologique" },
  { code: "PHOTOPHOBIE", nom: "Photophobie", categorie: "neurologique" },
  { code: "TROUBLES_CONSCIENCE", nom: "Troubles de la conscience", categorie: "neurologique" },

  // Cutanés
  { code: "ERUPTION_CUTANEE", nom: "Éruption cutanée", categorie: "cutane" },
  { code: "PURPURA", nom: "Purpura", categorie: "cutane" },
  { code: "PRURIT", nom: "Prurit", categorie: "cutane" },
  { code: "ULCERATION", nom: "Ulcération", categorie: "cutane" },
  { code: "OEDEME", nom: "Œdème", categorie: "cutane" },
  { code: "VESICULES", nom: "Vésicules", categorie: "cutane" },

  // Musculo-squelettiques
  { code: "ARTHRALGIE", nom: "Arthralgie", categorie: "musculosquelettique" },
  { code: "MYALGIE", nom: "Myalgie", categorie: "musculosquelettique" },
  { code: "LOMBALGIE", nom: "Lombalgie", categorie: "musculosquelettique" },

  // Urinaires
  { code: "DYSURIE", nom: "Dysurie", categorie: "urinaire" },
  { code: "HEMATURIE", nom: "Hématurie", categorie: "urinaire" },
  { code: "OLIGURIE", nom: "Oligurie", categorie: "urinaire" },

  // ORL
  { code: "ODYNOPHAGIE", nom: "Odynophagie", categorie: "orl" },
  { code: "OTALGIE", nom: "Otalgie", categorie: "orl" },
  { code: "ADENOPATHIE", nom: "Adénopathie", categorie: "orl" },

  // Ophtalmologiques
  { code: "CONJONCTIVITE", nom: "Conjonctivite", categorie: "ophtalmologique" },
  { code: "LARMOIEMENT", nom: "Larmoiement", categorie: "ophtalmologique" },

  // Cardiovasculaires
  { code: "TACHYCARDIE", nom: "Tachycardie", categorie: "cardiovasculaire" },
  { code: "HYPOTENSION", nom: "Hypotension", categorie: "cardiovasculaire" },
]
