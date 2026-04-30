"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, LineChart, Line,
} from "recharts"
import AnalysesExportMenu from "@/components/analyses/analyses-export-menu"
import { Search, ChevronDown, X } from "lucide-react"
import { cn } from "@/utils/cn"

const COLORS = ["#1B4F8A", "#3A7BD5", "#E74C3C", "#F39C12", "#27AE60", "#7C3AED", "#5499E8", "#8AB8F5"]

const STATUT_LABELS: Record<string, string> = {
  brouillon: "Brouillon",
  confirme: "Confirmé",
  suspect: "Suspect",
  nouveau: "Nouveau",
  en_cours: "En cours",
  infirme: "Infirmé",
  cloture: "Clôturé",
}

interface AnalyticsData {
  prevalence: { name: string; count: number }[]
  statutDistribution: { name: string; count: number }[]
  ageDistribution: { name: string; count: number }[]
  sexDistribution: { name: string; count: number }[]
  weeklyTrend: { date: string; count: number }[]
  summary: { total: number; confirmes: number; tauxConfirmation: number; maladiesActives: number }
}

interface RefItem { id: string; nom: string }
interface WilayaItem extends RefItem { code: string }
interface CommuneItem extends RefItem { wilayadId: string }

interface Filters {
  days: string
  dateDebut: string
  dateFin: string
  maladieIds: string[]
  wilayadIds: string[]
  communeId: string
}

