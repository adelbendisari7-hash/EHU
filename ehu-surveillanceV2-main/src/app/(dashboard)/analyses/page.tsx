"use client"

import { useState, useEffect, useCallback } from "react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, LineChart, Line, LabelList,
} from "recharts"
import AnalysesExportMenu from "@/components/analyses/analyses-export-menu"
import DashboardFilters, { type DashboardFiltersState } from "@/components/dashboard/dashboard-filters"

const COLORS = ["#1B4F8A", "#3A7BD5", "#E74C3C", "#F39C12", "#27AE60", "#7C3AED", "#5499E8", "#8AB8F5"]

const STATUT_LABELS: Record<string, string> = {
  brouillon: "Brouillon",
  suspect: "Suspect",
  confirme: "Confirmé",
}

interface AnalyticsData {
  prevalence: { name: string; count: number }[]
  statutDistribution: { name: string; count: number }[]
  ageDistribution: { name: string; count: number }[]
  sexDistribution: { name: string; count: number }[]
  weeklyTrend: { date: string; count: number }[]
  communeDistribution: { name: string; count: number }[]
  summary: {
    total: number
    confirmes: number
    tauxConfirmation: number
    maladiesDeclarees: number
    totalMaladies: number
    communesTouchees: number
  }
}

interface RefItem { id: string; nom: string }
interface WilayaItem extends RefItem { code: string }
interface CommuneItem extends RefItem { wilayadId: string }

export default function AnalysesPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [maladies, setMaladies] = useState<RefItem[]>([])
  const [wilayas, setWilayas] = useState<WilayaItem[]>([])
  const [communes, setCommunes] = useState<CommuneItem[]>([])
  const [filters, setFilters] = useState<DashboardFiltersState>({
    days: "90",
    dateDebut: "",
    dateFin: "",
    maladieIds: [],
    wilayadIds: [],
    communeIds: [],
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
    if (filters.communeIds.length > 0) params.set("communeIds", filters.communeIds.join(","))
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

        {/* Shared filter bar — same as dashboard */}
        <DashboardFilters
          maladies={maladies}
          communes={communes as { id: string; nom: string; wilayadId?: string }[]}
          wilayas={wilayas}
          filters={filters}
          onChange={setFilters}
        />
      </div>

      {/* Summary cards */}
      {data && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "TOTAL CAS", value: data.summary.total, color: "#1B4F8A" },
            { label: "COMMUNES TOUCHÉES", value: data.summary.communesTouchees, color: "#0891B2" },
            { label: "TAUX CONFIRMATION", value: `${data.summary.tauxConfirmation}%`, color: "#F39C12" },
            {
              label: "PROFIL MDO",
              value: `${data.summary.maladiesDeclarees}/${data.summary.totalMaladies}`,
              color: "#27AE60",
            },
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
              <p className="text-sm font-semibold text-gray-700 mb-3">Effectif par Maladie</p>
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

          {/* Commune distribution */}
          {data.communeDistribution && data.communeDistribution.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">
                Répartition par Commune
                <span className="ml-2 text-[11px] font-normal text-gray-400">(top {data.communeDistribution.length})</span>
              </p>
              <ResponsiveContainer width="100%" height={Math.max(180, data.communeDistribution.length * 28)}>
                <BarChart data={data.communeDistribution} layout="vertical" margin={{ left: 10, right: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EBEDEF" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#8A909B" }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#4A5164" }} tickLine={false} axisLine={false} width={120} />
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #EBEDEF", fontSize: "12px" }} formatter={(v) => [v, "Cas"]} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={16}>
                    {data.communeDistribution.map((entry, i) => {
                      const max = data.communeDistribution[0]?.count ?? 1
                      const ratio = entry.count / max
                      const color = ratio > 0.7 ? "#E74C3C" : ratio > 0.4 ? "#F39C12" : "#1B4F8A"
                      return <Cell key={i} fill={color} />
                    })}
                    <LabelList dataKey="count" position="right" style={{ fontSize: 11, fill: "#6B7280", fontWeight: 600 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

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
