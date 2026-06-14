"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronDown, X, Check, FileText } from "lucide-react"
import { SERVICES_EHU } from "@/constants/services"

const CATEGORIE_OPTIONS = [
  { value: "", label: "Toutes les catégories" },
  { value: "pev", label: "PEV (Programme Élargi de Vaccination)" },
  { value: "mth", label: "MTH (Maladies Transmissibles Hydriques)" },
  { value: "zoonose", label: "Zoonoses" },
  { value: "ist", label: "IST / VIH" },
  { value: "vectorielle", label: "Maladies vectorielles" },
  { value: "nosocomiale", label: "Infections nosocomiales" },
  { value: "autre", label: "Autres maladies" },
]

const TYPES = [
  { value: "personnalise", label: "Personnalisé", desc: "Choisissez vos propres dates" },
  { value: "mensuel", label: "Mensuel", desc: "Un mois calendaire complet" },
  { value: "trimestriel", label: "Trimestriel", desc: "3 mois (T1, T2, T3, T4)" },
  { value: "semestriel", label: "Semestriel", desc: "6 mois (S1 ou S2)" },
  { value: "annuel", label: "Annuel", desc: "Année complète" },
]

const SERVICE_NAMES = SERVICES_EHU.map(s => s.nom)

interface Template {
  id: string
  titre: string
  type: string
  sections: string[]
  description: string
}

interface MaladieOption {
  id: string
  nom: string
  codeCim10: string
  groupeEpidemiologique: string | null
}

