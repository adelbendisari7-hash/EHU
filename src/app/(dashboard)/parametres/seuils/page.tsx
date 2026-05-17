"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Pencil, Trash2, Shield, Search, X, Check } from "lucide-react"

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
  wilayadId: string | null
  communeId: string | null
  wilaya: { nom: string } | null
  commune: { nom: string } | null
}

interface Maladie {
  id: string
  nom: string
  codeCim10: string
  categorie: string
}

interface Wilaya {
  id: string
  nom: string
  code: string
}

interface MaladieWithSeuil extends Maladie {
  seuil: Seuil | null
}

const GRAVITE_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  attention: { label: "Attention", bg: "#FEF9C3", color: "#B45309" },
  urgent:    { label: "Urgent",    bg: "#FFEDD5", color: "#C2410C" },
  critique:  { label: "Critique",  bg: "#FEE2E2", color: "#B91C1C" },
}

const PERIMETRE_LABELS: Record<string, string> = {
  national: "National",
  wilaya: "Wilaya",
  commune: "Commune",
}

const DEFAULT_FORM = {
  maladieId: "",
  perimetre: "national",
  wilayadId: "",
  communeId: "",
  seuilNombre: "5",
  periodejours: "30",
  gravite: "urgent",
  autoAlerte: true,
  autoNotification: true,
}

