import { CAS_STATUTS } from "@/constants/statuts"
import type { CasStatut } from "@/types"

const FALLBACK = { label: "Suspect", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" }

export default function CasStatusBadge({ statut }: { statut: string }) {
  const config = CAS_STATUTS[statut as CasStatut] ?? FALLBACK
  return (
    <span
      className="badge"
      style={{ backgroundColor: config.bg, color: config.color, border: `1px solid ${config.border}` }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: config.color }}
      />
      {config.label}
    </span>
  )
}
