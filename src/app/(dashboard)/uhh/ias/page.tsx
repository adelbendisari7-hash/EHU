"use client"

import { useState, useEffect, useCallback } from "react"
import { Biohazard, Plus, Search, Filter, ChevronLeft, ChevronRight, X, AlertCircle, CheckCircle } from "lucide-react"

interface Germe { id: string; nom: string; type: string | null }
interface Service { id: string; nom: string; codeService: string }

interface InfectionIAS {
  id: string
  typeIAS: string
  isBMR: boolean
  statut: string
  dateDetection: string
  dateHospitalisation: string | null
  agePatient: number | null
  sexePatient: string | null
  antibiogramme: string | null
  notes: string | null
  service: { id: string; nom: string; codeService: string }
  germe: { id: string; nom: string; type: string | null } | null
  declarant: { firstName: string; lastName: string } | null
}

interface ApiResponse {
  total: number
  page: number
  pages: number
  infections: InfectionIAS[]
}

const TYPE_LABELS: Record<string, string> = {
  PAVM: "PAVM — Pneumonie sous ventilation",
  ISO: "ISO — Infection du site opératoire",
  Autre: "Autre IAS",
}

const STATUT_BADGE: Record<string, { label: string; bg: string; text: string }> = {
  en_cours: { label: "En cours", bg: "#FEF3C7", text: "#92400E" },
  resolu: { label: "Résolu", bg: "#D1FAE5", text: "#065F46" },
}

const EMPTY_FORM = {
  typeIAS: "",
  serviceId: "",
  germeId: "",
  isBMR: false,
  dateDetection: "",
  dateHospitalisation: "",
  agePatient: "",
  sexePatient: "",
  antibiogramme: "",
  notes: "",
}

