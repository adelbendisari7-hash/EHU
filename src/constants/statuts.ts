import { CasStatut } from "@/types"

export const CAS_STATUTS: Record<CasStatut, { label: string; color: string; bg: string; border: string }> = {
  brouillon: {
    label: "Brouillon",
    color: "#6B7280",
    bg: "#F3F4F6",
    border: "#D1D5DB",
  },
  suspect: {
    label: "Suspect",
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
}
