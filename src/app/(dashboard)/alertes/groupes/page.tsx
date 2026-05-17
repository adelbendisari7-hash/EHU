"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { AlertTriangle, Shield, Clock, ChevronDown, ChevronRight, Activity } from "lucide-react"

const GROUPE_META: Record<string, { label: string; color: string; bg: string; border: string; description: string }> = {
  zoonose:     { label: "Zoonose",      color: "#D97706", bg: "bg-amber-50",   border: "border-amber-200", description: "Maladies transmises de l'animal à l'homme" },
  pev:         { label: "PEV",          color: "#7C3AED", bg: "bg-violet-50",  border: "border-violet-200", description: "Programme Élargi de Vaccination" },
  mth:         { label: "MTH",          color: "#2563EB", bg: "bg-blue-50",    border: "border-blue-200", description: "Maladies à Transmission Hydrique" },
  ist:         { label: "IST",          color: "#DC2626", bg: "bg-red-50",     border: "border-red-200", description: "Infections Sexuellement Transmissibles" },
  nosocomiale: { label: "Nosocomiale",  color: "#059669", bg: "bg-emerald-50", border: "border-emerald-200", description: "Infections associées aux soins" },
  vectorielle: { label: "Vectorielle",  color: "#EA580C", bg: "bg-orange-50",  border: "border-orange-200", description: "Maladies transmises par un vecteur" },
  autre:       { label: "Autre",        color: "#6B7280", bg: "bg-gray-50",    border: "border-gray-200", description: "Autres maladies à déclaration obligatoire" },
}

const GROUPE_ORDER = ["nosocomiale", "vectorielle", "mth", "pev", "zoonose", "ist", "autre"]

const GRAVITE_BADGE: Record<string, { label: string; cls: string }> = {
  critique: { label: "Critique", cls: "bg-red-100 text-red-700" },
  urgent:   { label: "Urgent",   cls: "bg-amber-100 text-amber-700" },
  attention:{ label: "Attention",cls: "bg-blue-100 text-blue-700" },
}

interface MaladieRow {
  id: string
  nom: string
  nomCourt: string | null
  codeCim10: string
  groupeEpidemiologique: string | null
  seuilAlertTexte: string | null
  delaiDeclarationTexte: string | null
  seuilDefaut: number | null
  delaiNotificationHeures: number | null
  categorieGravite: string | null
  _count: { casDeclares: number; alertes: number }
}

