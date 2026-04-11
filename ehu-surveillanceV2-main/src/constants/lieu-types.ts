// Types de lieux fréquentés
export const LIEU_TYPES = [
  { code: "domicile", label: "Domicile" },
  { code: "travail", label: "Lieu de travail" },
  { code: "ecole", label: "École / Université" },
  { code: "marche", label: "Marché" },
  { code: "mosquee", label: "Mosquée" },
  { code: "hopital", label: "Hôpital / Clinique" },
  { code: "transport", label: "Transport en commun" },
  { code: "restaurant", label: "Restaurant / Café" },
  { code: "sport", label: "Salle de sport / Stade" },
  { code: "autre", label: "Autre" },
] as const

export type LieuTypeCode = (typeof LIEU_TYPES)[number]["code"]
