"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LineChart, Line, PieChart, Pie, Legend,
} from "recharts"
import { exportAnalysesPdf } from "@/utils/export-pdf"
import { exportAnalysesExcel } from "@/utils/export-excel"
import {
  FileText, FileSpreadsheet, ArrowLeft, Printer,
  Activity, CheckCircle, AlertTriangle, Search,
  Calendar, Building2, TrendingUp, Users,
} from "lucide-react"

const PALETTE = ["#1B4F8A", "#2E7D32", "#E65100", "#6A1B9A", "#00838F", "#AD1457", "#4E342E", "#37474F"]

const STATUT_LABELS: Record<string, string> = {
  nouveau: "Nouveau",
  en_cours: "En cours",
  confirme: "Confirmé",
  infirme: "Infirmé",
  cloture: "Clôturé",
}

const TYPE_LABELS: Record<string, string> = {
  mensuel: "Rapport Mensuel",
  trimestriel: "Rapport Trimestriel",
  semestriel: "Rapport Semestriel",
  annuel: "Rapport Annuel",
  personnalise: "Rapport Personnalisé",
}

function KpiCard({
  icon: Icon,
  label,
  value,
  color,
  sub,
}: {
  icon: React.ElementType
  label: string
  value: number
  color: string
  sub?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
      <div className="p-2.5 rounded-lg shrink-0" style={{ backgroundColor: `${color}15` }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-0.5 truncate">{label}</p>
        <p className="text-3xl font-bold text-gray-800">{value.toLocaleString("fr-DZ")}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-1 h-5 rounded-full" style={{ backgroundColor: "#1B4F8A" }} />
      <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">{children}</h2>
    </div>
  )
}

export default function RapportDetailPage() {
  const { id } = useParams<{ id: string }>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [rapport, setRapport] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [exportLoading, setExportLoading] = useState<"pdf" | "excel" | null>(null)

  useEffect(() => {
    fetch(`/api/rapports/${id}`)
      .then(r => r.json())
      .then(setRapport)
      .finally(() => setLoading(false))
  }, [id])

  const handlePdf = async () => {
    setExportLoading("pdf")
    try {
      const period = `${new Date(rapport.dateDebut).toLocaleDateString("fr-FR")} — ${new Date(rapport.dateFin).toLocaleDateString("fr-FR")}`
      const d = rapport.donnees
      await exportAnalysesPdf({
        summary: d.summary,
        prevalence: d.casByMaladie?.map((r: { maladie: string; count: number }) => ({ name: r.maladie, count: r.count })) ?? [],
        weeklyTrend: d.weeklyTrend ?? [],
        ageDistribution: d.ageDistribution ?? [],
        sexDistribution: d.sexDistribution ?? [],
        statutDistribution: d.statutDistribution ?? [],
        period,
      })
    } finally { setExportLoading(null) }
  }

  const handleExcel = async () => {
    setExportLoading("excel")
    try {
      const period = `${new Date(rapport.dateDebut).toLocaleDateString("fr-FR")} — ${new Date(rapport.dateFin).toLocaleDateString("fr-FR")}`
      const d = rapport.donnees
      await exportAnalysesExcel({
        summary: d.summary,
        prevalence: d.casByMaladie?.map((r: { maladie: string; count: number }) => ({ name: r.maladie, count: r.count })) ?? [],
        weeklyTrend: d.weeklyTrend ?? [],
        ageDistribution: d.ageDistribution ?? [],
        sexDistribution: d.sexDistribution ?? [],
        statutDistribution: d.statutDistribution ?? [],
        period,
      })
    } finally { setExportLoading(null) }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <div className="w-8 h-8 border-2 border-[#1B4F8A] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400">Chargement du rapport épidémiologique...</p>
      </div>
    )
  }

  if (!rapport || rapport.error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <AlertTriangle size={32} className="text-red-400" />
        <p className="text-sm text-red-500">Rapport introuvable ou erreur de chargement</p>
        <Link href="/rapports" className="text-sm text-[#1B4F8A] underline">← Retour aux rapports</Link>
      </div>
    )
  }

  const d = rapport.donnees
  const dateDebut = new Date(rapport.dateDebut).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
  const dateFin = new Date(rapport.dateFin).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
  const dateGeneration = new Date(rapport.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })

  const tauxConfirmation = d.summary?.total > 0
    ? Math.round((d.summary.confirmes / d.summary.total) * 100)
    : 0

  return (
    <div className="max-w-5xl">

      {/* ── En-tête officielle ─────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-6 overflow-hidden">
        {/* Bandeau bleu EHU */}
        <div className="px-6 py-4 flex items-center justify-between" style={{ backgroundColor: "#1B4F8A" }}>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shrink-0">
              <Activity size={20} style={{ color: "#1B4F8A" }} />
            </div>
            <div>
              <p className="text-xs font-semibold text-blue-200 uppercase tracking-widest">
                EHU Oran — Épidémiologie
              </p>
              <p className="text-white font-bold text-lg leading-tight">
                {TYPE_LABELS[rapport.type] ?? rapport.type}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white border border-white/30 hover:bg-white/10 transition-colors"
            >
              <Printer size={14} />
              Imprimer
            </button>
          </div>
        </div>

        {/* Métadonnées du rapport */}
        <div className="px-6 py-4 grid grid-cols-3 divide-x divide-gray-100">
          <div className="pr-6 flex items-start gap-3">
            <Calendar size={16} className="text-gray-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Période couverte</p>
              <p className="text-sm font-semibold text-gray-800">{dateDebut}</p>
              <p className="text-xs text-gray-500">au {dateFin}</p>
            </div>
          </div>
          <div className="px-6 flex items-start gap-3">
            <Building2 size={16} className="text-gray-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Service / Périmètre</p>
              <p className="text-sm font-semibold text-gray-800">
                {d.summary?.serviceFiltre ?? "Tous services confondus"}
              </p>
              <p className="text-xs text-gray-500">EHU Oran — Algérie</p>
            </div>
          </div>
          <div className="pl-6 flex items-start gap-3">
            <TrendingUp size={16} className="text-gray-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Généré le</p>
              <p className="text-sm font-semibold text-gray-800">{dateGeneration}</p>
              <p className="text-xs text-gray-500">Système de surveillance épidémiologique</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Actions export ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5">
        <Link href="/rapports" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors">
          <ArrowLeft size={15} />
          Retour aux rapports
        </Link>
        <div className="flex gap-2">
          <button
            onClick={handlePdf}
            disabled={exportLoading !== null}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60 transition-colors"
          >
            <FileText size={14} className="text-red-500" />
            {exportLoading === "pdf" ? "Génération..." : "Exporter PDF"}
          </button>
          <button
            onClick={handleExcel}
            disabled={exportLoading !== null}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60 transition-colors"
          >
            <FileSpreadsheet size={14} className="text-green-600" />
            {exportLoading === "excel" ? "Génération..." : "Exporter Excel"}
          </button>
        </div>
      </div>

      {/* ── Indicateurs clés ───────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <KpiCard
          icon={Users}
          label="Total Cas déclarés"
          value={d.summary?.total ?? 0}
          color="#1B4F8A"
          sub="Sur la période"
        />
        <KpiCard
          icon={CheckCircle}
          label="Cas Confirmés"
          value={d.summary?.confirmes ?? 0}
          color="#2E7D32"
          sub={`${tauxConfirmation}% de confirmation`}
        />
        <KpiCard
          icon={AlertTriangle}
          label="Alertes générées"
          value={d.summary?.alertes ?? 0}
          color="#E65100"
          sub="Seuils dépassés"
        />
        <KpiCard
          icon={Search}
          label="Investigations"
          value={d.summary?.investigations ?? 0}
          color="#6A1B9A"
          sub="Enquêtes épidémio."
        />
      </div>

      {/* ── Distribution par maladie + Tendance hebdomadaire ──────── */}
      {(d.casByMaladie?.length > 0 || d.weeklyTrend?.length > 0) && (
        <div className="grid grid-cols-5 gap-4 mb-4">
          {d.casByMaladie?.length > 0 && (
            <div className="col-span-3 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <SectionTitle>Distribution par Maladie (CIM-10)</SectionTitle>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={d.casByMaladie} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#9CA3AF" }} tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="maladie"
                    tick={{ fontSize: 9, fill: "#6B7280" }}
                    tickLine={false}
                    axisLine={false}
                    width={130}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: "8px", fontSize: "12px", border: "1px solid #E5E7EB" }}
                    formatter={(val: number) => [`${val} cas`, "Nombre"]}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={18}>
                    {d.casByMaladie.map((_: unknown, i: number) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {d.weeklyTrend?.length > 0 && (
            <div className="col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <SectionTitle>Évolution Hebdomadaire</SectionTitle>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={d.weeklyTrend} margin={{ top: 4, right: 16, left: -16, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#9CA3AF" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: "#9CA3AF" }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: "8px", fontSize: "12px", border: "1px solid #E5E7EB" }}
                    formatter={(val: number) => [`${val} cas`, "Semaine"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#1B4F8A"
                    strokeWidth={2.5}
                    dot={{ fill: "#1B4F8A", r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* ── Cas par service ────────────────────────────────────────── */}
      {d.casByService?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-4">
          <SectionTitle>Répartition par Service Hospitalier</SectionTitle>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-2">Service</th>
                  <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wide pb-2">Cas déclarés</th>
                  <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wide pb-2">Part</th>
                  <th className="pb-2 w-40"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {d.casByService.map((s: { service: string; count: number }, i: number) => {
                  const total = d.casByService.reduce((a: number, b: { count: number }) => a + b.count, 0)
                  const pct = total > 0 ? Math.round((s.count / total) * 100) : 0
                  return (
                    <tr key={s.service} className="hover:bg-gray-50/50">
                      <td className="py-2.5 font-medium text-gray-800">{s.service}</td>
                      <td className="py-2.5 text-right font-semibold text-gray-700">{s.count}</td>
                      <td className="py-2.5 text-right text-gray-500">{pct}%</td>
                      <td className="py-2.5 pl-4">
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, backgroundColor: PALETTE[i % PALETTE.length] }}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Pyramide des âges + Statuts ────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {d.ageDistribution?.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <SectionTitle>Pyramide des Âges</SectionTitle>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={d.ageDistribution} margin={{ left: -16, right: 8, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9CA3AF" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", fontSize: "12px", border: "1px solid #E5E7EB" }}
                  formatter={(val: number) => [`${val} cas`, "Tranche d'âge"]}
                />
                <Bar dataKey="count" fill="#1B4F8A" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {d.statutDistribution?.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <SectionTitle>Répartition par Statut Clinique</SectionTitle>
            <div className="grid grid-cols-2 gap-4 mt-1">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={d.statutDistribution.map((s: { name: string; count: number }) => ({
                      name: STATUT_LABELS[s.name] ?? s.name,
                      value: s.count,
                    }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={72}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {d.statutDistribution.map((_: unknown, i: number) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: "8px", fontSize: "12px", border: "1px solid #E5E7EB" }}
                    formatter={(val: number) => [`${val} cas`, ""]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col justify-center gap-2">
                {d.statutDistribution.map((s: { name: string; count: number }, i: number) => {
                  const total = d.statutDistribution.reduce((a: number, b: { count: number }) => a + b.count, 0)
                  const pct = total > 0 ? Math.round((s.count / total) * 100) : 0
                  return (
                    <div key={s.name} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PALETTE[i % PALETTE.length] }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-600 truncate">{STATUT_LABELS[s.name] ?? s.name}</p>
                        <p className="text-xs font-semibold text-gray-800">{s.count} cas <span className="text-gray-400 font-normal">({pct}%)</span></p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Tableau récapitulatif maladies ─────────────────────────── */}
      {d.casByMaladie?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-4">
          <SectionTitle>Tableau Récapitulatif — Maladies à Déclaration Obligatoire</SectionTitle>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-2">Maladie</th>
                <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wide pb-2">Cas déclarés</th>
                <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wide pb-2">Proportion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {d.casByMaladie
                .sort((a: { count: number }, b: { count: number }) => b.count - a.count)
                .map((row: { maladie: string; count: number }, i: number) => {
                  const total = d.summary?.total ?? 0
                  const pct = total > 0 ? ((row.count / total) * 100).toFixed(1) : "0.0"
                  return (
                    <tr key={row.maladie} className="hover:bg-gray-50/50">
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PALETTE[i % PALETTE.length] }} />
                          <span className="font-medium text-gray-800">{row.maladie}</span>
                        </div>
                      </td>
                      <td className="py-2.5 text-right font-bold text-gray-800">{row.count}</td>
                      <td className="py-2.5 text-right text-gray-500">{pct}%</td>
                    </tr>
                  )
                })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200">
                <td className="py-2.5 font-bold text-gray-700">Total</td>
                <td className="py-2.5 text-right font-bold text-[#1B4F8A]">{d.summary?.total ?? 0}</td>
                <td className="py-2.5 text-right font-bold text-gray-500">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* ── Pied de page officiel ──────────────────────────────────── */}
      <div className="bg-gray-50 rounded-xl border border-gray-100 px-5 py-3 flex items-center justify-between text-xs text-gray-400">
        <span>EHU Oran — Unité d&apos;Épidémiologie et de Médecine Préventive</span>
        <span>Document confidentiel — Usage interne uniquement</span>
        <span>Généré automatiquement par le système de surveillance</span>
      </div>

    </div>
  )
}
