"use client"

import { useState, useEffect, useCallback } from "react"
import dynamic from "next/dynamic"
import DashboardFilters from "./dashboard-filters"
import EpidemicCurve from "./epidemic-curve"
import DiseaseDistribution from "./disease-distribution"
import StatCards from "./stat-cards"
import { DashboardSkeleton, Sk } from "@/components/shared/skeleton"
import { AlertCircle, RefreshCw } from "lucide-react"

const EpidemicMap = dynamic(() => import("@/components/maps/epidemic-map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg">
      <div className="text-center">
        <div className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-[#1B4F8A] animate-spinner mx-auto mb-2" />
        <p className="text-xs text-gray-400">Chargement de la carte...</p>
      </div>
    </div>
  ),
})

interface Maladie { id: string; nom: string }
interface Commune { id: string; nom: string }

interface DashboardData {
  stats: { totalActifs: number; totalAlertes: number; totalMaladies: number }
  mapMarkers: Array<{ id: string; lat: number; lng: number; statut: string; maladie: string; commune: string; date: string }>
  epidemicCurve: Array<{ date: string; count: number }>
  diseaseDistribution: Array<{ name: string; count: number }>
}

interface Props {
  maladies: Maladie[]
  communes: Commune[]
  userName: string
}

export default function DashboardClient({ maladies, communes, userName }: Props) {
  const [filters, setFilters] = useState({ maladieId: "", communeId: "", days: "30" })
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const params = new URLSearchParams(filters)
      const res = await fetch(`/api/stats/dashboard?${params}`)
      if (!res.ok) throw new Error()
      const json = await res.json()
      setData(json)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { fetchData() }, [fetchData])

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title">Tableau de Bord</h1>
          <p className="page-subtitle">Bienvenue, {userName}</p>
        </div>
        <DashboardFilters maladies={maladies} communes={communes} filters={filters} onChange={setFilters} />
      </div>

      {loading && !data ? (
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
      ) : (
        <div className="space-y-4">
          {/* Stat Cards */}
          <StatCards stats={data!.stats} />

          {/* Map + Disease Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 card p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="card-title">Carte Épidémique</p>
                <span className="text-[11px] text-gray-400 font-medium">Wilaya d&apos;Oran</span>
              </div>
              <div className="rounded-lg overflow-hidden" style={{ height: "340px" }}>
                <EpidemicMap markers={data!.mapMarkers} />
              </div>
            </div>
            <div className="card p-5">
              <p className="card-title mb-4">Répartition par Maladie</p>
              {loading ? (
                <Sk w="100%" h={280} rounded={8} />
              ) : (
                <DiseaseDistribution data={data!.diseaseDistribution} />
              )}
            </div>
          </div>

          {/* Epidemic Curve */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="card-title">Courbe Épidémique</p>
              <span className="badge text-[11px]" style={{ backgroundColor: "var(--brand-50)", color: "var(--brand-500)" }}>
                {filters.days} derniers jours
              </span>
            </div>
            {loading ? (
              <Sk w="100%" h={260} rounded={8} />
            ) : (
              <EpidemicCurve data={data!.epidemicCurve} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
