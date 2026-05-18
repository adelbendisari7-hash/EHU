"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2 } from "lucide-react"

interface Action { action: string; detail: string; obligatoire: boolean }
interface Section { titre: string; priorite: string; actions: Action[] }
interface JsonContent { sections: Section[] }

interface Maladie { id: string; nom: string; codeCim10: string }

interface ProtocoleFormData {
  maladieId: string
  titre: string
  conduiteMedicale: JsonContent
  actionsAdministratives: JsonContent
  investigationSteps: JsonContent
  dureeSurveillance: string
}

const emptySection = (): Section => ({ titre: "", priorite: "haute", actions: [{ action: "", detail: "", obligatoire: true }] })
const emptyContent = (): JsonContent => ({ sections: [emptySection()] })

interface Props {
  initial?: Partial<ProtocoleFormData> & { id?: string }
}

function SectionEditor({
  label,
  content,
  onChange,
}: {
  label: string
  content: JsonContent
  onChange: (v: JsonContent) => void
}) {
  const addSection = () => onChange({ sections: [...content.sections, emptySection()] })
  const removeSection = (si: number) => onChange({ sections: content.sections.filter((_, i) => i !== si) })
  const addAction = (si: number) => {
    const secs = [...content.sections]
    secs[si] = { ...secs[si], actions: [...secs[si].actions, { action: "", detail: "", obligatoire: true }] }
    onChange({ sections: secs })
  }
  const removeAction = (si: number, ai: number) => {
    const secs = [...content.sections]
    secs[si] = { ...secs[si], actions: secs[si].actions.filter((_, i) => i !== ai) }
    onChange({ sections: secs })
  }
  const updateSection = (si: number, field: keyof Section, value: string) => {
    const secs = [...content.sections]
    secs[si] = { ...secs[si], [field]: value }
    onChange({ sections: secs })
  }
  const updateAction = (si: number, ai: number, field: keyof Action, value: string | boolean) => {
    const secs = [...content.sections]
    const actions = [...secs[si].actions]
    actions[ai] = { ...actions[ai], [field]: value }
    secs[si] = { ...secs[si], actions }
    onChange({ sections: secs })
  }

  const inputCls = "w-full h-8 px-2.5 rounded-lg border border-gray-200 text-xs outline-none focus:border-[#1B4F8A]"

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: "#1B4F8A" }}>
        <h3 className="text-white font-semibold text-sm">{label}</h3>
        <button type="button" onClick={addSection} className="text-white/70 hover:text-white text-xs flex items-center gap-1">
          <Plus size={13} /> Section
        </button>
      </div>
      <div className="p-4 space-y-4">
        {content.sections.map((sec, si) => (
          <div key={si} className="border border-gray-100 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <input
                value={sec.titre}
                onChange={e => updateSection(si, "titre", e.target.value)}
                placeholder="Titre de la section (ex: Traitement immédiat)"
                className={inputCls + " flex-1"}
              />
              <select
                value={sec.priorite}
                onChange={e => updateSection(si, "priorite", e.target.value)}
                className="h-8 px-2 rounded-lg border border-gray-200 text-xs outline-none"
              >
                <option value="urgente">Urgente</option>
                <option value="haute">Haute</option>
                <option value="normale">Normale</option>
              </select>
              {content.sections.length > 1 && (
                <button type="button" onClick={() => removeSection(si)} className="text-red-400 hover:text-red-600">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
            <div className="space-y-1.5">
              {sec.actions.map((a, ai) => (
                <div key={ai} className="flex items-start gap-2">
                  <input
                    value={a.action}
                    onChange={e => updateAction(si, ai, "action", e.target.value)}
                    placeholder="Action (ex: Réhydratation orale)"
                    className={inputCls + " flex-1"}
                  />
                  <input
                    value={a.detail}
                    onChange={e => updateAction(si, ai, "detail", e.target.value)}
                    placeholder="Détail / posologie"
                    className={inputCls + " flex-1"}
                  />
                  {sec.actions.length > 1 && (
                    <button type="button" onClick={() => removeAction(si, ai)} className="text-red-400 hover:text-red-600 mt-1">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => addAction(si)} className="text-xs text-[#1B4F8A] hover:underline flex items-center gap-1">
                <Plus size={11} /> Ajouter action
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ProtocoleForm({ initial }: Props) {
  const router = useRouter()
  const [maladies, setMaladies] = useState<Maladie[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [maladieId, setMaladieId] = useState(initial?.maladieId ?? "")
  const [titre, setTitre] = useState(initial?.titre ?? "")
  const [dureeSurveillance, setDureeSurveillance] = useState(initial?.dureeSurveillance ?? "")
  const [conduiteMedicale, setConduiteMedicale] = useState<JsonContent>(initial?.conduiteMedicale ?? emptyContent())
  const [actionsAdministratives, setActionsAdministratives] = useState<JsonContent>(initial?.actionsAdministratives ?? emptyContent())
  const [investigationSteps, setInvestigationSteps] = useState<JsonContent>(initial?.investigationSteps ?? emptyContent())

  useEffect(() => {
    fetch("/api/maladies").then(r => r.json()).then(d => setMaladies(d.maladies ?? d)).catch(console.error)
  }, [])

  // Auto-fill titre when maladie selected
  useEffect(() => {
    if (maladieId && !initial?.titre) {
      const m = maladies.find(m => m.id === maladieId)
      if (m) setTitre(`Protocole de prise en charge — ${m.nom}`)
    }
  }, [maladieId, maladies, initial?.titre])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const url = initial?.id ? `/api/protocoles/${initial.id}` : "/api/protocoles"
      const method = initial?.id ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maladieId,
          titre,
          conduiteMedicale,
          actionsAdministratives,
          investigationSteps,
          dureeSurveillance: dureeSurveillance ? parseInt(dureeSurveillance) : null,
        }),
      })
      if (!res.ok) throw new Error("Erreur lors de la sauvegarde")
      router.push("/parametres/protocoles")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-5">
      {/* Basic info */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Informations Générales</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Maladie MDO *</label>
            <select
              value={maladieId}
              onChange={e => setMaladieId(e.target.value)}
              required
              disabled={!!initial?.id}
              className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#1B4F8A] disabled:bg-gray-50"
            >
              <option value="">Sélectionner une maladie</option>
              {maladies.map(m => (
                <option key={m.id} value={m.id}>{m.nom} ({m.codeCim10})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Durée surveillance contacts (jours)</label>
            <input
              type="number"
              value={dureeSurveillance}
              onChange={e => setDureeSurveillance(e.target.value)}
              placeholder="Ex: 5"
              className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#1B4F8A]"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Titre du Protocole *</label>
            <input
              value={titre}
              onChange={e => setTitre(e.target.value)}
              required
              placeholder="Protocole de prise en charge — Choléra"
              className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#1B4F8A]"
            />
          </div>
        </div>
      </div>

      <SectionEditor label="🏥 Conduite Médicale" content={conduiteMedicale} onChange={setConduiteMedicale} />
      <SectionEditor label="📋 Actions Administratives" content={actionsAdministratives} onChange={setActionsAdministratives} />
      <SectionEditor label="🔍 Investigation Épidémiologique" content={investigationSteps} onChange={setInvestigationSteps} />

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-60"
          style={{ backgroundColor: "#1B4F8A" }}
        >
          {loading ? "Sauvegarde..." : (initial?.id ? "Mettre à jour" : "Créer le Protocole")}
        </button>
        <button
          type="button"
          onClick={() => router.push("/parametres/protocoles")}
          className="px-6 py-2.5 rounded-lg text-sm border border-gray-200 text-gray-600 hover:bg-gray-50"
        >
          Annuler
        </button>
      </div>
    </form>
  )
}
