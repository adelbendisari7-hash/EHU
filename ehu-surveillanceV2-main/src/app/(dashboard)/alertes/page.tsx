"use client"

import { useState, useEffect, useCallback } from "react"
import { AlertTriangle, Plus, X, RefreshCw, Search, Calendar } from "lucide-react"
import { formatDate } from "@/utils/format-date"
import { CardSkeleton } from "@/components/shared/skeleton"
import { toast } from "sonner"

interface Alerte {
  id: string
  type: string
  titre: string
  description: string
  nombreCas: number
  statut: string
  createdAt: string
  maladie: { nom: string } | null
  commune: { nom: string } | null
}

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  epidemique: { label: "Épidémique",   color: "#B91C1C", bg: "#FEF2F2", border: "#FECACA" },
  seuil:      { label: "Seuil atteint", color: "#B45309", bg: "#FFFBEB", border: "#FDE68A" },
  information:{ label: "Information",   color: "#1B4F8A", bg: "#EEF4FF", border: "#C5DAFC" },
}

const STATUT_CONFIG: Record<string, { label: string; color: string }> = {
  active:  { label: "Active",  color: "#DC2626" },
  resolue: { label: "Résolue", color: "#059669" },
}

const STATUT_TABS = [
  { key: "",        label: "Toutes" },
  { key: "active",  label: "Actives" },
  { key: "resolue", label: "Résolues" },
]

