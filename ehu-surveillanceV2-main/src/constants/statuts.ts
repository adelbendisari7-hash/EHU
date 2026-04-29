import { CasStatut } from "@/types"

export const CAS_STATUTS: Record<CasStatut, { label: string; color: string; bg: string; border: string }> = {
  brouillon: {
    label: "Brouillon",
    color: "#9333EA",
    bg: "#F5F3FF",
    border: "#DDD6FE",
  },
  nouveau: {
    label: "Nouveau",
    color: "#1B4F8A",
    bg: "#EBF1FA",
    border: "#C5DAFC",
  },
  en_cours: {
    label: "En cours",
    color: "#D97706",
    bg: "#FFFBEB",
    border: "#FDE68A",
  },
  confirme: {
    label: "Confirmé",
    color: "#DC2626",
    bg: "#FEF2F2",
    border: "#FECACA",
  },
  suspect: {
    label: "Suspect",
    color: "#EA580C",
    bg: "#FFF7ED",
    border: "#FED7AA",
  },
  infirme: {
    label: "Infirmé",
    color: "#6B7280",
    bg: "#F3F4F6",
    border: "#D1D5DB",
  },
  cloture: {
    label: "Clôturé",
    color: "#059669",
    bg: "#ECFDF5",
    border: "#A7F3D0",
  },
}
