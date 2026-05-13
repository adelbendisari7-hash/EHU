"use client"

import Link from "next/link"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { FileText, TrendingUp, Calendar, Activity } from "lucide-react"

const STATUT_COLORS: Record<string, string> = {
  nouveau: "#6B7280",
  en_cours: "#3B82F6",
  confirme: "#059669",
  infirme: "#DC2626",
  cloture: "#64748B",
  brouillon: "#D97706",
}

const STATUT_LABELS: Record<string, string> = {
  nouveau: "Nouveau",
  en_cours: "En cours",
  confirme: "Confirmé",
  infirme: "Infirmé",
  cloture: "Clôturé",
  brouillon: "Brouillon",
}

const PIE_COLORS = ["#1B4F8A", "#3B82F6", "#059669", "#D97706", "#DC2626", "#7C3AED", "#0891B2", "#65A30D"]

interface Stats {
  totalCas: number
  casMois: number
  casAnnee: number
  cfr: string
  casByStatut: { statut: string; count: number }[]
  casByMaladie: { maladie: string; count: number }[]
  monthlyTrend: { label: string; count: number }[]
  recentCas: { id: string; codeCas: string; statut: string; maladie: string; patient: string; createdAt: string }[]
}

export default function MesStatsClient({ stats }: { stats: Stats }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">Mes Statistiques</h1>
        <p className="text-sm text-gray-500 mt-0.5">Vue d&apos;ensemble de votre activité déclarative</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: FileText, label: "Total cas déclarés", value: stats.totalCas, color: "#1B4F8A" },
          { icon: Calendar, label: "Ce mois", value: stats.casMois, color: "#059669" },
          { icon: TrendingUp, label: "Cette année", value: stats.casAnnee, color: "#D97706" },
          { icon: Activity, label: "CFR (%)", value: `${stats.cfr}%`, color: "#DC2626" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
                <Icon size={15} style={{ color }} />
              </div>
              <p className="text-xs text-gray-500 leading-tight">{label}</p>
            </div>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly trend */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-sm font-semibold text-gray-700 mb-4">Tendance mensuelle (6 mois)</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={stats.monthlyTrend}>
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E5E7EB" }} />
              <Bar dataKey="count" fill="#1B4F8A" radius={[4, 4, 0, 0]} name="Cas" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* By maladie */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-sm font-semibold text-gray-700 mb-4">Top maladies déclarées</p>
          {stats.casByMaladie.length === 0 ? (
            <div className="flex items-center justify-center h-[180px] text-sm text-gray-400">Aucune donnée</div>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie data={stats.casByMaladie} dataKey="count" cx="50%" cy="50%" innerRadius={35} outerRadius={60}>
                    {stats.casByMaladie.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1.5 overflow-hidden">
                {stats.casByMaladie.map((m, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-gray-600 truncate flex-1">{m.maladie}</span>
                    <span className="font-semibold text-gray-800 shrink-0">{m.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status distribution */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <p className="text-sm font-semibold text-gray-700 mb-3">Répartition par statut</p>
        <div className="flex flex-wrap gap-2">
          {stats.casByStatut.map(s => (
            <div key={s.statut} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUT_COLORS[s.statut] ?? "#9CA3AF" }} />
              <span className="text-xs text-gray-600">{STATUT_LABELS[s.statut] ?? s.statut}</span>
              <span className="text-sm font-bold text-gray-800">{s.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent cases */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50">
          <p className="text-sm font-semibold text-gray-700">Cas récents (30 jours)</p>
          <Link href="/declarations" className="text-xs text-blue-600 hover:text-blue-800">Voir tous →</Link>
        </div>
        {stats.recentCas.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">Aucun cas ces 30 derniers jours</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {stats.recentCas.map(c => (
              <Link key={c.id} href={`/declarations/${c.id}`} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{c.codeCas} — {c.patient}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{c.maladie}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    c.statut === "confirme" ? "bg-green-100 text-green-700" :
                    c.statut === "en_cours" ? "bg-blue-100 text-blue-700" :
                    "bg-gray-100 text-gray-600"
                  }`}>
                    {STATUT_LABELS[c.statut] ?? c.statut}
                  </span>
                  <p className="text-[11px] text-gray-400 mt-1">{c.createdAt}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
