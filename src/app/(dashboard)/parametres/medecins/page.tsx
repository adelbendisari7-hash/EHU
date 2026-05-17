"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Pencil, Trash2, Search, X, Check, AlertCircle } from "lucide-react"

interface Medecin {
  id: string
  nom: string
  prenom: string
  service: string
}

function MedecinModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: Medecin
  onSave: (data: { nom: string; prenom: string; service: string }) => Promise<void>
  onClose: () => void
}) {
  const [nom, setNom] = useState(initial?.nom ?? "")
  const [prenom, setPrenom] = useState(initial?.prenom ?? "")
  const [service, setService] = useState(initial?.service ?? "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nom.trim() || !prenom.trim() || !service.trim()) {
      setError("Tous les champs sont requis")
      return
    }
    setSaving(true)
    setError("")
    try {
      await onSave({ nom: nom.trim(), prenom: prenom.trim(), service: service.trim() })
      onClose()
    } catch {
      setError("Une erreur est survenue")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-[15px] font-semibold text-gray-800">
            {initial ? "Modifier le médecin" : "Nouveau médecin déclarant"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-sm">
              <AlertCircle size={14} /> {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nom <span className="text-red-500">*</span></label>
            <input
              value={nom}
              onChange={e => setNom(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/20 focus:border-[#1B4F8A]"
              placeholder="Ex: Benali"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Prénom <span className="text-red-500">*</span></label>
            <input
              value={prenom}
              onChange={e => setPrenom(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/20 focus:border-[#1B4F8A]"
              placeholder="Ex: Mohamed"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Service <span className="text-red-500">*</span></label>
            <input
              value={service}
              onChange={e => setService(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/20 focus:border-[#1B4F8A]"
              placeholder="Ex: Urgences, Pédiatrie..."
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 text-sm text-white rounded-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ backgroundColor: "#1B4F8A" }}
            >
              {saving ? (
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <><Check size={14} /> Enregistrer</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function MedecinsDeclarantsPage() {
  const [medecins, setMedecins] = useState<Medecin[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [modal, setModal] = useState<{ open: boolean; editing?: Medecin }>({ open: false })
  const [deleting, setDeleting] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const fetchMedecins = useCallback(async () => {
    setLoading(true)
    const res = await fetch("/api/medecins-declarants")
    if (res.ok) setMedecins(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { fetchMedecins() }, [fetchMedecins])

  const handleSave = async (data: { nom: string; prenom: string; service: string }) => {
    if (modal.editing) {
      await fetch(`/api/medecins-declarants/${modal.editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
    } else {
      await fetch("/api/medecins-declarants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
    }
    await fetchMedecins()
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    await fetch(`/api/medecins-declarants/${id}`, { method: "DELETE" })
    setConfirmDelete(null)
    setDeleting(null)
    await fetchMedecins()
  }

  const filtered = medecins.filter(m =>
    `${m.nom} ${m.prenom} ${m.service}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Médecins Déclarants</h1>
          <p className="text-sm text-gray-500 mt-0.5">{medecins.length} médecin{medecins.length !== 1 ? "s" : ""} enregistré{medecins.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => setModal({ open: true })}
          className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg transition-colors"
          style={{ backgroundColor: "#1B4F8A" }}
        >
          <Plus size={15} /> Ajouter
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par nom, prénom ou service..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/20 focus:border-[#1B4F8A] bg-white"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-[#1B4F8A] animate-spin mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-gray-400">{search ? "Aucun résultat pour cette recherche" : "Aucun médecin enregistré"}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nom</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Prénom</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Service</th>
                <th className="px-4 py-3 w-20" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => (
                <tr key={m.id} className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${i % 2 === 0 ? "" : "bg-gray-50/30"}`}>
                  <td className="px-4 py-3 font-medium text-gray-800">{m.nom}</td>
                  <td className="px-4 py-3 text-gray-600">{m.prenom}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                      {m.service}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => setModal({ open: true, editing: m })}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-[#1B4F8A] hover:bg-blue-50 transition-colors"
                        title="Modifier"
                      >
                        <Pencil size={13} />
                      </button>
                      {confirmDelete === m.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(m.id)}
                            disabled={deleting === m.id}
                            className="px-2 py-1 text-xs text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-60"
                          >
                            {deleting === m.id ? "..." : "Confirmer"}
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="px-2 py-1 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                          >
                            Annuler
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(m.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal.open && (
        <MedecinModal
          initial={modal.editing}
          onSave={handleSave}
          onClose={() => setModal({ open: false })}
        />
      )}
    </div>
  )
}