export default function AlertesPage() {
  const [alertes, setAlertes] = useState<Alerte[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const [statut, setStatut] = useState("")
  const [search, setSearch] = useState("")
  const [dateDebut, setDateDebut] = useState("")
  const [dateFin, setDateFin] = useState("")
  const [maladieFilter, setMaladieFilter] = useState("")
  const [maladies, setMaladies] = useState<{ id: string; nom: string }[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ type: "information", titre: "", description: "", maladieId: "", nombreCas: "" })
  const [submitting, setSubmitting] = useState(false)

  const fetchAlertes = useCallback(async () => {
    setLoading(true)
    setFetchError(false)
    try {
      const params = new URLSearchParams()
      if (statut) params.set("statut", statut)
      if (dateDebut) params.set("dateDebut", dateDebut)
      if (dateFin) params.set("dateFin", dateFin)
      if (maladieFilter) params.set("maladieId", maladieFilter)
      const res = await fetch(`/api/alertes?${params}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setAlertes(Array.isArray(data) ? data : [])
    } catch {
      setFetchError(true)
    } finally {
      setLoading(false)
    }
  }, [statut, dateDebut, dateFin, maladieFilter])

  useEffect(() => { void fetchAlertes() }, [fetchAlertes])
  useEffect(() => {
    fetch("/api/maladies").then(r => r.json()).then(d => setMaladies(d.maladies ?? d)).catch(console.error)
  }, [])

  const submitAlerte = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch("/api/alertes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, nombreCas: parseInt(form.nombreCas) || 0 }),
      })
      if (!res.ok) throw new Error()
      toast.success("Alerte créée avec succès")
      setForm({ type: "information", titre: "", description: "", maladieId: "", nombreCas: "" })
      setShowForm(false)
      void fetchAlertes()
    } catch {
      toast.error("Erreur lors de la création de l'alerte")
    } finally {
      setSubmitting(false)
    }
  }

  const resolveAlerte = async (id: string) => {
    try {
      const res = await fetch(`/api/alertes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut: "resolue" }),
      })
      if (!res.ok) throw new Error()
      toast.success("Alerte résolue")
      void fetchAlertes()
    } catch {
      toast.error("Erreur lors de la résolution")
    }
  }

  const resetFilters = () => {
    setDateDebut("")
    setDateFin("")
    setMaladieFilter("")
    setSearch("")
    setStatut("")
  }

  const filtered = alertes.filter(a => {
    if (!search) return true
    return a.titre.toLowerCase().includes(search.toLowerCase()) ||
      (a.maladie?.nom.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (a.commune?.nom.toLowerCase().includes(search.toLowerCase()) ?? false)
  })

  const hasFilters = dateDebut || dateFin || maladieFilter || search

  const input = "w-full h-9 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#1B4F8A]"

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Alertes Épidémiques</h1>
          <p className="page-subtitle">Surveillance des seuils et alertes actives</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
          style={{ backgroundColor: "#1B4F8A" }}
        >
          <Plus size={16} /> Nouvelle Alerte
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-800">Créer une alerte manuelle</p>
            <button onClick={() => setShowForm(false)}><X size={16} className="text-gray-400" /></button>
          </div>
          <form onSubmit={submitAlerte} className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Type *</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={input} required>
                <option value="information">Information</option>
                <option value="seuil">Seuil atteint</option>
                <option value="epidemique">Épidémique</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Maladie</label>
              <select value={form.maladieId} onChange={e => setForm(f => ({ ...f, maladieId: e.target.value }))} className={input}>
                <option value="">Sélectionner...</option>
                {maladies.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Titre *</label>
              <input value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))} className={input} placeholder="Titre de l'alerte" required />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Description *</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#1B4F8A] resize-none" rows={2} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nombre de cas</label>
              <input type="number" value={form.nombreCas} onChange={e => setForm(f => ({ ...f, nombreCas: e.target.value }))} className={input} placeholder="0" min="0" />
            </div>
            <div className="flex items-end">
              <button type="submit" disabled={submitting} className="w-full py-2 rounded-lg text-sm font-medium text-white disabled:opacity-60" style={{ backgroundColor: "#E74C3C" }}>
                {submitting ? "Création..." : "Créer l'Alerte"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="card p-4 mb-4 space-y-3">
        {/* Status tabs */}
        <div className="flex gap-2">
          {STATUT_TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setStatut(t.key)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
              style={{
                backgroundColor: statut === t.key ? "#1B4F8A" : "white",
                color: statut === t.key ? "white" : "#4A5164",
                borderColor: statut === t.key ? "#1B4F8A" : "#E5E7EB",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Search + date + maladie */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="h-8 pl-8 pr-3 rounded-lg border border-gray-200 text-[12px] outline-none focus:border-[#1B4F8A] min-w-[180px]"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar size={13} className="text-gray-400" />
            <input
              type="date"
              value={dateDebut}
              onChange={e => setDateDebut(e.target.value)}
              className="h-8 px-2 rounded-lg border border-gray-200 text-[12px] outline-none focus:border-[#1B4F8A]"
            />
            <span className="text-gray-400 text-[12px]">→</span>
            <input
              type="date"
              value={dateFin}
              onChange={e => setDateFin(e.target.value)}
              className="h-8 px-2 rounded-lg border border-gray-200 text-[12px] outline-none focus:border-[#1B4F8A]"
            />
          </div>
          <select
            value={maladieFilter}
            onChange={e => setMaladieFilter(e.target.value)}
            className="h-8 px-3 rounded-lg border border-gray-200 text-[12px] outline-none focus:border-[#1B4F8A] bg-white"
          >
            <option value="">Toutes les maladies</option>
            {maladies.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
          </select>
          {hasFilters && (
            <button onClick={resetFilters} className="flex items-center gap-1 text-[12px] text-gray-400 hover:text-gray-600 transition-colors">
              <X size={12} /> Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* Alerts list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : fetchError ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <AlertTriangle size={32} className="text-red-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500 mb-3">Impossible de charger les alertes</p>
          <button onClick={fetchAlertes} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 hover:bg-gray-50 text-gray-600">
            <RefreshCw size={13} /> Réessayer
          </button>
        </div>
      ) : !filtered.length ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <AlertTriangle size={36} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Aucune alerte trouvée</p>
          <p className="text-gray-400 text-sm mt-1">
            {hasFilters ? "Essayez de modifier les filtres" : "Les alertes apparaissent ici automatiquement ou peuvent être créées manuellement"}
          </p>
          {hasFilters && (
            <button onClick={resetFilters} className="mt-3 text-[12px] text-[#1B4F8A] hover:underline">
              Réinitialiser les filtres
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(a => {
            const typeConf = TYPE_CONFIG[a.type] ?? TYPE_CONFIG.information
            const statutConf = STATUT_CONFIG[a.statut] ?? STATUT_CONFIG.active
            return (
              <div key={a.id} className="bg-white rounded-xl border shadow-sm p-4 hover:shadow-md transition-shadow" style={{ borderColor: typeConf.border }}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="mt-0.5 px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap" style={{ color: typeConf.color, backgroundColor: typeConf.bg, borderColor: typeConf.border }}>
                      {typeConf.label}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-800">{a.titre}</p>
                      <p className="text-xs text-gray-500 mt-1">{a.description}</p>
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-gray-400">
                        {a.maladie && <span>🦠 {a.maladie.nom}</span>}
                        {a.commune && <span>📍 {a.commune.nom}</span>}
                        <span>👥 {a.nombreCas} cas</span>
                        <span>📅 {formatDate(a.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4 shrink-0">
                    <span className="text-xs font-medium" style={{ color: statutConf.color }}>{statutConf.label}</span>
                    {a.statut === "active" && (
                      <button
                        onClick={() => resolveAlerte(a.id)}
                        className="px-2 py-1 rounded-lg text-xs font-medium border border-green-200 text-green-600 hover:bg-green-50 transition-colors"
                      >
                        Résoudre
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
          <p className="text-[11px] text-gray-400 text-right pt-1">{filtered.length} alerte{filtered.length !== 1 ? "s" : ""}</p>
        </div>
      )}
    </div>
  )
}
