"use client"

import { useState, useEffect, useCallback } from "react"
import {
  ShieldCheck, AlertTriangle, Activity, TrendingUp, Biohazard,
  RefreshCw, Filter, X, ChevronDown, ChevronUp, Search,
} from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LabelList,
} from "recharts"
import { SERVICES_EHU, SERVICES_PAR_SECTEUR } from "@/constants/services"

// ─── Types ────────────────────────────────────────────────────────────────────

interface GermeRef { id: string; nom: string }

interface Stats {
  totaux: { total: number; enCours: number; bmr: number; derniers30j: number; tauxBMR: number }
  parType: { type: string; count: number }[]
  bmrSubtypes: { nom: string; count: number }[]
  parService: { service: string; count: number }[]
  parGerme: { germeId: string; nom: string; count: number }[]
  germeRefs: GermeRef[]
  tendance: { semaine: string; total: number; pavm: number; iso: number; bmr: number }[]
}

// ─── Palettes ─────────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<string, string> = {
  PAVM: "#1B4F8A",
  ISO:  "#0F766E",
  BMR:  "#DC2626",
}
const COLORS      = ["#DC2626","#B91C1C","#EF4444","#F87171","#FCA5A5","#7C3AED","#2563EB","#0891B2","#059669","#D97706","#EA580C","#6B7280"]
const GERME_COLORS = ["#7C3AED","#5B21B6","#9333EA","#6D28D9","#4C1D95","#2563EB","#1D4ED8","#0891B2","#0F766E","#059669","#16A34A","#65A30D","#D97706","#B45309","#DC2626"]

// ─── Service MultiFilter ───────────────────────────────────────────────────────

