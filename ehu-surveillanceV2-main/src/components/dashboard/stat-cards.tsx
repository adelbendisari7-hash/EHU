"use client"

import { useEffect, useRef, useState } from "react"
import { Activity, CheckSquare, Skull, MapPin, TrendingUp, TrendingDown, Minus } from "lucide-react"

export interface DashboardStats {
  nombreCas: number
  tauxCompletude: number
  tauxLethalite: number
  hotspot: { nom: string; count: number; type: "wilaya" | "commune" }
  evolutionPct: number
}

function useCounter(target: number, duration = 700) {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (target === 0) { setValue(0); return }
    const start = performance.now()
    const animate = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * target))
      if (progress < 1) rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [target, duration])

  return value
}

function StatCard({
  label,
  value,
  sub,
  color,
  bgColor,
  icon: Icon,
  delay = 0,
  suffix = "",
  pulse = false,
}: {
  label: string
  value: number | string
  sub: string
  color: string
  bgColor: string
  icon: React.ElementType
  delay?: number
  suffix?: string
  pulse?: boolean
}) {
  const numericValue = typeof value === "number" ? Math.round(value) : 0
  const animated = useCounter(numericValue)
  const display = typeof value === "string" ? `${value}${suffix}` : `${animated}${suffix}`

  return (
    <div
      className="bg-white rounded-xl border border-gray-100 p-5 card-hover relative overflow-hidden animate-fade-in-up"
      style={{ animationDelay: `${delay}ms`, boxShadow: "var(--shadow-sm)" }}
    >
      <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full" style={{ backgroundColor: color }} />

      <div className="flex items-start justify-between mb-4 pl-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-gray-400">{label}</p>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: bgColor }}>
          <Icon size={15} style={{ color }} />
        </div>
      </div>

      <div className="pl-2">
        <p className="text-2xl font-bold counter-in tracking-tight truncate" style={{ color }}>
          {display}
          {pulse && (
            <span className="ml-2 inline-flex w-1.5 h-1.5 rounded-full badge-pulse align-middle mb-1" style={{ backgroundColor: color }} />
          )}
        </p>
        <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">{sub}</p>
      </div>
    </div>
  )
}

function EvolutionCard({
  pct,
  delay = 0,
}: {
  pct: number
  delay?: number
}) {
  const absPct = Math.abs(pct)
  const animated = useCounter(absPct)

  const isUp = pct > 0
  const isDown = pct < 0
  const isNeutral = pct === 0

  const color = isUp ? "#DC2626" : isDown ? "#059669" : "#6B7280"
  const bgColor = isUp ? "#FEF2F2" : isDown ? "#ECFDF5" : "#F9FAFB"
  const Icon = isUp ? TrendingUp : isDown ? TrendingDown : Minus
  const sign = isUp ? "+" : isDown ? "-" : ""
  const sub = isUp
    ? "hausse vs période précédente"
    : isDown
    ? "baisse vs période précédente"
    : "stable vs période précédente"

  return (
    <div
      className="bg-white rounded-xl border border-gray-100 p-5 card-hover relative overflow-hidden animate-fade-in-up"
      style={{ animationDelay: `${delay}ms`, boxShadow: "var(--shadow-sm)" }}
    >
      <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full" style={{ backgroundColor: color }} />

      <div className="flex items-start justify-between mb-4 pl-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-gray-400">Évolution</p>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: bgColor }}>
          <Icon size={15} style={{ color }} />
        </div>
      </div>

      <div className="pl-2">
        <p className="text-2xl font-bold counter-in tracking-tight" style={{ color }}>
          {isNeutral ? "0%" : `${sign}${animated}%`}
        </p>
        <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">{sub}</p>
      </div>
    </div>
  )
}

function HotspotCard({
  hotspot,
  delay = 0,
}: {
  hotspot: DashboardStats["hotspot"]
  delay?: number
}) {
  const color = "#0891B2"
  const bgColor = "#ECFEFF"
  const label = hotspot.type === "wilaya" ? "Wilaya la plus touchée" : "Commune la plus touchée"

  return (
    <div
      className="bg-white rounded-xl border border-gray-100 p-5 card-hover relative overflow-hidden animate-fade-in-up"
      style={{ animationDelay: `${delay}ms`, boxShadow: "var(--shadow-sm)" }}
    >
      <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full" style={{ backgroundColor: color }} />

      <div className="flex items-start justify-between mb-4 pl-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-gray-400">{label}</p>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: bgColor }}>
          <MapPin size={15} style={{ color }} />
        </div>
      </div>

      <div className="pl-2">
        <p className="text-2xl font-bold counter-in tracking-tight truncate" style={{ color }}>
          {hotspot.nom}
        </p>
        <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
          {hotspot.count > 0 ? `${hotspot.count} cas déclarés` : "aucun cas localisé"}
        </p>
      </div>
    </div>
  )
}

export default function StatCards({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      <StatCard
        label="Nombre de Cas"
        value={stats.nombreCas}
        sub="déclarés sur la période"
        color="#1B4F8A"
        bgColor="#EBF1FA"
        icon={Activity}
        delay={0}
      />
      <StatCard
        label="Complétude des Fiches"
        value={stats.tauxCompletude}
        suffix="%"
        sub="champs obligatoires remplis"
        color="#7C3AED"
        bgColor="#F5F0FF"
        icon={CheckSquare}
        delay={50}
      />
      <StatCard
        label="Taux de Létalité (CFR)"
        value={String(stats.tauxLethalite)}
        suffix="%"
        sub="décès / cas confirmés"
        color={stats.tauxLethalite > 5 ? "#DC2626" : stats.tauxLethalite > 0 ? "#D97706" : "#059669"}
        bgColor={stats.tauxLethalite > 5 ? "#FEF2F2" : stats.tauxLethalite > 0 ? "#FFFBEB" : "#ECFDF5"}
        icon={Skull}
        delay={100}
      />
      <HotspotCard hotspot={stats.hotspot} delay={150} />
      <EvolutionCard pct={stats.evolutionPct} delay={200} />
    </div>
  )
}
