import { CAS_STATUTS } from "@/constants/statuts"
import type { CasStatut } from "@/types"

export default function CasStatusBadge({ statut }: { statut: CasStatut }) {
  const config = CAS_STATUTS[statut]
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
