"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { AlertTriangle, Plus, X, RefreshCw, Search, Calendar, Clock, Siren, CheckCircle2, Timer } from "lucide-react"
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
  resolvedAt: string | null
  maladie: { nom: string; delaiNotificationHeures: number | null; frequenceDeclaration: string | null } | null
  commune: { nom: string } | null
}

// ─── Utilitaires délai ────────────────────────────────────────────────────────

function getDelaiMs(alerte: Alerte): number | null {
  const heures = alerte.maladie?.delaiNotificationHeures
  if (!heures) return null
  return heures * 3600 * 1000
}

function getDeadline(alerte: Alerte): Date | null {
  const ms = getDelaiMs(alerte)
  if (!ms) return null
  return new Date(new Date(alerte.createdAt).getTime() + ms)
}

function isUrgence(alerte: Alerte): boolean {
  return alerte.maladie?.frequenceDeclaration === "urgence"
}

function formatCountdown(msLeft: number): string {
  if (msLeft <= 0) return "00:00:00"
  const totalSec = Math.floor(msLeft / 1000)
  const days = Math.floor(totalSec / 86400)
  const hours = Math.floor((totalSec % 86400) / 3600)
  const mins = Math.floor((totalSec % 3600) / 60)
  const secs = totalSec % 60
  if (days > 0) return `${days}j ${String(hours).padStart(2, "0")}h ${String(mins).padStart(2, "0")}m`
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
}

function getProgressPercent(alerte: Alerte, now: number): number {
  const deadline = getDeadline(alerte)
  if (!deadline) return 100
  const total = getDelaiMs(alerte)!
  const elapsed = now - new Date(alerte.createdAt).getTime()
  return Math.min(100, Math.max(0, (elapsed / total) * 100))
}

function getCountdownColor(pct: number): { bar: string; text: string } {
  if (pct >= 90) return { bar: "#DC2626", text: "#DC2626" }
  if (pct >= 65) return { bar: "#F97316", text: "#EA580C" }
  if (pct >= 40) return { bar: "#EAB308", text: "#CA8A04" }
  return { bar: "#22C55E", text: "#16A34A" }
}

// ─── Composant compte à rebours ────────────────────────────────────────────────

function CountdownBadge({ alerte }: { alerte: Alerte }) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (alerte.statut !== "active") return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [alerte.statut])

  if (alerte.statut !== "active") return null

  // Urgence immédiate : badge rouge pulsant, pas de décompte
  if (isUrgence(alerte)) {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold animate-pulse"
        style={{ backgroundColor: "#FEF2F2", color: "#B91C1C", border: "1px solid #FECACA" }}
      >
        <Siren size={11} />
        URGENCE
      </span>
    )
  }

  const deadline = getDeadline(alerte)
  if (!deadline) return null

  const msLeft = deadline.getTime() - now
  const pct = getProgressPercent(alerte, now)
  const { text } = getCountdownColor(pct)
  const expired = msLeft <= 0

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
      style={{
        backgroundColor: expired ? "#FEF2F2" : "#F8FAFF",
        color: expired ? "#DC2626" : text,
        border: `1px solid ${expired ? "#FECACA" : "#E5E7EB"}`,
      }}
    >
      <Timer size={11} />
      {expired ? "Délai dépassé" : formatCountdown(msLeft)}
    </span>
  )
}

// ─── Barre de progression ─────────────────────────────────────────────────────

function ProgressBar({ alerte, now }: { alerte: Alerte; now: number }) {
  if (alerte.statut !== "active" || isUrgence(alerte)) return null
  const deadline = getDeadline(alerte)
  if (!deadline) return null
  const pct = getProgressPercent(alerte, now)
  const { bar } = getCountdownColor(pct)
  return (
    <div className="mt-3 h-1 rounded-full bg-gray-100 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-1000"
        style={{ width: `${pct}%`, backgroundColor: bar }}
      />
    </div>
  )
}

// ─── Configs UI ───────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  epidemique:  { label: "Épidémique",    color: "#B91C1C", bg: "#FEF2F2", border: "#FECACA" },
  seuil:       { label: "Seuil atteint", color: "#B45309", bg: "#FFFBEB", border: "#FDE68A" },
  information: { label: "Information",   color: "#1B4F8A", bg: "#EEF4FF", border: "#C5DAFC" },
}

const DELAI_LABEL: Record<string, string> = {
  urgence:      "Immédiat",
  quotidienne:  "24 heures",
  hebdomadaire: "7 jours",
  mensuelle:    "30 jours",
}

const STATUT_TABS = [
  { key: "",        label: "Toutes" },
  { key: "active",  label: "Actives" },
  { key: "resolue", label: "Résolues" },
]

// ─── Page principale ──────────────────────────────────────────────────────────

