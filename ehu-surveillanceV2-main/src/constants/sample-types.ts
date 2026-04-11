// Types de prélèvement for lab sample collection
export const SAMPLE_TYPES = [
  { code: "SANG", label: "Sang" },
  { code: "HEMOCULTURE", label: "Hémoculture" },
  { code: "URINE", label: "Urine (ECBU)" },
  { code: "SELLES", label: "Selles (Coproculture)" },
  { code: "LCR", label: "LCR (Liquide céphalo-rachidien)" },
  { code: "EXPECTORATION", label: "Expectoration" },
  { code: "LAVAGE_BRONCHO", label: "Lavage broncho-alvéolaire" },
  { code: "PRELEVEMENT_NASAL", label: "Prélèvement nasal" },
  { code: "PRELEVEMENT_GORGE", label: "Prélèvement de gorge" },
  { code: "PUS", label: "Pus" },
  { code: "LIQUIDE_PLEURAL", label: "Liquide pleural" },
  { code: "LIQUIDE_ASCITE", label: "Liquide d'ascite" },
  { code: "LIQUIDE_ARTICULAIRE", label: "Liquide articulaire" },
  { code: "BIOPSIE", label: "Biopsie" },
  { code: "SERUM", label: "Sérum" },
  { code: "FROTTIS_SANGUIN", label: "Frottis sanguin (Goutte épaisse)" },
  { code: "PRELEVEMENT_CUTANE", label: "Prélèvement cutané" },
  { code: "LIQUIDE_VESICULAIRE", label: "Liquide vésiculaire" },
  { code: "AUTRE", label: "Autre" },
] as const

export type SampleTypeCode = (typeof SAMPLE_TYPES)[number]["code"]