export default function SeuilsPage() {
  const [maladies, setMaladies] = useState<Maladie[]>([])
  const [seuils, setSeuils] = useState<Seuil[]>([])
  const [wilayas, setWilayas] = useState<Wilaya[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [modal, setModal] = useState<{ open: boolean; editSeuil?: Seuil; maladieId?: string }>({ open: false })
  const [form, setForm] = useState({ ...DEFAULT_FORM })
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [mRes, sRes, wRes] = await Promise.all([
        fetch("/api/maladies"),
        fetch("/api/seuils"),
        fetch("/api/wilayas"),
      ])
      const mData = await mRes.json()
      const sData = await sRes.json()
      const wData = await wRes.json()
      setMaladies(mData.maladies ?? mData)
      setSeuils(Array.isArray(sData) ? sData : [])
      setWilayas(Array.isArray(wData) ? wData : (wData.wilayas ?? []))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const maladiesWithSeuil: MaladieWithSeuil[] = maladies.map(m => ({
    ...m,
    seuil: seuils.find(s => s.maladieId === m.id) ?? null,
  }))

  const filtered = maladiesWithSeuil.filter(m =>
    !search || m.nom.toLowerCase().includes(search.toLowerCase()) || m.codeCim10.toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    total: maladies.length,
    actifs: seuils.filter(s => s.isActive).length,
    nonConfigures: maladies.filter(m => !seuils.find(s => s.maladieId === m.id)).length,
  }

  const openAdd = (maladieId: string) => {
    setForm({ ...DEFAULT_FORM, maladieId })
    setModal({ open: true, maladieId })
  }

  const openEdit = (seuil: Seuil) => {
    setForm({
      maladieId: seuil.maladieId,
      perimetre: seuil.perimetre,
      wilayadId: seuil.wilayadId ?? "",
      communeId: seuil.communeId ?? "",
      seuilNombre: String(seuil.seuilNombre),
      periodejours: String(seuil.periodejours),
      gravite: seuil.gravite,
      autoAlerte: seuil.autoAlerte,
      autoNotification: seuil.autoNotification,
    })
    setModal({ open: true, editSeuil: seuil })
  }

  const closeModal = () => {
    setModal({ open: false })
    setForm({ ...DEFAULT_FORM })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        maladieId: form.maladieId,
        perimetre: form.perimetre,
        wilayadId: form.perimetre === "wilaya" ? (form.wilayadId || null) : null,
        communeId: form.perimetre === "commune" ? (form.communeId || null) : null,
        seuilNombre: Number(form.seuilNombre),
        periodejours: Number(form.periodejours),
        gravite: form.gravite,
        autoAlerte: form.autoAlerte,
        autoNotification: form.autoNotification,
      }

      if (modal.editSeuil) {
        const res = await fetch(`/api/seuils/${modal.editSeuil.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        const updated = await res.json()
        setSeuils(p => p.map(s => s.id === modal.editSeuil!.id ? { ...s, ...updated } : s))
      } else {
        const res = await fetch("/api/seuils", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        const created = await res.json()
        setSeuils(p => [created, ...p])
      }
      closeModal()
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (seuil: Seuil) => {
    await fetch(`/api/seuils/${seuil.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !seuil.isActive }),
    })
    setSeuils(p => p.map(s => s.id === seuil.id ? { ...s, isActive: !s.isActive } : s))
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/seuils/${id}`, { method: "DELETE" })
    setSeuils(p => p.filter(s => s.id !== id))
    setDeleteConfirm(null)
  }

  const inputCls = "w-full h-9 px-3 rounded-lg border border-gray-200 text-[13px] outline-none focus:border-[#1B4F8A] focus:ring-1 focus:ring-[#1B4F8A]/20 bg-white"

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Seuils d&apos;Alerte</h1>
          <p className="page-subtitle">Configuration des seuils de déclenchement automatique par maladie</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "Maladies MDO", value: stats.total, color: "#1B4F8A", bg: "#EBF1FA" },
          { label: "Seuils actifs", value: stats.actifs, color: "#047857", bg: "#ECFDF5" },
          { label: "Non configurées", value: stats.nonConfigures, color: "#B45309", bg: "#FFFBEB" },
        ].map(s => (
          <div key={s.label} className="card p-4">
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[12px] text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-xs">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher une maladie..."
          className="input pl-9 h-[32px] text-[12px] w-full"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="card p-12 text-center text-sm text-gray-400">Chargement...</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                {["Maladie", "Périmètre", "Seuil", "Période", "Gravité", "Statut", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => {
                const s = m.seuil
                const g = s ? GRAVITE_CONFIG[s.gravite] : null
                return (
                  <tr
                    key={m.id}
                    className={`border-b border-gray-50 transition-colors ${i % 2 === 1 ? "bg-gray-50/30" : ""} ${!s || !s.isActive ? "opacity-60" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <p className="text-[13px] font-medium text-gray-800">{m.nom}</p>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">{m.codeCim10}</p>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-gray-500">
                      {s ? (
                        <span>
                          {PERIMETRE_LABELS[s.perimetre] ?? s.perimetre}
                          {s.perimetre === "wilaya" && s.wilaya && <span className="text-gray-400"> — {s.wilaya.nom}</span>}
                          {s.perimetre === "commune" && s.commune && <span className="text-gray-400"> — {s.commune.nom}</span>}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-[12px]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {s ? (
                        <span className="text-[13px] font-semibold text-gray-800">{s.seuilNombre} cas</span>
                      ) : (
                        <span className="text-gray-300 text-[12px]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {s ? (
                        <span className="text-[13px] text-gray-500">{s.periodejours} jours</span>
                      ) : (
                        <span className="text-gray-300 text-[12px]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {g ? (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: g.bg, color: g.color }}>
                          {g.label}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-[12px]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {s ? (
                        <button
                          onClick={() => handleToggle(s)}
                          className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${s.isActive ? "bg-green-400" : "bg-gray-200"}`}
                        >
                          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${s.isActive ? "translate-x-4" : "translate-x-0.5"}`} />
                        </button>
                      ) : (
                        <span className="text-[11px] text-gray-300">Non configuré</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {s ? (
                          <>
                            <button
                              onClick={() => openEdit(s)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-[#1B4F8A] hover:bg-blue-50 transition-colors"
                              title="Modifier"
                            >
                              <Pencil size={13} />
                            </button>
                            {deleteConfirm === s.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleDelete(s.id)}
                                  className="p-1 rounded text-red-500 hover:bg-red-50 text-[10px] font-medium"
                                >
                                  <Check size={12} />
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm(null)}
                                  className="p-1 rounded text-gray-400 hover:bg-gray-100 text-[10px]"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirm(s.id)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </>
                        ) : (
                          <button
                            onClick={() => openAdd(m.id)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-white transition-colors"
                            style={{ backgroundColor: "#1B4F8A" }}
                          >
                            <Plus size={11} /> Configurer
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/50">
            <p className="text-[11px] text-gray-400">{filtered.length} maladie{filtered.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
      )}

      {/* Modal */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <Shield size={16} className="text-[#1B4F8A]" />
                <h3 className="text-[14px] font-semibold text-gray-800">
                  {modal.editSeuil ? "Modifier le seuil" : "Configurer le seuil"}
                </h3>
              </div>
              <button onClick={closeModal} className="p-1 rounded hover:bg-gray-100 transition-colors">
                <X size={16} className="text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              {/* Perimetre */}
              <div>
                <label className="text-[12px] font-medium text-gray-500 mb-1.5 block">Périmètre d&apos;application</label>
                <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                  {(["national", "wilaya", "commune"] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, perimetre: p }))}
                      className={`flex-1 py-2 text-[12px] font-medium transition-colors border-r border-gray-200 last:border-r-0 ${
                        form.perimetre === p ? "bg-[#1B4F8A] text-white" : "text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {PERIMETRE_LABELS[p]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Wilaya selector */}
              {form.perimetre === "wilaya" && (
                <div>
                  <label className="text-[12px] font-medium text-gray-500 mb-1.5 block">Wilaya</label>
                  <select
                    value={form.wilayadId}
                    onChange={e => setForm(f => ({ ...f, wilayadId: e.target.value }))}
                    className={inputCls}
                  >
                    <option value="">Toutes les wilayas</option>
                    {wilayas.map(w => <option key={w.id} value={w.id}>{w.nom}</option>)}
                  </select>
                </div>
              )}

              {/* Seuil + Période */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[12px] font-medium text-gray-500 mb-1.5 block">Nombre de cas *</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      required
                      value={form.seuilNombre}
                      onChange={e => setForm(f => ({ ...f, seuilNombre: e.target.value }))}
                      className={inputCls}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">cas</span>
                  </div>
                </div>
                <div>
                  <label className="text-[12px] font-medium text-gray-500 mb-1.5 block">Période *</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      required
                      value={form.periodejours}
                      onChange={e => setForm(f => ({ ...f, periodejours: e.target.value }))}
                      className={inputCls}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">jours</span>
                  </div>
                </div>
              </div>

              {/* Gravité */}
              <div>
                <label className="text-[12px] font-medium text-gray-500 mb-1.5 block">Niveau de gravité</label>
                <div className="flex gap-2">
                  {(["attention", "urgent", "critique"] as const).map(g => {
                    const cfg = GRAVITE_CONFIG[g]
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, gravite: g }))}
                        className="flex-1 py-2 rounded-lg text-[12px] font-medium border-2 transition-all"
                        style={
                          form.gravite === g
                            ? { backgroundColor: cfg.bg, color: cfg.color, borderColor: cfg.color }
                            : { backgroundColor: "white", color: "#9CA3AF", borderColor: "#E5E7EB" }
                        }
                      >
                        {cfg.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Options */}
              <div className="flex gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.autoAlerte}
                    onChange={e => setForm(f => ({ ...f, autoAlerte: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 accent-[#1B4F8A]"
                  />
                  <span className="text-[12px] text-gray-600">Créer une alerte auto</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.autoNotification}
                    onChange={e => setForm(f => ({ ...f, autoNotification: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 accent-[#1B4F8A]"
                  />
                  <span className="text-[12px] text-gray-600">Notifier l&apos;équipe</span>
                </label>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 h-9 rounded-lg text-[13px] font-medium text-white transition-colors disabled:opacity-60"
                  style={{ backgroundColor: "#1B4F8A" }}
                >
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 h-9 rounded-lg text-[13px] border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