// ── Reusable multi-select (same UI as dashboard) ───────────────────────────
function MultiSelect({
  options,
  selected,
  onChange,
  placeholder,
  width = "min-w-[150px]",
}: {
  options: { value: string; label: string }[]
  selected: string[]
  onChange: (vals: string[]) => void
  placeholder: string
  width?: string
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)

  const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
  const toggle = (val: string) =>
    onChange(selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val])

  const label =
    selected.length === 0
      ? placeholder
      : selected.length === 1
        ? (options.find(o => o.value === selected[0])?.label ?? placeholder)
        : `${selected.length} sélectionnés`

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  return (
    <div ref={containerRef} className={cn("relative", width)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "input h-[30px] text-[11px] font-medium w-full flex items-center justify-between gap-1",
          selected.length > 0 && "border-[#1B4F8A]"
        )}
        style={{ paddingRight: "8px" }}
      >
        <span className={cn("truncate", selected.length > 0 ? "text-gray-900" : "text-gray-500")}>{label}</span>
        <div className="flex items-center gap-1 shrink-0">
          {selected.length > 0 && (
            <button type="button" onClick={e => { e.stopPropagation(); onChange([]) }} className="text-gray-400 hover:text-gray-600">
              <X size={10} />
            </button>
          )}
          <ChevronDown size={11} className="text-gray-400" />
        </div>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden" style={{ minWidth: "200px" }}>
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher..."
                className="input w-full pl-7 h-7 text-[12px]"
                autoFocus
              />
            </div>
          </div>
          {selected.length > 0 && (
            <div className="px-3 py-1.5 border-b border-gray-100 flex flex-wrap gap-1">
              {selected.map(v => {
                const opt = options.find(o => o.value === v)
                if (!opt) return null
                return (
                  <span key={v} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-blue-50 text-blue-700 border border-blue-200">
                    {opt.label}
                    <button type="button" onClick={() => toggle(v)}><X size={10} /></button>
                  </span>
                )
              })}
            </div>
          )}
          <div className="overflow-y-auto max-h-48">
            {filtered.length === 0 ? (
              <p className="p-3 text-[12px] text-gray-400 text-center">Aucun résultat</p>
            ) : (
              filtered.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggle(opt.value)}
                  className={cn(
                    "w-full text-left px-3 py-2 text-[12px] hover:bg-gray-50 transition-colors flex items-center gap-2 border-b border-gray-50 last:border-0",
                    selected.includes(opt.value) && "bg-blue-50 text-blue-700"
                  )}
                >
                  <span className={cn("w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0",
                    selected.includes(opt.value) ? "bg-[#1B4F8A] border-[#1B4F8A]" : "border-gray-300")}>
                    {selected.includes(opt.value) && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  {opt.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function AnalysesPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [maladies, setMaladies] = useState<RefItem[]>([])
  const [wilayas, setWilayas] = useState<WilayaItem[]>([])
  const [communes, setCommunes] = useState<CommuneItem[]>([])
  const [filters, setFilters] = useState<Filters>({
    days: "90",
    dateDebut: "",
    dateFin: "",
    maladieIds: [],
    wilayadIds: [],
    communeId: "",
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filters.dateDebut || filters.dateFin) {
      if (filters.dateDebut) params.set("dateDebut", filters.dateDebut)
      if (filters.dateFin) params.set("dateFin", filters.dateFin)
    } else {
      params.set("days", filters.days)
    }
    if (filters.maladieIds.length > 0) params.set("maladieIds", filters.maladieIds.join(","))
    if (filters.wilayadIds.length > 0) params.set("wilayadIds", filters.wilayadIds.join(","))
    if (filters.communeId) params.set("communeId", filters.communeId)
    const res = await fetch(`/api/stats/analyses?${params}`)
    setData(await res.json())
    setLoading(false)
  }, [filters])

  useEffect(() => { void fetchData() }, [fetchData])

  useEffect(() => {
    fetch("/api/maladies").then(r => r.json()).then(d => setMaladies(d.maladies ?? d)).catch(console.error)
    fetch("/api/wilayas").then(r => r.json()).then((d: WilayaItem[]) => setWilayas(d)).catch(console.error)
    fetch("/api/communes").then(r => r.json()).then((d: CommuneItem[]) => setCommunes(d)).catch(console.error)
  }, [])

  const filteredCommunes = filters.wilayadIds.length > 0
    ? communes.filter(c => c.wilayadId && filters.wilayadIds.includes(c.wilayadId))
    : communes

  const setF = (patch: Partial<Filters>) => setFilters(f => ({ ...f, ...patch }))
  const inputCls = "input h-[30px] text-[11px] font-medium"

  return (
    <div>
      {/* Header + filters */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Analyses &amp; Statistiques</h1>
            <p className="text-sm text-gray-500 mt-1">Tableaux analytiques avancés</p>
          </div>
          {data && <AnalysesExportMenu data={data} days={parseInt(filters.days)} />}
        </div>

        {/* Filter bar — same style as dashboard */}
        <div className="flex gap-2 flex-wrap items-center">
          {/* Period quick-select */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            {([["30", "30j"], ["90", "90j"], ["180", "6m"], ["365", "1an"]] as [string, string][]).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setF({ days: val, dateDebut: "", dateFin: "" })}
                className={`px-3 h-[30px] text-[11px] font-semibold transition-all border-r border-gray-200 last:border-r-0 ${
                  filters.days === val && !filters.dateDebut && !filters.dateFin
                    ? "bg-[#1B4F8A] text-white"
                    : "bg-white text-gray-500 hover:bg-gray-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Custom date range */}
          <div className="flex items-center gap-1">
            <input
              type="date"
              value={filters.dateDebut}
              onChange={e => setF({ dateDebut: e.target.value })}
              className={cn(inputCls, "w-36", (filters.dateDebut || filters.dateFin) && "border-[#1B4F8A]")}
              title="Date début"
            />
            <span className="text-gray-400 text-xs">→</span>
            <input
              type="date"
              value={filters.dateFin}
              onChange={e => setF({ dateFin: e.target.value })}
              className={cn(inputCls, "w-36", (filters.dateDebut || filters.dateFin) && "border-[#1B4F8A]")}
              title="Date fin"
            />
            {(filters.dateDebut || filters.dateFin) && (
              <button
                type="button"
                onClick={() => setF({ dateDebut: "", dateFin: "" })}
                className="text-gray-400 hover:text-gray-600"
                title="Réinitialiser dates"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Wilayas multi-select */}
          <MultiSelect
            options={wilayas.map(w => ({ value: w.id, label: w.nom }))}
            selected={filters.wilayadIds}
            onChange={wilayadIds => setF({ wilayadIds, communeId: "" })}
            placeholder="Toutes wilayas"
          />

          {/* Communes (filtered by wilaya) */}
          <select
            value={filters.communeId}
            onChange={e => setF({ communeId: e.target.value })}
            className={cn(inputCls, "min-w-[140px]", filters.communeId && "border-[#1B4F8A]")}
            style={{ paddingRight: "28px", appearance: "auto" }}
          >
            <option value="">Toutes communes</option>
            {filteredCommunes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>

          {/* Maladies multi-select */}
          <MultiSelect
            options={maladies.map(m => ({ value: m.id, label: m.nom }))}
            selected={filters.maladieIds}
            onChange={maladieIds => setF({ maladieIds })}
            placeholder="Toutes maladies"
          />
        </div>
      </div>

      {/* Summary cards */}
      {data && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "TOTAL CAS", value: data.summary.total, color: "#1B4F8A" },
            { label: "CAS CONFIRMÉS", value: data.summary.confirmes, color: "#E74C3C" },
            { label: "TAUX CONFIRMATION", value: `${data.summary.tauxConfirmation}%`, color: "#F39C12" },
            { label: "MALADIES ACTIVES", value: data.summary.maladiesActives, color: "#27AE60" },
          ].map(card => (
            <div key={card.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">{card.label}</p>
              <p className="text-3xl font-bold" style={{ color: card.color }}>{card.value}</p>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64 text-sm text-gray-400">Chargement des analyses...</div>
      ) : data && (
        <div className="space-y-4">
          {/* Prevalence + Weekly trend */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">Prévalence par Maladie</p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.prevalence} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EBEDEF" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#8A909B" }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#4A5164" }} tickLine={false} axisLine={false} width={130} />
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #EBEDEF", fontSize: "12px" }} formatter={(v) => [v, "Cas"]} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {data.prevalence.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">Tendance Hebdomadaire</p>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={data.weeklyTrend} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EBEDEF" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#8A909B" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11, fill: "#8A909B" }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #EBEDEF", fontSize: "12px" }} formatter={(v) => [v, "Cas"]} />
                  <Line type="monotone" dataKey="count" stroke="#1B4F8A" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Age + Sex + Status */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">Répartition par Âge</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.ageDistribution} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EBEDEF" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#8A909B" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#8A909B" }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #EBEDEF", fontSize: "12px" }} formatter={(v) => [v, "Cas"]} />
                  <Bar dataKey="count" fill="#1B4F8A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">Répartition par Sexe</p>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={data.sexDistribution}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    label={({ name, percent }: { name?: string; percent?: number }) =>
                      `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {data.sexDistribution.map((_, i) => <Cell key={i} fill={i === 0 ? "#1B4F8A" : "#E74C3C"} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #EBEDEF", fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">Répartition par Statut</p>
              <div className="space-y-2 mt-2">
                {data.statutDistribution.map((s, i) => {
                  const total = data.statutDistribution.reduce((a, b) => a + b.count, 0)
                  const pct = total > 0 ? Math.round((s.count / total) * 100) : 0
                  return (
                    <div key={s.name}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-600">{STATUT_LABELS[s.name] ?? s.name}</span>
                        <span className="font-medium text-gray-800">{s.count} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
