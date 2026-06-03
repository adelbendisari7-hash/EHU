"use client"

import { useState, useEffect } from "react"
import { ShieldCheck, AlertTriangle, Activity, TrendingUp, Biohazard, RefreshCw } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts"

interface Stats {
  totaux: {
    total: number
    enCours: number
    bmr: number
    derniers30j: number
    tauxBMR: number
  }
  parType: { type: string; count: number }[]
  parService: { serviceId: string; nom: string; count: number }[]
  bmrParService: { serviceId: string; nom: string; count: number }[]
  tendance: { semaine: string; total: number; bmr: number }[]
}

const TYPE_LABELS: Record<string, string> = {
  PAVM: "PAVM",
  ISO: "ISO",
  Autre: "Autre",
}

const COLORS = ["#1B4F8A", "#0F766E", "#B45309", "#7C3AED", "#DC2626"]

export default function UhhDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const res = await fetch("/api/uhh/stats")
    if (res.ok) setStats(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const t = stats?.totaux

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#CCFBF1" }}>
              <ShieldCheck size={16} style={{ color: "#0F766E" }} />
            </div>
            <h1 className="text-xl font-semibold" style={{ color: "#111827" }}>Tableau de bord — UHH</h1>
          </div>
          <p className="text-sm" style={{ color: "#6B7280" }}>
            Unité d&apos;Hygiène Hospitalière · Surveillance des Infections Associées aux Soins
          </p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition-colors hover:bg-gray-50" style={{ color: "#374151", borderColor: "#E5E7EB" }}>
          <RefreshCw size={14} />
          Actualiser
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={<Activity size={20} style={{ color: "#1B4F8A" }} />} bg="#EFF6FF" label="Total IAS déclarées" value={t?.total ?? 0} />
        <KpiCard icon={<AlertTriangle size={20} style={{ color: "#B45309" }} />} bg="#FEF3C7" label="En cours" value={t?.enCours ?? 0} />
        <KpiCard icon={<Biohazard size={20} style={{ color: "#DC2626" }} />} bg="#FEE2E2" label="BMR détectées" value={t?.bmr ?? 0} sub={`${t?.tauxBMR ?? 0}% du total`} />
        <KpiCard icon={<TrendingUp size={20} style={{ color: "#0F766E" }} />} bg="#CCFBF1" label="30 derniers jours" value={t?.derniers30j ?? 0} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Répartition par type */}
        <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#E5E7EB" }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: "#374151" }}>Répartition par type d&apos;IAS</h2>
          {stats?.parType && stats.parType.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={stats.parType.map(t => ({ name: TYPE_LABELS[t.type] ?? t.type, value: t.count }))}
                  cx="50%" cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {stats.parType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </div>

        {/* IAS par service */}
        <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#E5E7EB" }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: "#374151" }}>IAS par service hospitalier</h2>
          {stats?.parService && stats.parService.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.parService} layout="vertical" margin={{ left: 8 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="nom" type="category" width={110} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#1B4F8A" radius={[0, 4, 4, 0]} name="IAS" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </div>
      </div>

      {/* Tendance hebdomadaire */}
      <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#E5E7EB" }}>
        <h2 className="text-sm font-semibold mb-4" style={{ color: "#374151" }}>Tendance hebdomadaire (90 derniers jours)</h2>
        {stats?.tendance && stats.tendance.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.tendance}>
              <XAxis dataKey="semaine" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" fill="#1B4F8A" name="Total IAS" radius={[3, 3, 0, 0]} />
              <Bar dataKey="bmr" fill="#DC2626" name="dont BMR" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart />
        )}
      </div>

      {/* BMR par service */}
      {stats?.bmrParService && stats.bmrParService.length > 0 && (
        <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#E5E7EB" }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: "#374151" }}>
            <span className="inline-flex items-center gap-1.5">
              <Biohazard size={14} style={{ color: "#DC2626" }} />
              BMR par service
            </span>
          </h2>
          <div className="space-y-2">
            {stats.bmrParService.map((s, i) => (
              <div key={s.serviceId} className="flex items-center gap-3">
                <span className="text-xs font-medium w-4 text-center" style={{ color: "#9CA3AF" }}>{i + 1}</span>
                <span className="text-sm flex-1" style={{ color: "#374151" }}>{s.nom}</span>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: "#FEE2E2", maxWidth: 200 }}>
                  <div
                    className="h-2 rounded-full"
                    style={{ width: `${(s.count / (stats.bmrParService[0]?.count || 1)) * 100}%`, backgroundColor: "#DC2626" }}
                  />
                </div>
                <span className="text-sm font-semibold w-8 text-right" style={{ color: "#DC2626" }}>{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function KpiCard({ icon, bg, label, value, sub }: { icon: React.ReactNode; bg: string; label: string; value: number; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border p-4" style={{ borderColor: "#E5E7EB" }}>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: bg }}>
          {icon}
        </div>
        <span className="text-xs font-medium" style={{ color: "#6B7280" }}>{label}</span>
      </div>
      <p className="text-2xl font-bold" style={{ color: "#111827" }}>{value.toLocaleString("fr-FR")}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>{sub}</p>}
    </div>
  )
}

function EmptyChart() {
  return (
    <div className="flex items-center justify-center h-[180px]" style={{ color: "#D1D5DB" }}>
      <p className="text-sm">Aucune donnée disponible</p>
    </div>
  )
}
