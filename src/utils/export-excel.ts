"use client"

// Excel export utilities using SheetJS (xlsx)
// All functions run client-side only (browser)

export interface CasRow {
  "Code Cas": string
  "Patient": string
  "Sexe": string
  "Maladie": string
  "Code MDO": string
  "Commune": string
  "Statut": string
  "Mode Confirmation": string
  "Service": string
  "Date Déclaration": string
}

export interface AnalyticsExcelData {
  summary: { total: number; confirmes: number; tauxConfirmation: number; maladiesDeclarees: number; totalMaladies: number; communesTouchees: number }
  categorieDistribution: { name: string; key: string; count: number }[]
  evolutionDistribution: { name: string; count: number }[]
  ageDistribution: { name: string; count: number }[]
  sexDistribution: { name: string; count: number }[]
  weeklyTrend: { date: string; count: number }[]
  period: string
}

function autoWidths(data: Record<string, unknown>[]): number[] {
  if (!data.length) return []
  return Object.keys(data[0]).map(key => {
    const maxData = Math.max(...data.map(row => String(row[key] ?? "").length))
    return Math.min(Math.max(key.length, maxData) + 2, 40)
  })
}

// Export the cases list as Excel
export async function exportCasExcel(rows: CasRow[]) {
  const XLSX = await import("xlsx")

  const wb = XLSX.utils.book_new()

  // Sheet 1 — Cases data
  const ws = XLSX.utils.json_to_sheet(rows)
  const widths = autoWidths(rows as unknown as Record<string, unknown>[])
  ws["!cols"] = widths.map(w => ({ wch: w }))

  // Style header row (bold) — SheetJS community doesn't support full cell styling, but we can set the header
  XLSX.utils.book_append_sheet(wb, ws, "Cas Déclarés")

  // Sheet 2 — Summary
  const summaryRows = rows.length > 0 ? [
    { "Indicateur": "Total Cas", "Valeur": rows.length },
    { "Indicateur": "Cas Confirmés", "Valeur": rows.filter(r => r["Statut"] === "confirme").length },
    { "Indicateur": "Cas Suspects", "Valeur": rows.filter(r => r["Statut"] === "suspect").length },
    { "Indicateur": "Brouillons", "Valeur": rows.filter(r => r["Statut"] === "brouillon").length },
  ] : [{ "Indicateur": "Aucune donnée", "Valeur": 0 }]

  const wsSummary = XLSX.utils.json_to_sheet(summaryRows)
  wsSummary["!cols"] = [{ wch: 25 }, { wch: 15 }]
  XLSX.utils.book_append_sheet(wb, wsSummary, "Résumé")

  // Sheet 3 — By disease breakdown
  const byDisease: Record<string, number> = {}
  rows.forEach(r => {
    byDisease[r["Maladie"]] = (byDisease[r["Maladie"]] ?? 0) + 1
  })
  const diseaseRows = Object.entries(byDisease)
    .sort((a, b) => b[1] - a[1])
    .map(([maladie, count]) => ({
      "Maladie": maladie,
      "Nombre de Cas": count,
      "% du Total": rows.length > 0 ? `${Math.round((count / rows.length) * 100)}%` : "0%",
    }))

  const wsByDisease = XLSX.utils.json_to_sheet(diseaseRows)
  wsByDisease["!cols"] = [{ wch: 35 }, { wch: 18 }, { wch: 15 }]
  XLSX.utils.book_append_sheet(wb, wsByDisease, "Par Maladie")

  const dateStr = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(wb, `cas-declares-ehu-${dateStr}.xlsx`)
}

