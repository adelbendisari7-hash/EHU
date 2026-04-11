"use client"

import { useState } from "react"

interface Props {
  investigationId: string
  initialConclusion: string
  statut: string
}

export default function InvestigationConclusion({ investigationId, initialConclusion, statut }: Props) {
  const [conclusion, setConclusion] = useState(initialConclusion)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const save = async () => {
    setSaving(true)
    await fetch(`/api/investigations/${investigationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conclusion }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div>
      <textarea
        value={conclusion}
        onChange={e => { setConclusion(e.target.value); setSaved(false) }}
        disabled={statut === "terminee"}
        rows={4}
        placeholder="Rédigez la conclusion de l'investigation épidémiologique..."
        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#1B4F8A] resize-none disabled:bg-gray-50 disabled:text-gray-500"
      />
      {statut !== "terminee" && (
        <button
          onClick={save}
          disabled={saving}
          className="mt-2 px-4 py-2 rounded-lg text-sm text-white font-medium transition-colors disabled:opacity-60"
          style={{ backgroundColor: saved ? "#27AE60" : "#1B4F8A" }}
        >
          {saving ? "Enregistrement..." : saved ? "✓ Enregistré" : "Sauvegarder la Conclusion"}
        </button>
      )}
    </div>
  )
}
