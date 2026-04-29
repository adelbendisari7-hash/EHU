"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { CasStatut } from "@/types"
import { CAS_STATUTS } from "@/constants/statuts"

const WORKFLOW: Record<CasStatut, CasStatut[]> = {
  brouillon: ["nouveau"],
  nouveau: ["en_cours"],
  suspect: ["en_cours", "infirme"],
  en_cours: ["confirme", "infirme"],
  confirme: ["cloture"],
  infirme: ["cloture"],
  cloture: [],
}

export default function CasStatusChanger({ casId, currentStatut }: { casId: string; currentStatut: CasStatut }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const nextStatuts = WORKFLOW[currentStatut]

  if (!nextStatuts.length) return null

  const changeStatut = async (statut: CasStatut) => {
    setLoading(true)
    await fetch(`/api/cas/${casId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut }),
    })
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="flex gap-2">
      {nextStatuts.map(s => {
        const config = CAS_STATUTS[s]
        return (
          <button
            key={s}
            onClick={() => changeStatut(s)}
            disabled={loading}
            className="px-3 py-2 rounded-lg text-xs font-medium border transition-colors disabled:opacity-60"
            style={{ backgroundColor: config.bg, color: config.color, borderColor: config.border }}
          >
            → {config.label}
          </button>
        )
      })}
    </div>
  )
}
