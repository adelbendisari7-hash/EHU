"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Shield } from "lucide-react"

interface Seuil {
  id: string
  maladieId: string
  perimetre: string
  seuilNombre: number
  periodejours: number
  gravite: string
  autoAlerte: boolean
  autoNotification: boolean
  isActive: boolean
  maladie: { nom: string; codeCim10: string }
  commune: { nom: string } | null
  wilaya: { nom: string } | null
}

interface Maladie { id: string; nom: string; codeCim10: string }
interface Commune { id: string; nom: string }

const GRAVITE_BADGES: Record<string, { label: string; bg: string; color: string }> = {
  attention:  { label: "Attention",  bg: "#FEF9C3", color: "#B45309" },
  urgent:     { label: "Urgent",     bg: "#FFEDD5", color: "#C2410C" },
  critique:   { label: "Critique",   bg: "#FEE2E2", color: "#B91C1C" },
}

export default function SeuilsPage() {
  const [seuils, setSeuils] = useState<Seuil[]>([])
  const [maladies, setMaladies] = useState<Maladie[]>([])
  const [communes, setCommunes] = useState<Commune[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  // Form state
  const [form, setForm] = useState({
    maladieId: "", perimetre: "commune", communeId: "", wilayadId: "",
    seuilNombre: "3", periodejours: "30", gravite: "urgent",
    autoAlerte: true, autoNotification: true,
  })

  useEffect(() => {
    Promise.all([
      fetch("/api/seuils").then(r => r.json()),
      fetch("/api/maladies").then(r => r.json()),
      fetch("/api/communes").then(r => r.json()),
    ]).then(([s, m, c]) => { setSeuils(s); setMaladies(m); setCommunes(c) })
      .finally(() => setLoading(false))
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch("/api/seuils", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const seuil = await res.json()
    setSeuils(p => [seuil, ...p])
    setShowForm(false)
    setForm({ maladieId: "", perimetre: "commune", communeId: "", wilayadId: "", seuilNombre: "3", periodejours: "30", gravite: "urgent", autoAlerte: true, autoNotification: true })
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce seuil ?")) return
    await fetch(`/api/seuils/${id}`, { method: "DELETE" })
    setSeuils(p => p.filter(s => s.id !== id))
  }

  const toggleActive = async (seuil: Seuil) => {
    await fetch(`/api/seuils/${seuil.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !seuil.isActive }),
    })
    setSeuils(p => p.map(s => s.id === seuil.id ? { ...s, isActive: !s.isActive } : s))
  }

  const inputCls = "w-full h-9 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#1B4F8A]"
  const selectCls = "w-full h-9 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#1B4F8A] bg-white"

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Seuils d&apos;Alerte</h1>
          <p className="text-sm text-gray-500 mt-1">Configuration des seuils de déclenchement par maladie</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ backgroundColor: "#27AE60" }}
        >
          <Plus size={16} />
          Ajouter un seuil
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleAdd} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Nouveau Seuil</h3>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Maladie *</label>
              <select value={form.maladieId} onChange={e => setForm(p => ({ ...p, maladieId: e.target.value }))} required className={selectCls}>
                <option value="">Sélectionner</option>
                {maladies.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Périmètre</label>
              <select value={form.perimetre} onChange={e => setForm(p => ({ ...p, perimetre: e.target.value }))} className={selectCls}>
                <option value="commune">Commune</option>
                <option value="wilaya">Wilaya</option>
                <option value="national">National</option>
              </select>
            </div>
            {form.perimetre === "commune" && (
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Commune</label>
                <select value={form.communeId} onChange={e => setForm(p => ({ ...p, communeId: e.target.value }))} className={selectCls}>
                  <option value="">Toutes</option>
                  {communes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Seuil (nb cas) *</label>
              <input type="number" min="1" value={form.seuilNombre} onChange={e => setForm(p => ({ ...p, seuilNombre: e.target.value }))} required className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Période (jours)</label>
              <input type="number" min="1" value={form.periodejours} onChange={e => setForm(p => ({ ...p, periodejours: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Gravité</label>
              <select value={form.gravite} onChange={e => setForm(p => ({ ...p, gravite: e.target.value }))} className={selectCls}>
                <option value="attention">Attention</option>
                <option value="urgent">Urgent</option>
                <option value="critique">Critique</option>
              </select>
            </div>
          </div>
          <div className="flex gap-4 mt-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.autoAlerte} onChange={e => setForm(p => ({ ...p, autoAlerte: e.target.checked }))} className="rounded" />
              <span className="text-gray-600">Auto-alerte</span>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.autoNotification} onChange={e => setForm(p => ({ ...p, autoNotification: e.target.checked }))} className="rounded" />
              <span className="text-gray-600">Notifications automatiques</span>
            </label>
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" className="px-4 py-2 rounded-lg text-sm text-white" style={{ backgroundColor: "#1B4F8A" }}>Enregistrer</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm border border-gray-200 text-gray-600 hover:bg-gray-50">Annuler</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-sm text-gray-400 text-center py-12">Chargement...</div>
      ) : seuils.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <Shield size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">Aucun seuil configuré</p>
          <p className="text-gray-400 text-sm mt-1">Ajoutez des seuils pour déclencher automatiquement les protocoles</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Maladie</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Périmètre</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Seuil</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Période</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Gravité</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Statut</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {seuils.map(s => {
                const g = GRAVITE_BADGES[s.gravite]
                return (
                  <tr key={s.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${!s.isActive ? "opacity-50" : ""}`}>
                    <td className="px-5 py-3 text-sm font-medium text-gray-800">{s.maladie.nom}</td>
                    <td className="px-5 py-3 text-sm text-gray-500 capitalize">
                      {s.perimetre === "commune" && s.commune ? s.commune.nom : s.perimetre === "wilaya" && s.wilaya ? s.wilaya.nom : s.perimetre}
                    </td>
                    <td className="px-5 py-3 text-sm font-semibold text-gray-800">{s.seuilNombre} cas</td>
                    <td className="px-5 py-3 text-sm text-gray-500">{s.periodejours} jours</td>
                    <td className="px-5 py-3">
                      {g && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: g.bg, color: g.color }}>
                          {g.label}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <button onClick={() => toggleActive(s)} className={`w-10 h-5 rounded-full transition-colors ${s.isActive ? "bg-green-400" : "bg-gray-200"} relative`}>
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${s.isActive ? "translate-x-5" : "translate-x-0.5"}`} />
                      </button>
                    </td>
                    <td className="px-5 py-3">
                      <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