function ServiceFilter({
  selected,
  onChange,
}: {
  selected: string[]
  onChange: (s: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery]  = useState("")

  const allServices = SERVICES_EHU.map(s => s.nom)
  const grouped = Object.entries(SERVICES_PAR_SECTEUR)

  const toggle = (nom: string) =>
    onChange(selected.includes(nom) ? selected.filter(s => s !== nom) : [...selected, nom])

  const filtered = (items: typeof SERVICES_EHU) =>
    query ? items.filter(s => s.nom.toLowerCase().includes(query.toLowerCase())) : items

  return (
    <div className="relative">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors hover:bg-gray-50"
          style={{ borderColor: "#E5E7EB", color: "#374151" }}
        >
          <Filter size={12} style={{ color: "#1B4F8A" }} />
          {selected.length === 0
            ? "Tous les services"
            : `${selected.length} service${selected.length > 1 ? "s" : ""} sélectionné${selected.length > 1 ? "s" : ""}`}
          {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
        {selected.slice(0, 3).map(nom => (
          <span key={nom} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
            style={{ backgroundColor: "#EFF6FF", color: "#1B4F8A", border: "1px solid #BFDBFE" }}>
            {nom.length > 20 ? nom.slice(0, 18) + "…" : nom}
            <button onClick={() => toggle(nom)} className="hover:opacity-60"><X size={10} /></button>
          </span>
        ))}
        {selected.length > 3 && (
          <span className="text-xs text-gray-400">+{selected.length - 3}</span>
        )}
        {selected.length > 0 && (
          <button onClick={() => onChange([])} className="text-xs text-gray-400 hover:text-gray-600">Effacer</button>
        )}
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-30 bg-white border rounded-xl shadow-xl overflow-hidden"
            style={{ borderColor: "#E5E7EB", minWidth: 300, maxHeight: 380 }}>
            <div className="p-2 border-b" style={{ borderColor: "#F3F4F6" }}>
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input autoFocus value={query} onChange={e => setQuery(e.target.value)}
                  placeholder="Rechercher un service…"
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border outline-none" style={{ borderColor: "#E5E7EB" }} />
              </div>
            </div>
            <div className="flex items-center justify-between px-3 py-1.5 border-b"
              style={{ borderColor: "#F3F4F6", backgroundColor: "#FAFAFA" }}>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                {selected.length}/{allServices.length} sélectionnés
              </span>
              <button onClick={() => onChange(allServices)} className="text-xs font-medium hover:underline" style={{ color: "#1B4F8A" }}>
                Tout sélectionner
              </button>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: 270 }}>
              {grouped.map(([secteur, items]) => {
                const f = filtered(items)
                if (f.length === 0) return null
                return (
                  <div key={secteur}>
                    <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider bg-gray-50 border-b"
                      style={{ color: "#9CA3AF", borderColor: "#F3F4F6" }}>{secteur}</div>
                    {f.map(s => (
                      <label key={s.code} className="flex items-center gap-2.5 px-3 py-1.5 cursor-pointer hover:bg-gray-50">
                        <input type="checkbox" checked={selected.includes(s.nom)} onChange={() => toggle(s.nom)}
                          className="rounded w-3.5 h-3.5 shrink-0" style={{ accentColor: "#1B4F8A" }} />
                        <span className="text-sm" style={{ color: "#111827" }}>{s.nom}</span>
                      </label>
                    ))}
                  </div>
                )
              })}
            </div>
            <div className="p-2 border-t" style={{ borderColor: "#F3F4F6" }}>
              <button onClick={() => { setOpen(false); setQuery("") }}
                className="w-full py-1.5 text-xs font-medium rounded-lg text-white" style={{ backgroundColor: "#1B4F8A" }}>
                Appliquer
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Germe MultiFilter ────────────────────────────────────────────────────────

function GermeFilter({
  germes,
  selected,
  onChange,
}: {
  germes: GermeRef[]
  selected: string[]
  onChange: (ids: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  const filtered = query
    ? germes.filter(g => g.nom.toLowerCase().includes(query.toLowerCase()))
    : germes

  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id])

  const selectedGermes = germes.filter(g => selected.includes(g.id))

  return (
    <div className="relative">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors hover:bg-gray-50"
          style={{ borderColor: "#E5E7EB", color: "#374151" }}
        >
          <Biohazard size={12} style={{ color: "#7C3AED" }} />
          {selected.length === 0
            ? "Tous les germes"
            : `${selected.length} germe${selected.length > 1 ? "s" : ""} sélectionné${selected.length > 1 ? "s" : ""}`}
          {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
        {selectedGermes.slice(0, 3).map(g => (
          <span key={g.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
            style={{ backgroundColor: "#EDE9FE", color: "#5B21B6", border: "1px solid #DDD6FE" }}>
            {g.nom.length > 22 ? g.nom.slice(0, 20) + "…" : g.nom}
            <button onClick={() => toggle(g.id)} className="hover:opacity-60"><X size={10} /></button>
          </span>
        ))}
        {selected.length > 3 && <span className="text-xs text-gray-400">+{selected.length - 3}</span>}
        {selected.length > 0 && (
          <button onClick={() => onChange([])} className="text-xs text-gray-400 hover:text-gray-600">Effacer</button>
        )}
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-30 bg-white border rounded-xl shadow-xl overflow-hidden"
            style={{ borderColor: "#E5E7EB", minWidth: 300, maxHeight: 380 }}>
            <div className="p-2 border-b" style={{ borderColor: "#F3F4F6" }}>
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input autoFocus value={query} onChange={e => setQuery(e.target.value)}
                  placeholder="Rechercher un germe…"
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border outline-none" style={{ borderColor: "#E5E7EB" }} />
              </div>
            </div>
            <div className="flex items-center justify-between px-3 py-1.5 border-b"
              style={{ borderColor: "#F3F4F6", backgroundColor: "#FAFAFA" }}>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                {selected.length}/{germes.length} sélectionnés
              </span>
              <button onClick={() => onChange(germes.map(g => g.id))}
                className="text-xs font-medium hover:underline" style={{ color: "#7C3AED" }}>
                Tout sélectionner
              </button>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: 260 }}>
              {filtered.length === 0 ? (
                <p className="text-xs text-center text-gray-400 py-6">Aucun résultat</p>
              ) : filtered.map(g => (
                <label key={g.id} className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-gray-50">
                  <input type="checkbox" checked={selected.includes(g.id)} onChange={() => toggle(g.id)}
                    className="rounded w-3.5 h-3.5 shrink-0" style={{ accentColor: "#7C3AED" }} />
                  <span className="text-sm" style={{ color: "#111827" }}>{g.nom}</span>
                </label>
              ))}
            </div>
            <div className="p-2 border-t" style={{ borderColor: "#F3F4F6" }}>
              <button onClick={() => { setOpen(false); setQuery("") }}
                className="w-full py-1.5 text-xs font-medium rounded-lg text-white" style={{ backgroundColor: "#7C3AED" }}>
                Appliquer
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function KpiCard({ icon, bg, label, value, sub }: { icon: React.ReactNode; bg: string; label: string; value: number | string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border p-4" style={{ borderColor: "#E5E7EB" }}>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: bg }}>{icon}</div>
        <span className="text-xs font-medium" style={{ color: "#6B7280" }}>{label}</span>
      </div>
      <p className="text-2xl font-bold" style={{ color: "#111827" }}>{typeof value === "number" ? value.toLocaleString("fr-FR") : value}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>{sub}</p>}
    </div>
  )
}

function EmptyChart({ msg = "Aucune donnée disponible" }: { msg?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-40 gap-2" style={{ color: "#D1D5DB" }}>
      <Biohazard size={24} className="opacity-40" />
      <p className="text-xs">{msg}</p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UhhDashboardPage() {
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [selectedGermes,   setSelectedGermes]   = useState<string[]>([])
  const [stats, setStats]         = useState<Stats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  function buildParams() {
    const p = new URLSearchParams()
    if (selectedServices.length > 0) p.set("services",  selectedServices.join(","))
    if (selectedGermes.length   > 0) p.set("germeIds",  selectedGermes.join(","))
    return p
  }

  const loadStats = useCallback(async () => {
    setStatsLoading(true)
    const res = await fetch(`/api/uhh/stats?${buildParams()}`)
    if (res.ok) setStats(await res.json())
    setStatsLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedServices, selectedGermes])

  useEffect(() => { loadStats() }, [loadStats])

  const t = stats?.totaux
  const hasFilter = selectedServices.length > 0 || selectedGermes.length > 0
  const germeRefs = stats?.germeRefs ?? []

  // Pie data for PAVM / ISO / BMR
  const pieData = (stats?.parType ?? []).map(r => ({
    name: r.type,
    value: r.count,
  }))

  return (
    <div className="space-y-5">
      {/* ─── En-tête ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#CCFBF1" }}>
              <ShieldCheck size={16} style={{ color: "#0F766E" }} />
            </div>
            <h1 className="text-xl font-semibold" style={{ color: "#111827" }}>Tableau de bord — UHH</h1>
          </div>
          <p className="text-sm" style={{ color: "#6B7280" }}>
            Unité d&apos;Hygiène Hospitalière · Surveillance des Infections Associées aux Soins (PAVM · ISO · BMR)
          </p>
        </div>
        <button onClick={loadStats}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition-colors hover:bg-gray-50"
          style={{ color: "#374151", borderColor: "#E5E7EB" }}>
          <RefreshCw size={14} />
          Actualiser
        </button>
      </div>

      {/* ─── FILTRES ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border p-4 space-y-3" style={{ borderColor: "#E5E7EB" }}>
        <div className="flex items-center gap-2">
          <Filter size={14} style={{ color: "#6B7280" }} />
          <span className="text-sm font-semibold" style={{ color: "#374151" }}>Filtres</span>
          {hasFilter && (
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: "#FEF3C7", color: "#B45309" }}>
              Actifs
            </span>
          )}
          {hasFilter && (
            <button onClick={() => { setSelectedServices([]); setSelectedGermes([]) }}
              className="ml-auto text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1">
              <X size={11} /> Réinitialiser tout
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Filtre services */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: "#9CA3AF" }}>
              Services hospitaliers
            </p>
            <ServiceFilter selected={selectedServices} onChange={setSelectedServices} />
          </div>

          <div className="w-px hidden lg:block self-stretch" style={{ backgroundColor: "#F3F4F6" }} />

          {/* Filtre germes */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: "#9CA3AF" }}>
              Germes ({germeRefs.length} référencés)
            </p>
            <GermeFilter germes={germeRefs} selected={selectedGermes} onChange={setSelectedGermes} />
          </div>
        </div>
      </div>

      {/* ─── KPI Cards ────────────────────────────────────────────────────────── */}
      {statsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border p-4 h-24 animate-pulse" style={{ borderColor: "#E5E7EB" }}>
              <div className="h-2 bg-gray-100 rounded w-3/4 mb-3" />
              <div className="h-6 bg-gray-100 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard icon={<Activity    size={20} style={{ color: "#1B4F8A" }} />} bg="#EFF6FF" label="Total cas UHH" value={t?.total ?? 0} />
          <KpiCard icon={<ShieldCheck size={20} style={{ color: "#0F766E" }} />} bg="#CCFBF1" label="PAVM" value={stats?.parType.find(p => p.type === "PAVM")?.count ?? 0} sub="Pneumopathies sous VM" />
          <KpiCard icon={<AlertTriangle size={20} style={{ color: "#B45309" }} />} bg="#FEF3C7" label="ISO" value={stats?.parType.find(p => p.type === "ISO")?.count ?? 0} sub="Infections site opératoire" />
          <KpiCard icon={<Biohazard   size={20} style={{ color: "#DC2626" }} />} bg="#FEE2E2" label="BMR" value={t?.bmr ?? 0} sub={`${t?.tauxBMR ?? 0}% du total`} />
        </div>
      )}

      {/* ─── Graphiques ───────────────────────────────────────────────────────── */}
      {statsLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border p-5 h-60 animate-pulse" style={{ borderColor: "#E5E7EB" }}>
              <div className="h-2 bg-gray-100 rounded w-1/3 mb-4" />
              <div className="h-40 bg-gray-50 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Répartition PAVM / ISO / BMR */}
            <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#E5E7EB" }}>
              <h2 className="text-sm font-semibold mb-4" style={{ color: "#374151" }}>Répartition PAVM / ISO / BMR</h2>
              {pieData.length ? (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} innerRadius={40} dataKey="value" paddingAngle={3}
                      label={({ name, percent, value }: { name?: string; percent?: number; value?: number }) =>
                        `${name ?? ""} ${value ?? 0} (${((percent ?? 0) * 100).toFixed(0)}%)`
                      }
                      labelLine={false}
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={TYPE_COLORS[entry.name] ?? "#6B7280"} />
                      ))}
                    </Pie>
                    <Legend formatter={(value: string) => (
                      <span style={{ fontSize: 12, color: "#374151" }}>{value}</span>
                    )} />
                    <Tooltip formatter={(v: unknown) => [`${v} cas`]} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <EmptyChart msg="Aucun cas UHH déclaré" />}
            </div>

            {/* Cas UHH par service */}
            <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#E5E7EB" }}>
              <h2 className="text-sm font-semibold mb-4" style={{ color: "#374151" }}>Cas UHH par service</h2>
              {stats?.parService?.length ? (
                <ResponsiveContainer width="100%" height={Math.max(180, (stats.parService.length) * 30)}>
                  <BarChart data={stats.parService} layout="vertical" margin={{ left: 8, right: 90 }}>
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="service" type="category" width={130} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: unknown) => [`${v} cas`, "Cas UHH"]} />
                    <Bar dataKey="count" fill="#1B4F8A" radius={[0, 4, 4, 0]} name="Cas UHH">
                      <LabelList dataKey="count" position="right" formatter={(v: unknown) => {
                        const svcTotal = (stats?.parService ?? []).reduce((s, t) => s + t.count, 0)
                        const pct = svcTotal > 0 ? Math.round(Number(v) / svcTotal * 100) : 0
                        return `${v} (${pct}%)`
                      }} style={{ fontSize: 10, fill: "#6B7280" }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyChart />}
            </div>
          </div>

          {/* Types de BMR */}
          {(stats?.bmrSubtypes?.length ?? 0) > 0 && (
            <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#E5E7EB" }}>
              <h2 className="text-sm font-semibold mb-4" style={{ color: "#374151" }}>
                <span className="inline-flex items-center gap-1.5">
                  <Biohazard size={14} style={{ color: "#DC2626" }} /> Types de BMR déclarés
                </span>
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={Math.max(160, (stats!.bmrSubtypes.length) * 30)}>
                  <BarChart data={stats!.bmrSubtypes} layout="vertical" margin={{ left: 8, right: 90 }}>
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="nom" type="category" width={150} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: unknown) => [`${v} cas`, "BMR"]} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} name="BMR">
                      {stats!.bmrSubtypes.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                      <LabelList dataKey="count" position="right" formatter={(v: unknown) => {
                        const bmrTotal = stats!.bmrSubtypes.reduce((s, b) => s + b.count, 0)
                        const pct = bmrTotal > 0 ? Math.round(Number(v) / bmrTotal * 100) : 0
                        return `${v} (${pct}%)`
                      }} style={{ fontSize: 10, fill: "#6B7280" }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                <div className="overflow-auto" style={{ maxHeight: 280 }}>
                  <table className="w-full text-xs">
                    <thead className="sticky top-0" style={{ backgroundColor: "#F9FAFB" }}>
                      <tr>
                        <th className="text-left px-3 py-2 font-semibold" style={{ color: "#6B7280" }}>Type BMR</th>
                        <th className="text-right px-3 py-2 font-semibold" style={{ color: "#DC2626" }}>Cas</th>
                        <th className="px-3 py-2" style={{ minWidth: 80 }} />
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: "#F3F4F6" }}>
                      {(() => {
                        const bmrTotal = stats!.bmrSubtypes.reduce((s, b) => s + b.count, 0)
                        return stats!.bmrSubtypes.map((b, i) => {
                          const pct = bmrTotal > 0 ? Math.round(b.count / bmrTotal * 100) : 0
                          return (
                            <tr key={b.nom} className="hover:bg-gray-50">
                              <td className="px-3 py-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                  <span className="font-medium" style={{ color: "#111827" }}>{b.nom}</span>
                                </div>
                              </td>
                              <td className="px-3 py-2 text-right font-bold whitespace-nowrap" style={{ color: "#DC2626" }}>
                                {b.count} <span className="font-normal text-gray-400">({pct}%)</span>
                              </td>
                              <td className="px-3 py-2">
                                <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#FEE2E2" }}>
                                  <div className="h-full rounded-full" style={{ width: `${(b.count / (stats!.bmrSubtypes[0]?.count || 1)) * 100}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                                </div>
                              </td>
                            </tr>
                          )
                        })
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Répartition par germe */}
          {(stats?.parGerme?.length ?? 0) > 0 && (
            <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#E5E7EB" }}>
              <h2 className="text-sm font-semibold mb-4" style={{ color: "#374151" }}>
                <span className="inline-flex items-center gap-1.5">
                  <Biohazard size={14} style={{ color: "#7C3AED" }} /> Répartition par germe
                </span>
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={Math.max(160, stats!.parGerme.length * 28)}>
                  <BarChart data={stats!.parGerme} layout="vertical" margin={{ left: 8, right: 90 }}>
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="nom" type="category" width={180} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v: unknown) => [`${v} cas`, "Résultats labo"]} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} name="Résultats labo">
                      {stats!.parGerme.map((_, i) => (
                        <Cell key={i} fill={GERME_COLORS[i % GERME_COLORS.length]} />
                      ))}
                      <LabelList dataKey="count" position="right" formatter={(v: unknown) => {
                        const tot = stats!.parGerme.reduce((s, g) => s + g.count, 0)
                        const pct = tot > 0 ? Math.round(Number(v) / tot * 100) : 0
                        return `${v} (${pct}%)`
                      }} style={{ fontSize: 10, fill: "#6B7280" }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                <div className="overflow-auto" style={{ maxHeight: 300 }}>
                  <table className="w-full text-xs">
                    <thead className="sticky top-0" style={{ backgroundColor: "#F9FAFB" }}>
                      <tr>
                        <th className="text-left px-3 py-2 font-semibold" style={{ color: "#6B7280" }}>Germe</th>
                        <th className="text-right px-3 py-2 font-semibold" style={{ color: "#7C3AED" }}>Résultats</th>
                        <th className="px-3 py-2" style={{ minWidth: 80 }} />
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: "#F3F4F6" }}>
                      {(() => {
                        const germeTotal = stats!.parGerme.reduce((s, g) => s + g.count, 0)
                        return stats!.parGerme.map((g, i) => {
                          const pct = germeTotal > 0 ? Math.round(g.count / germeTotal * 100) : 0
                          return (
                            <tr key={g.germeId} className="hover:bg-gray-50">
                              <td className="px-3 py-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: GERME_COLORS[i % GERME_COLORS.length] }} />
                                  <span className="font-medium leading-tight" style={{ color: "#111827" }}>{g.nom}</span>
                                </div>
                              </td>
                              <td className="px-3 py-2 text-right font-bold whitespace-nowrap" style={{ color: "#7C3AED" }}>
                                {g.count} <span className="font-normal text-gray-400">({pct}%)</span>
                              </td>
                              <td className="px-3 py-2">
                                <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#EDE9FE" }}>
                                  <div className="h-full rounded-full" style={{ width: `${(g.count / (stats!.parGerme[0]?.count || 1)) * 100}%`, backgroundColor: GERME_COLORS[i % GERME_COLORS.length] }} />
                                </div>
                              </td>
                            </tr>
                          )
                        })
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Tendance hebdomadaire */}
          <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#E5E7EB" }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: "#374151" }}>
              Tendance hebdomadaire — 90 derniers jours
            </h2>
            {stats?.tendance?.length ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats.tendance}>
                  <XAxis dataKey="semaine" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="pavm" stackId="a" fill="#1B4F8A" name="PAVM" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="iso"  stackId="a" fill="#0F766E" name="ISO"  radius={[0, 0, 0, 0]} />
                  <Bar dataKey="bmr"  stackId="a" fill="#DC2626" name="BMR"  radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </div>

          {/* 30 derniers jours — progress bars par type */}
          {(t?.derniers30j ?? 0) > 0 && (
            <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#E5E7EB" }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold" style={{ color: "#374151" }}>
                  <TrendingUp size={14} className="inline mr-1.5" style={{ color: "#0F766E" }} />
                  30 derniers jours — répartition
                </h2>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: "#CCFBF1", color: "#0F766E" }}>
                  {t?.derniers30j} cas
                </span>
              </div>
              <div className="space-y-3">
                {(stats?.parType ?? []).map(({ type, count }) => {
                  const total = stats?.totaux.total ?? 1
                  const pct = total > 0 ? Math.round(count / total * 100) : 0
                  const color = TYPE_COLORS[type] ?? "#6B7280"
                  return (
                    <div key={type}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium" style={{ color: "#374151" }}>{type}</span>
                        <span style={{ color }}>{count} ({pct}%)</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "#F3F4F6" }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