// Export the analytics data as a multi-sheet Excel workbook
export async function exportAnalysesExcel(data: AnalyticsExcelData) {
  const XLSX = await import("xlsx")

  const wb = XLSX.utils.book_new()

  // Sheet 1 — Summary KPIs
  const summaryRows = [
    { "Indicateur": "Total Cas", "Valeur": data.summary.total },
    { "Indicateur": "Cas Confirmés", "Valeur": data.summary.confirmes },
    { "Indicateur": "Taux de Confirmation", "Valeur": `${data.summary.tauxConfirmation}%` },
    { "Indicateur": "Profil MDO", "Valeur": `${data.summary.maladiesDeclarees}/${data.summary.totalMaladies}` },
    { "Indicateur": "Période Analysée", "Valeur": data.period },
  ]
  const wsSummary = XLSX.utils.json_to_sheet(summaryRows)
  wsSummary["!cols"] = [{ wch: 28 }, { wch: 20 }]
  XLSX.utils.book_append_sheet(wb, wsSummary, "Résumé")

  // Sheet 2 — Category distribution
  const catTotal = data.categorieDistribution.reduce((s, d) => s + d.count, 0)
  const catRows = data.categorieDistribution.map(d => ({
    "Catégorie": d.name,
    "Nombre de Cas": d.count,
    "% du Total": catTotal > 0 ? `${Math.round((d.count / catTotal) * 100)}%` : "0%",
  }))
  const wsCat = XLSX.utils.json_to_sheet(catRows)
  wsCat["!cols"] = [{ wch: 20 }, { wch: 18 }, { wch: 15 }]
  XLSX.utils.book_append_sheet(wb, wsCat, "Par Catégorie")

  // Sheet 3 — Weekly trend
  const trendRows = data.weeklyTrend.map(d => ({
    "Semaine": d.date,
    "Nombre de Cas": d.count,
  }))
  const wsTrend = XLSX.utils.json_to_sheet(trendRows)
  wsTrend["!cols"] = [{ wch: 20 }, { wch: 18 }]
  XLSX.utils.book_append_sheet(wb, wsTrend, "Tendance Hebdomadaire")

  // Sheet 4 — Age distribution
  const ageRows = data.ageDistribution.map(d => ({
    "Tranche d'Âge": d.name,
    "Nombre de Cas": d.count,
    "% du Total": data.summary.total > 0 ? `${Math.round((d.count / data.summary.total) * 100)}%` : "0%",
  }))
  const wsAge = XLSX.utils.json_to_sheet(ageRows)
  wsAge["!cols"] = [{ wch: 18 }, { wch: 18 }, { wch: 15 }]
  XLSX.utils.book_append_sheet(wb, wsAge, "Répartition par Âge")

  // Sheet 5 — Sex distribution
  const sexRows = data.sexDistribution.map(d => ({
    "Sexe": d.name === "M" ? "Masculin" : d.name === "F" ? "Féminin" : d.name,
    "Nombre de Cas": d.count,
    "% du Total": data.summary.total > 0 ? `${Math.round((d.count / data.summary.total) * 100)}%` : "0%",
  }))
  const wsSex = XLSX.utils.json_to_sheet(sexRows)
  wsSex["!cols"] = [{ wch: 15 }, { wch: 18 }, { wch: 15 }]
  XLSX.utils.book_append_sheet(wb, wsSex, "Répartition par Sexe")

  // Sheet 6 — Evolution distribution
  const evolutionTotal = data.evolutionDistribution.reduce((s, d) => s + d.count, 0)
  const evolutionRows = data.evolutionDistribution.map(d => ({
    "Évolution": d.name,
    "Nombre de Cas": d.count,
    "% du Total": evolutionTotal > 0 ? `${Math.round((d.count / evolutionTotal) * 100)}%` : "0%",
  }))
  const wsEvolution = XLSX.utils.json_to_sheet(evolutionRows)
  wsEvolution["!cols"] = [{ wch: 25 }, { wch: 18 }, { wch: 15 }]
  XLSX.utils.book_append_sheet(wb, wsEvolution, "Évolution")

  const dateStr = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(wb, `rapport-analyses-ehu-${dateStr}.xlsx`)
}
