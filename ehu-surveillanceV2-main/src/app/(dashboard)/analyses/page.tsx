"use client"

import { useState, useEffect, useCallback } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, LineChart, Line } from "recharts"
import AnalysesExportMenu from "@/components/analyses/analyses-export-menu"

const COLORS = ["#1B4F8A", "#3A7BD5", "#E74C3C", "#F39C12", "#27AE60", "#7C3AED", "#5499E8", "#8AB8F5"]

interface AnalyticsData {
  prevalence: { name: string; count: number }[]
  statutDistribution: { name: string; count: number }[]
  ageDistribution: { name: string; count: number }[]
  sexDistribution: { name: string; count: number }[]
  weeklyTrend: { date: string; count: number }[]
  summary: { total: number; confirmes: number; tauxConfirmation: number; maladiesActives: number }
}

const STATUT_LABELS: Record<string, string> = {
  nouveau: "Nouveau", en_cours: "En cours", confirme: "Confirmé", infirme: "Infirmé", cloture: "Clôturé"
}

export default function AnalysesPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState("90")
  const [maladies, setMaladies] = useState<{ id: string; nom: string }[]>([])
  const [maladieId, setMaladieId] = useState("")

  const fetchData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ days, maladieId })
    const res = await fetch(`/api/stats/analyses?${params}`)
    setData(await res.json())
    setLoading(false)
  }, [days, maladieId])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void fetchData() }, [fetchData])
  useEffect(() => { fetch("/api/maladies").then(r => r.json()).then(d => setMaladies(d.maladies ?? d)).catch(console.error) }, [])

  const select = "h-8 px-3 rounded-lg border border-gray-200 text-xs outline-none focus:border-[#1B4F8A] bg-white"

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Analyses &amp; Statistiques</h1>
          <p className="text-sm text-gray-500 mt-1">Tableaux analytiques avancés</p>
        </div>
        <div className="flex gap-3">
          <select value={days} onChange={e => setDays(e.target.value)} className={select}>
            <option value="30">30 jours</option>
            <option value="90">90 jours</option>
            <option value="180">6 mois</option>
            <option value="365">12 mois</option>
          </select>
          <select value={maladieId} onChange={e => setMaladieId(e.target.value)} className={select}>
            <option value="">Toutes les maladies</option>
            {maladies.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
          </select>
          {data && <AnalysesExportMenu data={data} days={parseInt(days)} />}
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
                  <Pie data={data.sexDistribution} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
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
