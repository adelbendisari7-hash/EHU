"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { cn } from "@/utils/cn"

interface CasDetail {
  id: string
  codeCas: string
  service: string
  notesCliniques: string | null
  modeConfirmation: string
  resultatLabo: string | null
  statut: string
  maladie: { id: string; nom: string }
  patient: { firstName: string; lastName: string }
}

export default function EditCasPage() {
  const params = useParams()
  const router = useRouter()
  const casId = params.casId as string
  const [cas, setCas] = useState<CasDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({ service: "", notesCliniques: "", resultatLabo: "" })

  useEffect(() => {
    fetch(`/api/cas/${casId}`).then(r => r.json()).then(data => {
      setCas(data)
      setForm({
        service: data.service ?? "",
        notesCliniques: data.notesCliniques ?? "",
        resultatLabo: data.resultatLabo ?? "",
      })
      setLoading(false)
    })
  }, [casId])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")
    const res = await fetch(`/api/cas/${casId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    if (!res.ok) {
      setError("Erreur lors de la mise à jour")
      setSaving(false)
      return
    }
    router.push(`/declarations/${casId}`)
  }

  const inputClass = "w-full h-10 px-3 rounded-lg border border-gray-200 text-sm outline-none transition-all focus:border-[#1B4F8A] focus:ring-2"

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: "#1B4F8A" }} />
    </div>
  )

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/declarations/${casId}`} className="text-sm text-gray-400 hover:text-gray-600">← Retour</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-semibold text-gray-800">Modifier le Cas — {cas?.codeCas}</h1>
      </div>

      <form onSubmit={save} className="max-w-2xl">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-4">
          <div className="px-5 py-3 flex items-center gap-3" style={{ backgroundColor: "#1B4F8A" }}>
            <h2 className="text-white font-semibold text-sm">Informations Modifiables</h2>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Patient</label>
              <div className="h-10 px-3 rounded-lg border border-gray-100 bg-gray-50 flex items-center text-sm text-gray-500">
                {cas?.patient.firstName} {cas?.patient.lastName}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Maladie</label>
              <div className="h-10 px-3 rounded-lg border border-gray-100 bg-gray-50 flex items-center text-sm text-gray-500">
                {cas?.maladie.nom}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Service *</label>
              <input
                value={form.service}
                onChange={e => setForm(f => ({ ...f, service: e.target.value }))}
                className={inputClass}
                placeholder="Service médical"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Notes Cliniques</label>
              <textarea
                value={form.notesCliniques}
                onChange={e => setForm(f => ({ ...f, notesCliniques: e.target.value }))}
                rows={4}
                className={cn(inputClass, "h-auto py-2 resize-none")}
                placeholder="Observations cliniques..."
                maxLength={2000}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Résultat Laboratoire</label>
              <textarea
                value={form.resultatLabo}
                onChange={e => setForm(f => ({ ...f, resultatLabo: e.target.value }))}
                rows={3}
                className={cn(inputClass, "h-auto py-2 resize-none")}
                placeholder="Résultats d'analyses..."
              />
            </div>
          </div>
        </div>

        {error && <div className="p-3 mb-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>}

        <div className="flex gap-3">
          <Link href={`/declarations/${casId}`} className="px-6 py-3 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            Annuler
          </Link>
          <button type="submit" disabled={saving} className="flex-1 py-3 rounded-lg text-white text-sm font-medium transition-all disabled:opacity-60" style={{ backgroundColor: "#1B4F8A" }}>
            {saving ? "Enregistrement..." : "Sauvegarder les Modifications"}
          </button>
        </div>
      </form>
    </div>
  )
}
