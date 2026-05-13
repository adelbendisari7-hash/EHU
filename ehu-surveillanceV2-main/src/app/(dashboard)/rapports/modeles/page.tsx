"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Pencil, Trash2, FileText, X, Check } from "lucide-react"
import { toast } from "sonner"
import { formatDate } from "@/utils/format-date"

const TYPE_OPTIONS = [
  { value: "mensuel", label: "Mensuel" },
  { value: "trimestriel", label: "Trimestriel" },
  { value: "semestriel", label: "Semestriel" },
  { value: "annuel", label: "Annuel" },
  { value: "personnalise", label: "Personnalisé" },
]

const SECTION_OPTIONS = [
  "Résumé exécutif",
  "Épidémiologie descriptive",
  "Répartition géographique",
  "Répartition par maladie",
  "Résultats laboratoire",
  "Investigations en cours",
  "Alertes actives",
  "Indicateurs de performance",
  "Recommandations",
  "Annexes",
]

interface Template {
  id: string
  titre: string
  type: string
  sections: string[]
  description: string
  createdAt: string
  createdBy: string
}

export default function RapportModelesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editTemplate, setEditTemplate] = useState<Template | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState({ titre: "", type: "mensuel", description: "", sections: [] as string[] })
  const [submitting, setSubmitting] = useState(false)

  const fetchTemplates = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/rapport-modeles")
      const data = await res.json()
      setTemplates(data.templates ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void fetchTemplates() }, [fetchTemplates])

  const openCreate = () => {
    setEditTemplate(null)
    setForm({ titre: "", type: "mensuel", description: "", sections: [] })
    setShowModal(true)
  }

  const openEdit = (t: Template) => {
    setEditTemplate(t)
    setForm({ titre: t.titre, type: t.type, description: t.description, sections: [...t.sections] })
    setShowModal(true)
  }

  const toggleSection = (s: string) => {
    setForm(prev => ({
      ...prev,
      sections: prev.sections.includes(s) ? prev.sections.filter(x => x !== s) : [...prev.sections, s],
    }))
  }

  const submitForm = async () => {
    if (!form.titre.trim()) { toast.error("Le titre est requis"); return }
    setSubmitting(true)
    try {
      const url = editTemplate ? `/api/rapport-modeles/${editTemplate.id}` : "/api/rapport-modeles"
      const method = editTemplate ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      toast.success(editTemplate ? "Modèle mis à jour" : "Modèle créé")
      setShowModal(false)
      void fetchTemplates()
    } catch {
      toast.error("Une erreur s'est produite")
    } finally {
      setSubmitting(false)
    }
  }

  const deleteTemplate = async (id: string) => {
    try {
      await fetch(`/api/rapport-modeles/${id}`, { method: "DELETE" })
      toast.success("Modèle supprimé")
      setDeleteId(null)
      void fetchTemplates()
    } catch {
      toast.error("Erreur lors de la suppression")
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Modèles de Rapports</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gérez les templates de rapports utilisés lors de la génération automatique</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors" style={{ backgroundColor: "#1B4F8A" }}>
          <Plus size={15} /> Nouveau modèle
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-40 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl border border-gray-100">
          <FileText size={40} className="text-gray-200 mb-3" />
          <p className="text-sm font-medium text-gray-500">Aucun modèle de rapport</p>
          <p className="text-xs text-gray-400 mt-1">Créez votre premier modèle en cliquant sur &quot;Nouveau modèle&quot;</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(t => (
            <div key={t.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#EEF4FF" }}>
                    <FileText size={16} style={{ color: "#1B4F8A" }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800 leading-tight">{t.titre}</p>
                    <span className="text-xs text-gray-500 capitalize">{t.type}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openEdit(t)} className="p-1.5 rounded hover:bg-blue-50 transition-colors">
                    <Pencil size={13} style={{ color: "#1B4F8A" }} />
                  </button>
                  <button onClick={() => setDeleteId(t.id)} className="p-1.5 rounded hover:bg-red-50 transition-colors">
                    <Trash2 size={13} className="text-red-400" />
                  </button>
                </div>
              </div>

              {t.description && <p className="text-xs text-gray-500 leading-relaxed">{t.description}</p>}

              {t.sections.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {t.sections.slice(0, 3).map(s => (
                    <span key={s} className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md">{s}</span>
                  ))}
                  {t.sections.length > 3 && (
                    <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-md">+{t.sections.length - 3}</span>
                  )}
                </div>
              )}

              <p className="text-[11px] text-gray-400 mt-auto pt-1 border-t border-gray-50">
                Créé le {formatDate(t.createdAt)} par {t.createdBy}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6 z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-gray-800">{editTemplate ? "Modifier le modèle" : "Nouveau modèle"}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <X size={16} className="text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Titre du modèle *</label>
                <input
                  value={form.titre}
                  onChange={e => setForm(p => ({ ...p, titre: e.target.value }))}
                  placeholder="Ex: Rapport mensuel MDO"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Type de rapport</label>
                <select
                  value={form.type}
                  onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Description (optionnel)</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  rows={2}
                  placeholder="Décrivez l'usage de ce modèle..."
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Sections à inclure</label>
                <div className="space-y-1.5">
                  {SECTION_OPTIONS.map(s => (
                    <label key={s} className="flex items-center gap-2.5 cursor-pointer group">
                      <div
                        onClick={() => toggleSection(s)}
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                          form.sections.includes(s)
                            ? "border-blue-600"
                            : "border-gray-300 group-hover:border-gray-400"
                        }`}
                        style={form.sections.includes(s) ? { backgroundColor: "#1B4F8A", borderColor: "#1B4F8A" } : {}}
                      >
                        {form.sections.includes(s) && <Check size={10} className="text-white" />}
                      </div>
                      <span className="text-sm text-gray-700">{s}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                Annuler
              </button>
              <button
                onClick={submitForm}
                disabled={submitting}
                className="px-4 py-2 text-sm text-white rounded-lg font-medium disabled:opacity-60 transition-colors"
                style={{ backgroundColor: "#1B4F8A" }}
              >
                {submitting ? "Enregistrement..." : editTemplate ? "Mettre à jour" : "Créer le modèle"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="relative bg-white rounded-xl shadow-xl p-6 w-80 z-10">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">Supprimer ce modèle ?</h3>
            <p className="text-xs text-gray-500 mb-4">Cette action est irréversible.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteId(null)} className="px-3 py-1.5 text-sm text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-50">Annuler</button>
              <button onClick={() => void deleteTemplate(deleteId)} className="px-3 py-1.5 text-sm text-white rounded-lg bg-red-600 hover:bg-red-700">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
