"use client"

import { useState, useEffect, useCallback } from "react"
import {
  ComposedChart, Bar, Line, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Cell,
} from "recharts"
import { AlertTriangle, CheckCircle, AlertCircle, TrendingUp, TrendingDown, Minus, Info, RefreshCw } from "lucide-react"
import DashboardFilters, { type DashboardFiltersState } from "@/components/dashboard/dashboard-filters"
import { computeCusum, computeHoltWinters, type CusumResult, type HoltWintersResult, type SeriesPoint } from "@/lib/predictions"
import { DashboardSkeleton } from "@/components/shared/skeleton"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Maladie { id: string; nom: string; groupeEpidemiologique?: string | null }
interface Commune { id: string; nom: string; wilayadId?: string }
interface Wilaya { id: string; nom: string; code: string }

interface Props {
  maladies: Maladie[]
  communes: Commune[]
  wilayas: Wilaya[]
  userName: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CUSUM_COLORS = {
  normal:    "#22C55E",
  attention: "#F59E0B",
  alerte:    "#EF4444",
}

const STATUS_CONFIG = {
  normal:    { bg: "#F0FDF4", border: "#BBF7D0", text: "#15803D", icon: CheckCircle },
  attention: { bg: "#FFFBEB", border: "#FDE68A", text: "#B45309", icon: AlertTriangle },
  alerte:    { bg: "#FEF2F2", border: "#FECACA", text: "#B91C1C", icon: AlertCircle },
}

const TENDANCE_CONFIG = {
  hausse: { icon: TrendingUp,   color: "#DC2626", label: "En hausse" },
  stable: { icon: Minus,        color: "#6B7280", label: "Stable" },
  baisse: { icon: TrendingDown, color: "#059669", label: "En baisse" },
}

function formatDateAxis(dateStr: string): string {
  const d = new Date(dateStr)
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`
}

function formatDateFull(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
}

// ─── Custom Tooltips ──────────────────────────────────────────────────────────

function CusumTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; dataKey: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  const count = payload.find(p => p.dataKey === "count")?.value
  const moyenne = payload.find(p => p.dataKey === "moyenne")?.value
  const seuilHaut = payload.find(p => p.dataKey === "seuilHaut")?.value
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md p-3 text-[12px]">
      <p className="font-semibold text-gray-700 mb-1.5">{label ? formatDateFull(label) : ""}</p>
      {count !== undefined && <p className="text-gray-900">Cas déclarés : <span className="font-bold">{count}</span></p>}
      {moyenne !== undefined && <p className="text-gray-400">Moyenne habituelle : {moyenne}</p>}
      {seuilHaut !== undefined && <p className="text-red-400">Seuil d&apos;alerte : {seuilHaut}</p>}
    </div>
  )
}

function HWTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; dataKey: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  const count = payload.find(p => p.dataKey === "count")?.value
  const prevision = payload.find(p => p.dataKey === "prevision")?.value
  const bas = payload.find(p => p.dataKey === "bas")?.value
  const haut = payload.find(p => p.dataKey === "haut")?.value
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md p-3 text-[12px]">
      <p className="font-semibold text-gray-700 mb-1.5">{label ? formatDateFull(label) : ""}</p>
      {count != null && <p className="text-[#1B4F8A]">Cas réels : <span className="font-bold">{count}</span></p>}
      {prevision != null && <p className="text-indigo-600">Prévision : <span className="font-bold">~{prevision}</span></p>}
      {bas != null && haut != null && <p className="text-gray-400">Intervalle : {bas} – {haut}</p>}
    </div>
  )
}

// ─── CUSUM Section ────────────────────────────────────────────────────────────

function CusumSection({ result }: { result: CusumResult }) {
  const cfg = STATUS_CONFIG[result.niveauActuel]
  const StatusIcon = cfg.icon

  return (
    <div className="card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="card-title">Détection d&apos;anomalies</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Basée sur les 90 derniers jours — mise à jour à chaque filtre</p>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-gray-400">
          <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: CUSUM_COLORS.normal }} />Normale
          <span className="w-3 h-3 rounded-sm inline-block ml-1" style={{ backgroundColor: CUSUM_COLORS.attention }} />Hausse
          <span className="w-3 h-3 rounded-sm inline-block ml-1" style={{ backgroundColor: CUSUM_COLORS.alerte }} />Alerte
        </div>
      </div>

      {/* Status banner */}
      <div
        className="rounded-xl p-4 mb-5 flex items-start gap-3 border"
        style={{ backgroundColor: cfg.bg, borderColor: cfg.border }}
      >
        <StatusIcon size={20} style={{ color: cfg.text, flexShrink: 0, marginTop: 1 }} />
        <div>
          <p className="font-semibold text-[13px]" style={{ color: cfg.text }}>{result.titreStatut}</p>
          <p className="text-[12px] mt-0.5 leading-relaxed" style={{ color: cfg.text, opacity: 0.85 }}>
            {result.descriptionStatut}
          </p>
        </div>
      </div>

      {/* Chart */}
      {result.donneesInsuffisantes ? (
        <div className="flex items-center justify-center h-48 rounded-lg bg-gray-50">
          <div className="text-center">
            <Info size={28} className="text-gray-300 mx-auto mb-2" />
            <p className="text-[13px] text-gray-500 font-medium">Pas assez de données</p>
            <p className="text-[11px] text-gray-400 mt-1">14 jours de déclarations requis</p>
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={result.points} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatDateAxis}
              tick={{ fontSize: 10, fill: "#9CA3AF" }}
              axisLine={false}
              tickLine={false}
              interval={Math.floor(result.points.length / 8)}
            />
            <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} width={28} />
            <Tooltip content={<CusumTooltip />} />
            <Bar dataKey="count" radius={[2, 2, 0, 0]} maxBarSize={18}>
              {result.points.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={CUSUM_COLORS[entry.niveau]} />
              ))}
            </Bar>
            <Line type="monotone" dataKey="moyenne" stroke="#94A3B8" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
            <Line type="monotone" dataKey="seuilHaut" stroke="#EF4444" strokeWidth={1} dot={false} strokeDasharray="6 3" strokeOpacity={0.5} />
          </ComposedChart>
        </ResponsiveContainer>
      )}

      {/* Legend note */}
      {!result.donneesInsuffisantes && (
        <p className="text-[11px] text-gray-400 mt-3 flex items-center gap-1">
          <span className="inline-block w-5 border-t-2 border-dashed border-gray-300 align-middle" />
          Moyenne habituelle
          <span className="inline-block w-5 border-t-2 border-dashed border-red-300 align-middle ml-3" />
          Seuil d&apos;alerte ({result.seuilAlerte} cas/jour)
        </p>
      )}
    </div>
  )
}

// ─── Holt-Winters Section ─────────────────────────────────────────────────────

function HoltWintersSection({
  result,
  horizon,
  onHorizonChange,
}: {
  result: HoltWintersResult
  horizon: number
  onHorizonChange: (h: number) => void
}) {
  const tendanceCfg = TENDANCE_CONFIG[result.tendance]
  const TendanceIcon = tendanceCfg.icon
  const todayStr = new Date().toISOString().slice(0, 10)

  return (
    <div className="card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <p className="card-title">Prévisions pour les prochains jours</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Projection basée sur la tendance récente des déclarations</p>
        </div>
        {/* Horizon selector */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          {[{ v: 7, l: "7 jours" }, { v: 14, l: "14 jours" }, { v: 30, l: "30 jours" }].map(opt => (
            <button
              key={opt.v}
              onClick={() => onHorizonChange(opt.v)}
              className={`px-3 h-[30px] text-[11px] font-semibold transition-all border-r border-gray-200 last:border-r-0 ${
                horizon === opt.v ? "bg-[#1B4F8A] text-white" : "bg-white text-gray-500 hover:bg-gray-50"
              }`}
            >
              {opt.l}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Dans 7 jours</p>
          <p className="text-xl font-bold text-gray-900">~{result.prevision7j}</p>
          <p className="text-[10px] text-gray-400">cas/jour</p>
        </div>
        <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Dans 14 jours</p>
          <p className="text-xl font-bold text-gray-900">~{result.prevision14j}</p>
          <p className="text-[10px] text-gray-400">cas/jour</p>
        </div>
        <div className="rounded-xl border p-3 text-center" style={{ backgroundColor: tendanceCfg.color + "10", borderColor: tendanceCfg.color + "30" }}>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Tendance</p>
          <div className="flex items-center justify-center gap-1">
            <TendanceIcon size={16} style={{ color: tendanceCfg.color }} />
            <p className="text-[13px] font-bold" style={{ color: tendanceCfg.color }}>{tendanceCfg.label}</p>
          </div>
          <p className="text-[10px] text-gray-400">
            {result.tendancePct !== 0 ? `${result.tendancePct > 0 ? "+" : ""}${result.tendancePct}% vs maintenant` : "aucun changement"}
          </p>
        </div>
        <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Fiabilité</p>
          <p className="text-xl font-bold" style={{ color: result.fiabilite >= 60 ? "#059669" : result.fiabilite >= 40 ? "#D97706" : "#DC2626" }}>
            {result.fiabilite}%
          </p>
          <p className="text-[10px] text-gray-400">{result.fiabilite >= 70 ? "Bonne" : result.fiabilite >= 50 ? "Modérée" : "Faible"}</p>
        </div>
      </div>

      {/* Chart */}
      {result.donneesInsuffisantes ? (
        <div className="flex items-center justify-center h-48 rounded-lg bg-gray-50">
          <div className="text-center">
            <Info size={28} className="text-gray-300 mx-auto mb-2" />
            <p className="text-[13px] text-gray-500 font-medium">Pas assez de données</p>
            <p className="text-[11px] text-gray-400 mt-1">7 jours de déclarations requis</p>
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={result.points} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatDateAxis}
              tick={{ fontSize: 10, fill: "#9CA3AF" }}
              axisLine={false}
              tickLine={false}
              interval={Math.floor(result.points.length / 8)}
            />
            <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} width={28} />
            <Tooltip content={<HWTooltip />} />

            {/* Confidence band: upper area first, then lower mask in white */}
            <Area type="monotone" dataKey="haut" fill="#C7D2FE" stroke="none" fillOpacity={0.45} connectNulls={false} />
            <Area type="monotone" dataKey="bas" fill="white" stroke="none" fillOpacity={1} connectNulls={false} />

            {/* Historical line */}
            <Line type="monotone" dataKey="count" stroke="#1B4F8A" strokeWidth={2} dot={false} connectNulls={false} />
            {/* Forecast line */}
            <Line type="monotone" dataKey="prevision" stroke="#6366F1" strokeWidth={2} dot={false} strokeDasharray="6 3" connectNulls={false} />

            {/* Today separator */}
            <ReferenceLine
              x={todayStr}
              stroke="#D1D5DB"
              strokeDasharray="4 2"
              label={{ value: "Aujourd'hui", position: "top", fill: "#9CA3AF", fontSize: 10 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}

      {/* Legend */}
      {!result.donneesInsuffisantes && (
        <div className="flex flex-wrap items-center gap-4 mt-3">
          <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
            <span className="w-6 h-0.5 inline-block rounded" style={{ backgroundColor: "#1B4F8A" }} />
            Cas réels
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
            <span className="w-6 h-0 inline-block border-t-2 border-dashed border-indigo-400" />
            Prévision
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
            <span className="w-4 h-3 inline-block rounded" style={{ backgroundColor: "#C7D2FE", opacity: 0.6 }} />
            Intervalle de confiance
          </span>
        </div>
      )}

      {/* Plain language explanation */}
      <div className="mt-4 p-3 rounded-lg bg-gray-50 border border-gray-100">
        <p className="text-[12px] text-gray-600 leading-relaxed">{result.messageTendance}</p>
        {result.fiabilite < 50 && (
          <p className="text-[11px] text-amber-600 mt-2 flex items-center gap-1">
            <AlertTriangle size={12} />
            Fiabilité faible : les prévisions sont moins précises avec peu de données historiques.
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PredictionsClient({ maladies, communes, wilayas }: Props) {
  const [filters, setFilters] = useState<DashboardFiltersState>({
    days: "30",
    dateDebut: "",
    dateFin: "",
    maladieIds: [],
    wilayadIds: [],
    communeIds: [],
    services: [],
  })
  const [horizon, setHorizon] = useState(14)
  const [series, setSeries] = useState<SeriesPoint[] | null>(null)
  const [contextLabel, setContextLabel] = useState("Toutes maladies — toutes zones")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [availableServices, setAvailableServices] = useState<string[]>([])

  useEffect(() => {
    fetch("/api/stats/services").then(r => r.json()).then((d: string[]) => setAvailableServices(d)).catch(() => {})
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const params = new URLSearchParams()
      if (filters.communeIds.length > 0) params.set("communeIds", filters.communeIds.join(","))
      if (filters.maladieIds.length > 0) params.set("maladieIds", filters.maladieIds.join(","))
      if (filters.wilayadIds.length > 0) params.set("wilayadIds", filters.wilayadIds.join(","))
      if (filters.services.length > 0) params.set("services", filters.services.join(","))
      const res = await fetch(`/api/stats/predictions?${params}`)
      if (!res.ok) throw new Error()
      const json = await res.json()
      setSeries(json.series)
      setContextLabel(json.contextLabel)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { fetchData() }, [fetchData])

  // Run algorithms client-side (pure TS, no server round-trip)
  const cusum = series ? computeCusum(series) : null
  const hw = series ? computeHoltWinters(series, horizon) : null

  return (
    <div>
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title">Prédictions épidémiques</h1>
          <p className="page-subtitle">
            Détection d&apos;anomalies et prévisions basées sur les déclarations —&nbsp;
            <span className="font-medium text-gray-600">{contextLabel}</span>
          </p>
        </div>
        <DashboardFilters
          maladies={maladies}
          communes={communes}
          wilayas={wilayas}
          services={availableServices}
          filters={filters}
          onChange={setFilters}
        />
      </div>

      {loading && !series ? (
        <DashboardSkeleton />
      ) : error ? (
        <div className="card p-16 text-center">
          <AlertCircle size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-600 mb-1">Erreur de chargement</p>
          <p className="text-xs text-gray-400 mb-5">Impossible de récupérer les données</p>
          <button onClick={fetchData} className="btn btn-secondary btn-sm">
            <RefreshCw size={13} /> Réessayer
          </button>
        </div>
      ) : cusum && hw ? (
        <div className="space-y-4">
          {/* Info banner */}
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 flex items-start gap-3">
            <Info size={16} className="text-blue-500 mt-0.5 shrink-0" />
            <p className="text-[12px] text-blue-700 leading-relaxed">
              Les prédictions sont basées sur les données des 90 derniers jours. Elles sont automatiquement recalculées dès que vous changez un filtre.
              Plus vous avez de données historiques, plus les prévisions sont précises.
            </p>
          </div>

          <CusumSection result={cusum} />
          <HoltWintersSection result={hw} horizon={horizon} onHorizonChange={setHorizon} />
        </div>
      ) : null}
    </div>
  )
}
