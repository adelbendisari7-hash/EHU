"use client"

import { useState } from "react"
import { CheckSquare, Square } from "lucide-react"

const MESURES = [
  "Isolement du cas index",
  "Désinfection des locaux",
  "Vaccination des contacts",
  "Information des autorités sanitaires",
  "Prélèvements biologiques effectués",
  "Renforcement de la surveillance",
  "Sensibilisation de la communauté",
  "Fermeture temporaire de l'établissement",
]

interface Props {
  investigationId: string
  initialMesures: string[]
}

export default function MesuresControle({ investigationId, initialMesures }: Props) {
  const [selected, setSelected] = useState<string[]>(initialMesures)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const toggle = (mesure: string) => {
    setSelected(prev => prev.includes(mesure) ? prev.filter(m => m !== mesure) : [...prev, mesure])
    setSaved(false)
  }

  const save = async () => {
    setSaving(true)
    await fetch(`/api/investigations/${investigationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mesuresControle: selected }),
    })
    setSaving(false)
    setSaved(true)
  }

  return (
    <div>
      <div className="space-y-2 mb-4">
        {MESURES.map(mesure => {
          const checked = selected.includes(mesure)
          return (
            <label key={mesure} className="flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all" style={{ borderColor: checked ? "#1B4F8A" : "#E5E7EB", backgroundColor: checked ? "#EEF4FF" : "white" }}>
              <input type="checkbox" checked={checked} onChange={() => toggle(mesure)} className="sr-only" />
              {checked ? <CheckSquare size={16} style={{ color: "#1B4F8A" }} /> : <Square size={16} className="text-gray-300" />}
              <span className="text-sm" style={{ color: checked ? "#1B4F8A" : "#4A5164" }}>{mesure}</span>
            </label>
          )
        })}
      </div>
      <button
        onClick={save}
        disabled={saving}
        className="px-4 py-2 rounded-lg text-sm text-white font-medium transition-colors disabled:opacity-60"
        style={{ backgroundColor: saving ? "#8A909B" : saved ? "#27AE60" : "#1B4F8A" }}
      >
        {saving ? "Enregistrement..." : saved ? "✓ Enregistré" : "Sauvegarder"}
      </button>
    </div>
  )
}
