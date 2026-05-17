// ─── Shared types ─────────────────────────────────────────────────────────────

export type NiveauAlerte = "normal" | "attention" | "alerte"

export interface SeriesPoint {
  date: string
  count: number
}

// ─── CUSUM ────────────────────────────────────────────────────────────────────

export interface CusumPoint {
  date: string
  count: number
  moyenne: number
  seuilHaut: number
  cusumScore: number
  niveau: NiveauAlerte
}

export interface CusumResult {
  points: CusumPoint[]
  niveauActuel: NiveauAlerte
  titreStatut: string
  descriptionStatut: string
  moyenneJournaliere: number
  seuilAlerte: number
  donneesInsuffisantes: boolean
}

export function computeCusum(series: SeriesPoint[]): CusumResult {
  const BASELINE_WINDOW = 14 // days used to compute the baseline
  const K = 0.5              // allowance: sensitivity to shifts
  const H_ATTENTION = 2      // CUSUM threshold for "attention" (× std)
  const H_ALERTE = 5         // CUSUM threshold for "alerte" (× std)

  if (series.length < BASELINE_WINDOW) {
    return {
      points: series.map(s => ({
        ...s,
        moyenne: s.count,
        seuilHaut: s.count * 2,
        cusumScore: 0,
        niveau: "normal" as NiveauAlerte,
      })),
      niveauActuel: "normal",
      titreStatut: "Données insuffisantes",
      descriptionStatut: `Il faut au moins ${BASELINE_WINDOW} jours de données pour détecter des anomalies. Continuez à déclarer des cas pour activer cette fonctionnalité.`,
      moyenneJournaliere: 0,
      seuilAlerte: 0,
      donneesInsuffisantes: true,
    }
  }

  let cusumScore = 0
  const points: CusumPoint[] = []

  for (let i = 0; i < series.length; i++) {
    const windowStart = Math.max(0, i - BASELINE_WINDOW)
    const window = series.slice(windowStart, i)

    if (window.length < 3) {
      points.push({ date: series[i].date, count: series[i].count, moyenne: series[i].count, seuilHaut: series[i].count * 2, cusumScore: 0, niveau: "normal" })
      continue
    }

    const vals = window.map(d => d.count)
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length
    const variance = vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length
    const std = Math.sqrt(variance) || 1

    cusumScore = Math.max(0, cusumScore + (series[i].count - mean - K * std))

    const seuilHaut = mean + 2 * std
    let niveau: NiveauAlerte = "normal"
    if (cusumScore > H_ALERTE * std || series[i].count > mean + 3 * std) niveau = "alerte"
    else if (cusumScore > H_ATTENTION * std || series[i].count > mean + 1.5 * std) niveau = "attention"

    points.push({
      date: series[i].date,
      count: series[i].count,
      moyenne: Math.round(mean * 10) / 10,
      seuilHaut: Math.round(seuilHaut * 10) / 10,
      cusumScore: Math.round(cusumScore * 10) / 10,
      niveau,
    })
  }

  // Overall status = worst level seen in the last 7 days
  const recent = points.slice(-7)
  const alertCount = recent.filter(p => p.niveau === "alerte").length
  const attentionCount = recent.filter(p => p.niveau === "attention").length

  let niveauActuel: NiveauAlerte = "normal"
  if (alertCount >= 2) niveauActuel = "alerte"
  else if (alertCount >= 1 || attentionCount >= 3) niveauActuel = "attention"

  const lastPoint = points[points.length - 1]
  const moyenneJournaliere = lastPoint?.moyenne ?? 0
  const seuilAlerte = lastPoint?.seuilHaut ?? 0

  const descriptions: Record<NiveauAlerte, { titre: string; description: string }> = {
    normal: {
      titre: "Situation normale",
      description: `Le nombre de cas est dans les limites habituelles (moyenne de ${Math.round(moyenneJournaliere)} cas/jour). Aucune action particulière n'est nécessaire.`,
    },
    attention: {
      titre: "Légère hausse inhabituelle",
      description: `Une augmentation un peu plus élevée que d'habitude a été observée ces 7 derniers jours. La moyenne habituelle est de ${Math.round(moyenneJournaliere)} cas/jour. Une surveillance renforcée est conseillée.`,
    },
    alerte: {
      titre: "Activité anormale — réaction recommandée",
      description: `Le nombre de cas dépasse nettement le niveau habituel (seuil : ${Math.round(seuilAlerte)} cas/jour) depuis plusieurs jours consécutifs. Une investigation épidémiologique est fortement recommandée.`,
    },
  }

  return {
    points,
    niveauActuel,
    titreStatut: descriptions[niveauActuel].titre,
    descriptionStatut: descriptions[niveauActuel].description,
    moyenneJournaliere: Math.round(moyenneJournaliere * 10) / 10,
    seuilAlerte: Math.round(seuilAlerte * 10) / 10,
    donneesInsuffisantes: false,
  }
}

// ─── Holt-Winters (Holt's linear — trend without seasonality) ─────────────────

export interface HWPoint {
  date: string
  count: number | null        // actual historical value
  prevision: number | null    // forecast value
  bas: number | null          // confidence lower bound
  haut: number | null         // confidence upper bound
}