function MultiSelectServices({
  options,
  selected,
  onChange,
}: {
  options: string[]
  selected: string[]
  onChange: (v: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const toggle = (s: string) => {
    onChange(selected.includes(s) ? selected.filter(x => x !== s) : [...selected, s])
  }

  const label = selected.length === 0
    ? "Tous les services"
    : selected.length === 1
    ? selected[0]
    : `${selected.length} services sélectionnés`

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full h-10 px-3 flex items-center justify-between rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#1B4F8A] transition-colors"
      >
        <span className={selected.length === 0 ? "text-gray-400" : "text-gray-800"}>{label}</span>
        <ChevronDown size={14} className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selected.map(s => (
            <span key={s} className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-[#1B4F8A] text-xs rounded-md border border-blue-100">
              {s}
              <button type="button" onClick={() => toggle(s)} className="hover:text-blue-800">
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg py-1 max-h-56 overflow-y-auto">
          <button
            type="button"
            onClick={() => { onChange([]); setOpen(false) }}
            className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 border-b border-gray-100"
          >
            Tous les services (aucun filtre)
          </button>
          {options.map(s => (
            <label key={s} className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 cursor-pointer">
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                  selected.includes(s) ? "border-[#1B4F8A]" : "border-gray-300"
                }`}
                style={selected.includes(s) ? { backgroundColor: "#1B4F8A", borderColor: "#1B4F8A" } : {}}
                onClick={() => toggle(s)}
              >
                {selected.includes(s) && <Check size={10} className="text-white" />}
              </div>
              <span className="text-sm text-gray-700">{s}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

export default function GenerateRapportPage() {
  const router = useRouter()
  const [type, setType] = useState("mensuel")
  const [dateDebut, setDateDebut] = useState("")
  const [dateFin, setDateFin] = useState("")
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [serviceOptions, setServiceOptions] = useState<string[]>(SERVICE_NAMES)
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedModele, setSelectedModele] = useState<Template | null>(null)
  const [maladies, setMaladies] = useState<MaladieOption[]>([])
  const [maladieId, setMaladieId] = useState("")
  const [categorieGroupe, setCategorieGroupe] = useState("")
  const [maladieSearch, setMaladieSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Load templates, services, and maladies in parallel
    Promise.all([
      fetch("/api/rapport-modeles").then(r => r.json()),
      fetch("/api/rapports/services").then(r => r.json()),
      fetch("/api/maladies?limit=200&isActive=true").then(r => r.json()),
    ]).then(([modeleData, svcData, maladieData]) => {
      setTemplates((modeleData as { templates: Template[] }).templates ?? [])
      const fetched = (svcData as { services: string[] }).services ?? []
      if (fetched.length > 0) {
        // Merge any DB-sourced services with SERVICES_EHU, dedup
        const merged = Array.from(new Set([...SERVICE_NAMES, ...fetched]))
        setServiceOptions(merged)
      }
      const m = (maladieData as { maladies?: MaladieOption[]; data?: MaladieOption[] })
      setMaladies(m.maladies ?? m.data ?? (Array.isArray(maladieData) ? maladieData : []))
    }).catch(() => { /* use defaults silently */ })

    // Default to last month
    handleTypeChange("mensuel")
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  const selectModele = (t: Template | null) => {
    setSelectedModele(t)
    if (t && t.type !== "personnalise") {
      handleTypeChange(t.type)
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
        body: JSON.stringify({
          type,
          dateDebut,
          dateFin,
          services: selectedServices,
          modeleId: selectedModele?.id ?? null,
          maladieId: maladieId || null,
          categorieGroupe: categorieGroupe || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error ?? "Erreur lors de la génération")
      }
      const rapport = await res.json()
      router.push(`/rapports/${(rapport as { id: string }).id}`)
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

        {/* Template selector */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">
            Modèle de Rapport <span className="font-normal text-gray-400">(optionnel)</span>
          </h2>
          <p className="text-xs text-gray-400 mb-3">Sélectionner un modèle pré-configure le type et les sections à inclure</p>

          {templates.length === 0 ? (
            <p className="text-xs text-gray-400 italic">
              Aucun modèle disponible —{" "}
              <Link href="/rapports/modeles" className="text-[#1B4F8A] hover:underline">en créer un</Link>
            </p>
          ) : (
            <div className="space-y-2">
              {/* "Sans modèle" option */}
              <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedModele === null ? "border-[#1B4F8A] bg-blue-50" : "border-gray-100 hover:border-gray-200"
              }`}>
                <input
                  type="radio"
                  name="modele"
                  checked={selectedModele === null}
                  onChange={() => selectModele(null)}
                  className="accent-[#1B4F8A]"
                />
                <span className="text-sm text-gray-600">Sans modèle (configuration manuelle)</span>
              </label>

              {templates.map(t => (
                <label key={t.id} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedModele?.id === t.id ? "border-[#1B4F8A] bg-blue-50" : "border-gray-100 hover:border-gray-200"
                }`}>
                  <input
                    type="radio"
                    name="modele"
                    checked={selectedModele?.id === t.id}
                    onChange={() => selectModele(t)}
                    className="accent-[#1B4F8A] mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <FileText size={13} style={{ color: "#1B4F8A" }} />
                      <p className="text-sm font-medium text-gray-800">{t.titre}</p>
                      <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded capitalize">{t.type}</span>
                    </div>
                    {t.description && (
                      <p className="text-xs text-gray-500 mt-0.5">{t.description}</p>
                    )}
                    {t.sections.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {t.sections.slice(0, 4).map(s => (
                          <span key={s} className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded">{s}</span>
                        ))}
                        {t.sections.length > 4 && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-400 rounded">+{t.sections.length - 4}</span>
                        )}
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

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

        {/* Maladie + Category filters */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">
            Filtres Pathologie <span className="font-normal text-gray-400">(optionnel)</span>
          </h2>
          <p className="text-xs text-gray-400 mb-4">Limitez le rapport à une maladie ou catégorie spécifique</p>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Catégorie épidémiologique</label>
              <select
                value={categorieGroupe}
                onChange={e => { setCategorieGroupe(e.target.value); setMaladieId(""); setMaladieSearch("") }}
                className={inputCls}
              >
                {CATEGORIE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Maladie spécifique</label>
              <div className="space-y-1.5">
                <input
                  type="text"
                  placeholder="Rechercher une maladie..."
                  value={maladieSearch}
                  onChange={e => setMaladieSearch(e.target.value)}
                  className={inputCls}
                />
                <select
                  value={maladieId}
                  onChange={e => { setMaladieId(e.target.value); if (e.target.value) setCategorieGroupe("") }}
                  className={inputCls}
                >
                  <option value="">Toutes les maladies</option>
                  {maladies
                    .filter(m =>
                      !maladieSearch ||
                      m.nom.toLowerCase().includes(maladieSearch.toLowerCase()) ||
                      m.codeCim10.toLowerCase().includes(maladieSearch.toLowerCase())
                    )
                    .map(m => (
                      <option key={m.id} value={m.id}>{m.nom} ({m.codeCim10})</option>
                    ))
                  }
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Multi-select services */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">
            Filtre par Service <span className="font-normal text-gray-400">(optionnel)</span>
          </h2>
          <p className="text-xs text-gray-400 mb-3">Laissez vide pour inclure tous les services</p>
          <MultiSelectServices
            options={serviceOptions}
            selected={selectedServices}
            onChange={setSelectedServices}
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
