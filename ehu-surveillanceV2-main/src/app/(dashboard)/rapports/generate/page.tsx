"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

const TYPES = [
  { value: "personnalise", label: "Personnalisé", desc: "Choisissez vos propres dates" },
  { value: "mensuel", label: "Mensuel", desc: "Un mois calendaire complet" },
  { value: "trimestriel", label: "Trimestriel", desc: "3 mois (T1, T2, T3, T4)" },
  { value: "semestriel", label: "Semestriel", desc: "6 mois (S1 ou S2)" },
  { value: "annuel", label: "Annuel", desc: "Année complète" },
]

export default function GenerateRapportPage() {
  const router = useRouter()
  const [type, setType] = useState("mensuel")
  const [dateDebut, setDateDebut] = useState("")
  const [dateFin, setDateFin] = useState("")
  const [service, setService] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-fill dates for preset types
  const handleTypeChange = (t: string) => {
    setType(t)
    const now = new Date()
    if (t === "mensuel") {
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const last = new Date(now.getFullYear(), now.getMonth(), 0)
      setDateDebut(first.toISOString().slice(0, 10))
      setDateFin(last.toISOString().slice(0, 10))
    } else if (t === "trimestriel") {
      const q = Math.ceil(now.getMonth() / 3)
      const startMonth = (q - 2) * 3
      const first = new Date(now.getFullYear(), startMonth, 1)
      const last = new Date(now.getFullYear(), startMonth + 3, 0)
      setDateDebut(first.toISOString().slice(0, 10))
      setDateFin(last.toISOString().slice(0, 10))
    } else if (t === "semestriel") {
      const sem = now.getMonth() < 6 ? 0 : 6
      const first = new Date(now.getFullYear(), sem === 0 ? -6 : 0, 1)
      const last = new Date(now.getFullYear(), sem === 0 ? 0 : 6, 0)
      setDateDebut(first.toISOString().slice(0, 10))
      setDateFin(last.toISOString().slice(0, 10))
    } else if (t === "annuel") {
      setDateDebut(`${now.getFullYear() - 1}-01-01`)
      setDateFin(`${now.getFullYear() - 1}-12-31`)
    } else {
      setDateDebut("")
      setDateFin("")
    }
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/rapports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, dateDebut, dateFin, service: service.trim() || undefined }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error ?? "Erreur lors de la génération")
      }
      const rapport = await res.json()
      router.push(`/rapports/${rapport.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setLoading(false)
    }
  }

  const inputCls = "w-full h-10 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#1B4F8A]"

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/rapports" className="text-sm text-gray-400 hover:text-gray-600">← Rapports</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-semibold text-gray-800">Générer un Rapport</h1>
      </div>

      <form onSubmit={handleGenerate} className="max-w-xl space-y-5">
        {/* Type selection */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Type de Rapport</h2>
          <div className="grid grid-cols-1 gap-2">
            {TYPES.map(t => (
              <label key={t.value} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${type === t.value ? "border-[#1B4F8A] bg-blue-50" : "border-gray-100 hover:border-gray-200"}`}>
                <input type="radio" value={t.value} checked={type === t.value} onChange={() => handleTypeChange(t.value)} className="accent-[#1B4F8A]" />
                <div>
                  <p className="text-sm font-medium text-gray-800">{t.label}</p>
                  <p className="text-xs text-gray-400">{t.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Date range */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Période Couverte</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Date de début *</label>
              <input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)} required className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Date de fin *</label>
              <input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)} required className={inputCls} />
            </div>
          </div>
        </div>

        {/* Service filter */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">Filtre par Service <span className="font-normal text-gray-400">(optionnel)</span></h2>
          <p className="text-xs text-gray-400 mb-3">Laissez vide pour inclure tous les services</p>
          <input
            type="text"
            value={service}
            onChange={e => setService(e.target.value)}
            placeholder="Ex: Médecine interne, Pédiatrie..."
            className={inputCls}
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-60"
            style={{ backgroundColor: "#1B4F8A" }}
          >
            {loading ? "Génération en cours..." : "Générer le Rapport"}
          </button>
          <Link href="/rapports" className="px-6 py-2.5 rounded-lg text-sm border border-gray-200 text-gray-600 hover:bg-gray-50">
            Annuler
          </Link>
        </div>
      </form>
    </div>
  )
}