export interface HoltWintersResult {
  points: HWPoint[]
  tendance: "hausse" | "stable" | "baisse"
  tendancePct: number
  prevision7j: number
  prevision14j: number
  prevision30j: number
  messageTendance: string
  fiabilite: number           // 0–100 based on error rate
  donneesInsuffisantes: boolean
}

export function computeHoltWinters(series: SeriesPoint[], horizonDays = 14): HoltWintersResult {
  const α = 0.3 // level smoothing
  const β = 0.1 // trend smoothing

  if (series.length < 7) {
    const today = new Date()
    const points: HWPoint[] = series.map(s => ({ date: s.date, count: s.count, prevision: null, bas: null, haut: null }))
    for (let h = 1; h <= horizonDays; h++) {
      const d = new Date(today)
      d.setDate(d.getDate() + h)
      points.push({ date: d.toISOString().slice(0, 10), count: null, prevision: 0, bas: 0, haut: 0 })
    }
    return { points, tendance: "stable", tendancePct: 0, prevision7j: 0, prevision14j: 0, prevision30j: 0, messageTendance: "Données insuffisantes pour une prévision fiable (7 jours minimum requis).", fiabilite: 0, donneesInsuffisantes: true }
  }

  const y = series.map(s => s.count)
  const n = y.length

  // Initialize level and trend
  let L = y[0]
  let T = (y[Math.min(6, n - 1)] - y[0]) / Math.min(6, n - 1)

  const fitted: number[] = [y[0]]
  for (let t = 1; t < n; t++) {
    const Lprev = L
    L = α * y[t] + (1 - α) * (L + T)
    T = β * (L - Lprev) + (1 - β) * T
    fitted.push(Lprev + T)
  }

  // RMSE for confidence intervals
  const errors = y.slice(1).map((actual, i) => (actual - fitted[i + 1]) ** 2)
  const rmse = Math.sqrt(errors.reduce((a, b) => a + b, 0) / errors.length) || 1

  // MAPE for reliability score
  const mapeVals = y.slice(1)
    .map((actual, i) => actual > 0 ? Math.abs((actual - fitted[i + 1]) / actual) : 0)
    .filter(v => isFinite(v))
  const mape = mapeVals.length > 0 ? mapeVals.reduce((a, b) => a + b, 0) / mapeVals.length * 100 : 50
  const fiabilite = Math.max(10, Math.min(95, Math.round(100 - mape)))

  // Historical points (last point bridges into forecast)
  const points: HWPoint[] = series.map((s, i) => ({
    date: s.date,
    count: s.count,
    prevision: i === n - 1 ? Math.max(0, Math.round(L + T)) : null,
    bas: i === n - 1 ? Math.max(0, Math.round(L + T - rmse)) : null,
    haut: i === n - 1 ? Math.round(L + T + rmse) : null,
  }))

  // Forecast points
  const lastDate = new Date(series[n - 1].date)
  const forecastMap: Record<number, number> = {}

  for (let h = 1; h <= Math.max(horizonDays, 30); h++) {
    const d = new Date(lastDate)
    d.setDate(d.getDate() + h)
    const fVal = Math.max(0, Math.round(L + h * T))
    const lower = Math.max(0, Math.round(fVal - 1.96 * rmse * Math.sqrt(h)))
    const upper = Math.round(fVal + 1.96 * rmse * Math.sqrt(h))
    forecastMap[h] = fVal
    if (h <= horizonDays) {
      points.push({ date: d.toISOString().slice(0, 10), count: null, prevision: fVal, bas: lower, haut: upper })
    }
  }

  const prevision7j = forecastMap[7] ?? Math.max(0, Math.round(L + 7 * T))
  const prevision14j = forecastMap[14] ?? Math.max(0, Math.round(L + 14 * T))
  const prevision30j = forecastMap[30] ?? Math.max(0, Math.round(L + 30 * T))

  // Trend from last 7 days vs forecast 7 days
  const recentMean = y.slice(-7).reduce((a, b) => a + b, 0) / Math.min(7, n)
  const tendancePct = recentMean > 0 ? Math.round(((prevision7j - recentMean) / recentMean) * 100) : 0

  let tendance: "hausse" | "stable" | "baisse"
  let messageTendance: string

  if (tendancePct > 15) {
    tendance = "hausse"
    messageTendance = `Le modèle prévoit une hausse d'environ ${tendancePct}% dans les 7 prochains jours, soit autour de ${prevision7j} cas/jour. Cette tendance mérite d'être surveillée de près.`
  } else if (tendancePct < -15) {
    tendance = "baisse"
    messageTendance = `Le modèle prévoit une baisse d'environ ${Math.abs(tendancePct)}% dans les 7 prochains jours, soit autour de ${prevision7j} cas/jour. La situation semble s'améliorer.`
  } else {
    tendance = "stable"
    messageTendance = `Le nombre de cas devrait rester stable autour de ${prevision7j} cas/jour dans les prochains jours. Aucun changement majeur n'est attendu.`
  }

  return { points, tendance, tendancePct, prevision7j, prevision14j, prevision30j, messageTendance, fiabilite, donneesInsuffisantes: false }
}