export default function GroupesMaladiesPage() {
  const [grouped, setGrouped] = useState<Record<string, MaladieRow[]>>({})
  const [recentCounts, setRecentCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(GROUPE_ORDER))

  useEffect(() => {
    fetch("/api/groupes-maladies")
      .then(r => r.json())
      .then(data => {
        setGrouped(data.grouped)
        setRecentCounts(data.recentCounts)
      })
      .finally(() => setLoading(false))
  }, [])

  const toggleGroup = (g: string) => {
    setOpenGroups(prev => {
      const next = new Set(prev)
      if (next.has(g)) next.delete(g)
      else next.add(g)
      return next
    })
  }

  const totalMaladies = Object.values(grouped).flat().length
  const totalActiveAlerts = Object.values(grouped).flat().reduce((acc, m) => acc + m._count.alertes, 0)
  const totalRecent = Object.values(recentCounts).reduce((a, b) => a + b, 0)

  if (loading) {
    return (
      <div className="py-20 text-center text-sm text-gray-400">
        Chargement du tableau des groupes de maladies...
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/alertes" className="text-sm text-gray-400 hover:text-gray-600">← Alertes</Link>
            <span className="text-gray-300">/</span>
            <h1 className="text-xl font-semibold text-gray-800">Tableau Groupe de Maladies</h1>
          </div>
          <p className="text-sm text-gray-500">Classification des maladies par groupe épidémiologique avec seuils d&apos;alerte</p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Maladies classifiées", value: totalMaladies, icon: Shield, color: "#1B4F8A" },
          { label: "Groupes", value: Object.keys(grouped).length, icon: Activity, color: "#7C3AED" },
          { label: "Alertes actives", value: totalActiveAlerts, icon: AlertTriangle, color: "#DC2626" },
          { label: "Cas (30 jours)", value: totalRecent, icon: Clock, color: "#059669" },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <card.icon size={16} style={{ color: card.color }} />
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{card.label}</p>
            </div>
            <p className="text-2xl font-bold" style={{ color: card.color }}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Grouped tables */}
      <div className="space-y-4">
        {GROUPE_ORDER.filter(g => grouped[g]?.length > 0).map(g => {
          const meta = GROUPE_META[g]
          const maladies = grouped[g] ?? []
          const isOpen = openGroups.has(g)
          const groupRecentTotal = maladies.reduce((acc, m) => acc + (recentCounts[m.id] ?? 0), 0)
          const groupAlerts = maladies.reduce((acc, m) => acc + m._count.alertes, 0)

          return (
            <div key={g} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Group header */}
              <button
                onClick={() => toggleGroup(g)}
                className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isOpen ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                  <span
                    className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-white text-xs font-bold"
                    style={{ backgroundColor: meta.color }}
                  >
                    {maladies.length}
                  </span>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-800">{meta.label}</p>
                    <p className="text-xs text-gray-400">{meta.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                    {groupRecentTotal} cas / 30j
                  </span>
                  {groupAlerts > 0 && (
                    <span className="px-2 py-1 rounded-full bg-red-100 text-red-600 font-medium">
                      {groupAlerts} alerte{groupAlerts > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </button>

              {/* Disease table */}
              {isOpen && (
                <div className="border-t border-gray-100">
                  <table className="w-full">
                    <thead>
                      <tr style={{ backgroundColor: "#F8F9FA" }}>
                        {["Maladie", "Code CIM-10", "Seuil d'alerte", "Délai déclaration", "Gravité", "Cas (30j)", "Alertes"].map(h => (
                          <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {maladies.map((m, i) => {
                        const recent = recentCounts[m.id] ?? 0
                        const seuil = m.seuilDefaut ?? 1
                        const isOverThreshold = recent >= seuil
                        const gravite = GRAVITE_BADGE[m.categorieGravite ?? ""] ?? GRAVITE_BADGE.attention

                        return (
                          <tr
                            key={m.id}
                            className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"} ${isOverThreshold ? "!bg-red-50/60" : ""}`}
                            style={{ borderBottom: "1px solid #F0F1F3" }}
                          >
                            <td className="px-4 py-2.5">
                              <p className="text-sm font-medium text-gray-800">{m.nom}</p>
                              {m.nomCourt && m.nomCourt !== m.nom && (
                                <p className="text-[10px] text-gray-400">{m.nomCourt}</p>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-xs font-mono text-gray-500">{m.codeCim10}</td>
                            <td className="px-4 py-2.5">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${meta.bg} ${meta.border} border`}
                                    style={{ color: meta.color }}>
                                {m.seuilAlertTexte ?? `${seuil} cas`}
                              </span>
                            </td>
                            <td className="px-4 py-2.5">
                              <span className={`text-xs font-medium ${
                                m.delaiDeclarationTexte === "immédiat" ? "text-red-600" :
                                m.delaiDeclarationTexte === "24h" ? "text-amber-600" :
                                "text-gray-500"
                              }`}>
                                {m.delaiDeclarationTexte ?? "—"}
                              </span>
                            </td>
                            <td className="px-4 py-2.5">
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${gravite.cls}`}>
                                {gravite.label}
                              </span>
                            </td>
                            <td className="px-4 py-2.5">
                              <span className={`text-sm font-semibold ${isOverThreshold ? "text-red-600" : "text-gray-600"}`}>
                                {recent}
                              </span>
                              {isOverThreshold && (
                                <AlertTriangle size={12} className="inline ml-1 text-red-500" />
                              )}
                            </td>
                            <td className="px-4 py-2.5">
                              {m._count.alertes > 0 ? (
                                <span className="text-xs font-medium bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                                  {m._count.alertes}
                                </span>
                              ) : (
                                <span className="text-xs text-gray-300">0</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