export default function AlertesPage() {
  const [alertes, setAlertes]         = useState<Alerte[]>([])
  const [loading, setLoading]         = useState(true)
  const [fetchError, setFetchError]   = useState(false)
  const [statut, setStatut]           = useState("")
  const [search, setSearch]           = useState("")
  const [dateDebut, setDateDebut]     = useState("")
  const [dateFin, setDateFin]         = useState("")
  const [maladieFilter, setMaladieFilter] = useState("")
  const [maladies, setMaladies]       = useState<{ id: string; nom: string; groupeEpidemiologique?: string | null }[]>([])
  const [showForm, setShowForm]       = useState(false)
  const [form, setForm]               = useState({ type: "information", titre: "", description: "", maladieId: "", nombreCas: "" })
  const [submitting, setSubmitting]   = useState(false)
  const [now, setNow]                 = useState(() => Date.now())

  // Horloge globale pour les barres de progression (tick chaque seconde)
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

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
    setDateDebut(""); setDateFin(""); setMaladieFilter(""); setSearch(""); setStatut("")
  }

  // Trier : urgence active en premier, puis par temps restant croissant
  const sorted = [...alertes]
    .filter(a => {
      if (!search) return true
      const q = search.toLowerCase()
      return a.titre.toLowerCase().includes(q) ||
        (a.maladie?.nom.toLowerCase().includes(q) ?? false) ||
        (a.commune?.nom.toLowerCase().includes(q) ?? false)
    })
    .sort((a, b) => {
      if (a.statut !== "active" && b.statut === "active") return 1
      if (a.statut === "active" && b.statut !== "active") return -1
      if (isUrgence(a) && !isUrgence(b)) return -1
      if (!isUrgence(a) && isUrgence(b)) return 1
      const da = getDeadline(a), db = getDeadline(b)
      if (!da && !db) return 0
      if (!da) return 1
      if (!db) return -1
      return da.getTime() - db.getTime()
    })

  const urgentActives = alertes.filter(a => a.statut === "active" && isUrgence(a))
  const hasFilters = dateDebut || dateFin || maladieFilter || search
  const input = "w-full h-9 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#1B4F8A]"

  return (
    <div>
      {/* ─── Bandeau urgence global ─────────────────────────────────── */}
      {urgentActives.length > 0 && (
        <div
          className="rounded-xl p-4 mb-5 animate-pulse"
          style={{ backgroundColor: "#FEF2F2", border: "2px solid #DC2626" }}
        >
          <div className="flex items-center gap-3">
            <Siren size={22} style={{ color: "#DC2626" }} className="shrink-0" />
            <div>
              <p className="text-sm font-bold" style={{ color: "#991B1B" }}>
                🚨 {urgentActives.length} alerte{urgentActives.length > 1 ? "s" : ""} — Intervention immédiate requise
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#B91C1C" }}>
                {urgentActives.map(a => a.maladie?.nom ?? a.titre).join(" · ")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── En-tête ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Alertes Épidémiques</h1>
          <p className="page-subtitle">Surveillance des seuils et délais de résolution</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
          style={{ backgroundColor: "#1B4F8A" }}
        >
          <Plus size={16} /> Nouvelle Alerte
        </button>
      </div>

      {/* ─── Formulaire création ─────────────────────────────────────── */}
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
                {[
                  { key: "pev", label: "PEV" }, { key: "mth", label: "MTH" },
                  { key: "zoonose", label: "Zoonose" }, { key: "ist", label: "IST" },
                  { key: "vectorielle", label: "Vectorielle" }, { key: "nosocomiale", label: "Nosocomiale" },
                  { key: "autre", label: "Autre" },
                ].map(({ key, label }) => {
                  const list = maladies.filter(m => (m.groupeEpidemiologique ?? "autre") === key)
                  if (list.length === 0) return null
                  return (
                    <optgroup key={key} label={label}>
                      {list.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
                    </optgroup>
                  )
                })}
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

      {/* ─── Filtres ─────────────────────────────────────────────────── */}
      <div className="card p-4 mb-4 space-y-3">
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
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher..." className="h-8 pl-8 pr-3 rounded-lg border border-gray-200 text-[12px] outline-none focus:border-[#1B4F8A] min-w-[180px]"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar size={13} className="text-gray-400" />
            <input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)} className="h-8 px-2 rounded-lg border border-gray-200 text-[12px] outline-none focus:border-[#1B4F8A]" />
            <span className="text-gray-400 text-[12px]">→</span>
            <input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)} className="h-8 px-2 rounded-lg border border-gray-200 text-[12px] outline-none focus:border-[#1B4F8A]" />
          </div>
          <select value={maladieFilter} onChange={e => setMaladieFilter(e.target.value)} className="h-8 px-3 rounded-lg border border-gray-200 text-[12px] outline-none focus:border-[#1B4F8A] bg-white">
            <option value="">Toutes les maladies</option>
            {[
              { key: "pev", label: "PEV" }, { key: "mth", label: "MTH" },
              { key: "zoonose", label: "Zoonose" }, { key: "ist", label: "IST" },
              { key: "vectorielle", label: "Vectorielle" }, { key: "nosocomiale", label: "Nosocomiale" },
              { key: "autre", label: "Autre" },
            ].map(({ key, label }) => {
              const list = maladies.filter(m => (m.groupeEpidemiologique ?? "autre") === key)
              if (list.length === 0) return null
              return (
                <optgroup key={key} label={label}>
                  {list.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
                </optgroup>
              )
            })}
          </select>
          {hasFilters && (
            <button onClick={resetFilters} className="flex items-center gap-1 text-[12px] text-gray-400 hover:text-gray-600 transition-colors">
              <X size={12} /> Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* ─── Liste des alertes ───────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}</div>
      ) : fetchError ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <AlertTriangle size={32} className="text-red-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500 mb-3">Impossible de charger les alertes</p>
          <button onClick={fetchAlertes} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 hover:bg-gray-50 text-gray-600">
            <RefreshCw size={13} /> Réessayer
          </button>
        </div>
      ) : !sorted.length ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <AlertTriangle size={36} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Aucune alerte trouvée</p>
          <p className="text-gray-400 text-sm mt-1">
            {hasFilters ? "Essayez de modifier les filtres" : "Les alertes apparaissent ici automatiquement ou peuvent être créées manuellement"}
          </p>
          {hasFilters && <button onClick={resetFilters} className="mt-3 text-[12px] text-[#1B4F8A] hover:underline">Réinitialiser</button>}
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map(a => {
            const typeConf = TYPE_CONFIG[a.type] ?? TYPE_CONFIG.information
            const urgent = isUrgence(a) && a.statut === "active"
            const deadline = getDeadline(a)
            const msLeft = deadline ? deadline.getTime() - now : null
            const expired = msLeft !== null && msLeft <= 0 && a.statut === "active"
            const pct = a.statut === "active" && !isUrgence(a) ? getProgressPercent(a, now) : 0
            const { text: cntColor } = getCountdownColor(pct)
            const freq = a.maladie?.frequenceDeclaration
            const delaiLabel = freq ? DELAI_LABEL[freq] : null

            return (
              <div
                key={a.id}
                className="bg-white rounded-xl border shadow-sm p-4 transition-all"
                style={{
                  borderColor: urgent ? "#DC2626" : expired ? "#F97316" : typeConf.border,
                  boxShadow: urgent ? "0 0 0 2px #FCA5A5" : expired ? "0 0 0 1px #FDBA74" : undefined,
                  animation: urgent ? "pulse 1.5s cubic-bezier(0.4,0,0.6,1) infinite" : undefined,
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Colonne gauche */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="shrink-0 mt-0.5">
                      {urgent ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold animate-pulse" style={{ backgroundColor: "#FEF2F2", color: "#B91C1C", border: "1px solid #FECACA" }}>
                          <Siren size={10} /> URGENCE
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap" style={{ color: typeConf.color, backgroundColor: typeConf.bg, borderColor: typeConf.border }}>
                          {typeConf.label}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{a.titre}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{a.description}</p>

                      {/* Métadonnées */}
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-400">
                        {a.maladie && <span>🦠 {a.maladie.nom}</span>}
                        {a.commune && <span>📍 {a.commune.nom}</span>}
                        <span>👥 {a.nombreCas} cas</span>
                        <span>📅 {formatDate(a.createdAt)}</span>
                        {delaiLabel && a.statut === "active" && (
                          <span className="flex items-center gap-1" style={{ color: urgent ? "#DC2626" : "#6B7280" }}>
                            <Clock size={10} />
                            Délai : {delaiLabel}
                          </span>
                        )}
                        {a.statut === "resolue" && a.resolvedAt && (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 size={10} />
                            Résolu le {formatDate(a.resolvedAt)}
                          </span>
                        )}
                      </div>

                      {/* Barre de progression (non-urgence) */}
                      {a.statut === "active" && !isUrgence(a) && deadline && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px]" style={{ color: cntColor }}>
                              {expired ? "⚠ Délai dépassé" : `Temps restant : ${formatCountdown(msLeft!)}`}
                            </span>
                            <span className="text-[10px] text-gray-400">{Math.round(pct)}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-1000"
                              style={{ width: `${pct}%`, backgroundColor: getCountdownColor(pct).bar }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Message d'urgence sous la carte */}
                      {urgent && (
                        <p className="mt-2 text-xs font-semibold" style={{ color: "#DC2626" }}>
                          ⚡ Intervention immédiate requise — résoudre avant toute chose
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Colonne droite : statut + bouton */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {a.statut === "active" ? (
                      <>
                        <CountdownBadge alerte={a} />
                        <button
                          onClick={() => resolveAlerte(a.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
                          style={{
                            borderColor: urgent ? "#DC2626" : "#A7F3D0",
                            color: urgent ? "#DC2626" : "#065F46",
                            backgroundColor: urgent ? "#FEF2F2" : "#F0FDF4",
                          }}
                        >
                          ✓ Résoudre
                        </button>
                      </>
                    ) : (
                      <span className="text-xs font-medium text-green-600 flex items-center gap-1">
                        <CheckCircle2 size={13} /> Résolue
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
          <p className="text-[11px] text-gray-400 text-right pt-1">
            {sorted.length} alerte{sorted.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}
    </div>
  )
}