export default function UhhIasPage() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [filterType, setFilterType] = useState("")
  const [filterBMR, setFilterBMR] = useState("")
  const [filterStatut, setFilterStatut] = useState("")

  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<InfectionIAS | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null)

  const [services, setServices] = useState<Service[]>([])
  const [germes, setGermes] = useState<Germe[]>([])

  const showToast = (type: "ok" | "err", msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3500)
  }

  // Charger germes (retourne un tableau direct)
  useEffect(() => {
    fetch("/api/germes?all=true").then(r => r.ok ? r.json() : null).then(d => {
      if (Array.isArray(d)) setGermes(d)
    })
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: "15" })
    if (filterType) params.set("typeIAS", filterType)
    if (filterBMR) params.set("isBMR", filterBMR)
    if (filterStatut) params.set("statut", filterStatut)
    const res = await fetch(`/api/uhh/ias?${params}`)
    if (res.ok) setData(await res.json())
    setLoading(false)
  }, [page, filterType, filterBMR, filterStatut])

  useEffect(() => { fetchData() }, [fetchData])

  // Charger services depuis l'API existante
  useEffect(() => {
    fetch("/api/uhh/services").then(r => r.ok ? r.json() : null).then(d => {
      if (d?.services) setServices(d.services)
    }).catch(() => {})
  }, [])

  const openNew = () => {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  const openEdit = (inf: InfectionIAS) => {
    setEditTarget(inf)
    setForm({
      typeIAS: inf.typeIAS,
      serviceId: inf.service.id,
      germeId: inf.germe?.id ?? "",
      isBMR: inf.isBMR,
      dateDetection: inf.dateDetection.slice(0, 10),
      dateHospitalisation: inf.dateHospitalisation ? inf.dateHospitalisation.slice(0, 10) : "",
      agePatient: inf.agePatient ? String(inf.agePatient) : "",
      sexePatient: inf.sexePatient ?? "",
      antibiogramme: inf.antibiogramme ?? "",
      notes: inf.notes ?? "",
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.typeIAS || !form.serviceId || !form.dateDetection) {
      showToast("err", "Champs obligatoires : type IAS, service et date de détection")
      return
    }
    setSaving(true)
    try {
      const url = editTarget ? `/api/uhh/ias/${editTarget.id}` : "/api/uhh/ias"
      const method = editTarget ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          isBMR: Boolean(form.isBMR),
          agePatient: form.agePatient || null,
          germeId: form.germeId || null,
          dateHospitalisation: form.dateHospitalisation || null,
          sexePatient: form.sexePatient || null,
        }),
      })
      if (res.ok) {
        showToast("ok", editTarget ? "IAS mise à jour" : "IAS déclarée avec succès")
        setShowForm(false)
        fetchData()
      } else {
        const err = await res.json()
        showToast("err", err.error ?? "Erreur lors de la sauvegarde")
      }
    } finally {
      setSaving(false)
    }
  }

  const handleResolve = async (id: string) => {
    const res = await fetch(`/api/uhh/ias/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut: "resolu" }),
    })
    if (res.ok) { showToast("ok", "IAS marquée résolue"); fetchData() }
  }

  const filtered = (data?.infections ?? []).filter(inf => {
    if (!search) return true
    const q = search.toLowerCase()
    return inf.service.nom.toLowerCase().includes(q) ||
      inf.typeIAS.toLowerCase().includes(q) ||
      (inf.germe?.nom ?? "").toLowerCase().includes(q)
  })

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${toast.type === "ok" ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-800"}`}>
          {toast.type === "ok" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#FEE2E2" }}>
              <Biohazard size={16} style={{ color: "#DC2626" }} />
            </div>
            <h1 className="text-xl font-semibold" style={{ color: "#111827" }}>Infections Associées aux Soins</h1>
          </div>
          <p className="text-sm" style={{ color: "#6B7280" }}>Déclaration et suivi des IAS — PAVM, ISO, BMR</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors" style={{ backgroundColor: "#0F766E" }}>
          <Plus size={16} />
          Nouvelle IAS
        </button>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9CA3AF" }} />
          <input
            type="text"
            placeholder="Rechercher par service, type, germe..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2"
            style={{ borderColor: "#E5E7EB" }}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} style={{ color: "#6B7280" }} />
          <select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1) }} className="px-3 py-2 text-sm border rounded-lg" style={{ borderColor: "#E5E7EB" }}>
            <option value="">Tous les types</option>
            <option value="PAVM">PAVM</option>
            <option value="ISO">ISO</option>
            <option value="Autre">Autre</option>
          </select>
          <select value={filterBMR} onChange={e => { setFilterBMR(e.target.value); setPage(1) }} className="px-3 py-2 text-sm border rounded-lg" style={{ borderColor: "#E5E7EB" }}>
            <option value="">BMR : tous</option>
            <option value="true">BMR uniquement</option>
            <option value="false">Sans BMR</option>
          </select>
          <select value={filterStatut} onChange={e => { setFilterStatut(e.target.value); setPage(1) }} className="px-3 py-2 text-sm border rounded-lg" style={{ borderColor: "#E5E7EB" }}>
            <option value="">Tous statuts</option>
            <option value="en_cours">En cours</option>
            <option value="resolu">Résolus</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
        <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: "#F3F4F6", backgroundColor: "#FAFAFA" }}>
          <span className="text-sm font-medium" style={{ color: "#374151" }}>
            {loading ? "Chargement…" : `${data?.total ?? 0} infections déclarées`}
          </span>
          {data && data.pages > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: "#9CA3AF" }}>Page {page} / {data.pages}</span>
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-1 rounded disabled:opacity-40 hover:bg-gray-100"><ChevronLeft size={14} /></button>
              <button disabled={page >= data.pages} onClick={() => setPage(p => p + 1)} className="p-1 rounded disabled:opacity-40 hover:bg-gray-100"><ChevronRight size={14} /></button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16" style={{ color: "#9CA3AF" }}>
            <Biohazard size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Aucune IAS déclarée</p>
            <button onClick={openNew} className="mt-3 text-sm underline" style={{ color: "#0F766E" }}>Déclarer la première IAS</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
                  {["Type IAS", "Service", "Germe", "BMR", "Date détection", "Âge / Sexe", "Statut", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap" style={{ color: "#6B7280" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "#F3F4F6" }}>
                {filtered.map(inf => {
                  const badge = STATUT_BADGE[inf.statut] ?? { label: inf.statut, bg: "#F3F4F6", text: "#374151" }
                  return (
                    <tr key={inf.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: inf.typeIAS === "PAVM" ? "#EFF6FF" : inf.typeIAS === "ISO" ? "#FDF4FF" : "#F3F4F6", color: inf.typeIAS === "PAVM" ? "#1D4ED8" : inf.typeIAS === "ISO" ? "#7C3AED" : "#374151" }}>
                          {inf.typeIAS}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium" style={{ color: "#111827" }}>
                        {inf.service.nom}
                        <div className="text-xs font-normal mt-0.5" style={{ color: "#9CA3AF" }}>{inf.service.codeService}</div>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: "#374151" }}>
                        {inf.germe ? (
                          <>
                            {inf.germe.nom}
                            <div className="mt-0.5" style={{ color: "#9CA3AF" }}>{inf.germe.type ?? ""}</div>
                          </>
                        ) : <span style={{ color: "#D1D5DB" }}>—</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {inf.isBMR ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: "#FEE2E2", color: "#DC2626" }}>
                            <Biohazard size={10} /> BMR
                          </span>
                        ) : <span style={{ color: "#D1D5DB" }}>—</span>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs" style={{ color: "#374151" }}>
                        {new Date(inf.dateDetection).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: "#374151" }}>
                        {inf.agePatient ? `${inf.agePatient} ans` : "—"}
                        {inf.sexePatient && <span className="ml-1" style={{ color: "#9CA3AF" }}>· {inf.sexePatient === "homme" ? "M" : "F"}</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: badge.bg, color: badge.text }}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEdit(inf)} className="text-xs px-2 py-1 rounded border hover:bg-gray-50 transition-colors" style={{ borderColor: "#E5E7EB", color: "#374151" }}>
                            Modifier
                          </button>
                          {inf.statut === "en_cours" && (
                            <button onClick={() => handleResolve(inf.id)} className="text-xs px-2 py-1 rounded border hover:bg-green-50 transition-colors" style={{ borderColor: "#A7F3D0", color: "#065F46" }}>
                              Résoudre
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal formulaire */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: "#E5E7EB" }}>
              <h2 className="text-lg font-semibold" style={{ color: "#111827" }}>
                {editTarget ? "Modifier l'IAS" : "Déclarer une nouvelle IAS"}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X size={18} style={{ color: "#6B7280" }} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Type IAS */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#374151" }}>Type d&apos;IAS <span style={{ color: "#DC2626" }}>*</span></label>
                  <select
                    required
                    value={form.typeIAS}
                    onChange={e => setForm(f => ({ ...f, typeIAS: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    style={{ borderColor: "#E5E7EB" }}
                  >
                    <option value="">Sélectionner…</option>
                    {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#374151" }}>Service hospitalier <span style={{ color: "#DC2626" }}>*</span></label>
                  <select
                    required
                    value={form.serviceId}
                    onChange={e => setForm(f => ({ ...f, serviceId: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    style={{ borderColor: "#E5E7EB" }}
                  >
                    <option value="">Sélectionner…</option>
                    {services.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
                  </select>
                </div>
              </div>

              {/* Date + hospitalisation */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#374151" }}>Date de détection <span style={{ color: "#DC2626" }}>*</span></label>
                  <input
                    required
                    type="date"
                    value={form.dateDetection}
                    onChange={e => setForm(f => ({ ...f, dateDetection: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    style={{ borderColor: "#E5E7EB" }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#374151" }}>Date d&apos;hospitalisation</label>
                  <input
                    type="date"
                    value={form.dateHospitalisation}
                    onChange={e => setForm(f => ({ ...f, dateHospitalisation: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    style={{ borderColor: "#E5E7EB" }}
                  />
                </div>
              </div>

              {/* Patient */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#374151" }}>Âge du patient (ans)</label>
                  <input
                    type="number"
                    min={0}
                    max={120}
                    value={form.agePatient}
                    onChange={e => setForm(f => ({ ...f, agePatient: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    style={{ borderColor: "#E5E7EB" }}
                    placeholder="ex: 65"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#374151" }}>Sexe</label>
                  <select
                    value={form.sexePatient}
                    onChange={e => setForm(f => ({ ...f, sexePatient: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    style={{ borderColor: "#E5E7EB" }}
                  >
                    <option value="">Non précisé</option>
                    <option value="homme">Masculin</option>
                    <option value="femme">Féminin</option>
                  </select>
                </div>
              </div>

              {/* Germe + BMR */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#374151" }}>Germe en cause</label>
                  <select
                    value={form.germeId}
                    onChange={e => setForm(f => ({ ...f, germeId: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    style={{ borderColor: "#E5E7EB" }}
                  >
                    <option value="">Non identifié</option>
                    {germes.map(g => <option key={g.id} value={g.id}>{g.nom}{g.type ? ` (${g.type})` : ""}</option>)}
                  </select>
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={form.isBMR}
                      onChange={e => setForm(f => ({ ...f, isBMR: e.target.checked }))}
                      className="w-4 h-4 rounded"
                      style={{ accentColor: "#DC2626" }}
                    />
                    <span className="text-sm font-medium flex items-center gap-1.5" style={{ color: "#DC2626" }}>
                      <Biohazard size={14} />
                      Bactérie Multi-Résistante (BMR)
                    </span>
                  </label>
                </div>
              </div>

              {/* Antibiogramme */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#374151" }}>Résultat antibiogramme</label>
                <textarea
                  value={form.antibiogramme}
                  onChange={e => setForm(f => ({ ...f, antibiogramme: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                  style={{ borderColor: "#E5E7EB" }}
                  placeholder="Ex: R Amoxicilline, S Imipénème…"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#374151" }}>Notes / observations</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                  style={{ borderColor: "#E5E7EB" }}
                  placeholder="Observations cliniques, mesures prises…"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 transition-colors" style={{ borderColor: "#E5E7EB", color: "#374151" }}>
                  Annuler
                </button>
                <button type="submit" disabled={saving} className="px-5 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-60" style={{ backgroundColor: "#0F766E" }}>
                  {saving ? "Enregistrement…" : editTarget ? "Mettre à jour" : "Déclarer l'IAS"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
