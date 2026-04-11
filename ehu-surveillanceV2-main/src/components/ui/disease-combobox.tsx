"use client"
import { useState, useMemo, useRef, useEffect } from "react"
import { Search, ChevronDown, X, Check } from "lucide-react"

interface Maladie {
  id: string
  nom: string
  codeCim10: string
  categorie: string
  nomCourt?: string | null
  hasFicheSpecifique: boolean
  ficheSpecifiqueSlug?: string | null
}

interface GroupedMaladies {
  categorie_1_mdo: Maladie[]
  categorie_2_epidemique: Maladie[]
  categorie_3_bmr: Maladie[]
}

const CATEGORY_LABELS: Record<string, string> = {
  categorie_1_mdo: "Cat. 1 — Maladies à Déclaration Obligatoire",
  categorie_2_epidemique: "Cat. 2 — Potentiel Épidémique",
  categorie_3_bmr: "Cat. 3 — Agents BMR",
}

const CATEGORY_COLORS: Record<string, { text: string; bg: string }> = {
  categorie_1_mdo: { text: "#1B4F8A", bg: "#EBF1FA" },
  categorie_2_epidemique: { text: "#D97706", bg: "#FFFBEB" },
  categorie_3_bmr: { text: "#7C3AED", bg: "#F5F0FF" },
}

interface DiseaseComboboxProps {
  grouped: GroupedMaladies
  value: string
  onChange: (id: string, maladie?: Maladie) => void
  error?: string
}

export default function DiseaseCombobox({ grouped, value, onChange, error }: DiseaseComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)

  const allMaladies = useMemo(() => [
    ...grouped.categorie_1_mdo,
    ...grouped.categorie_2_epidemique,
    ...grouped.categorie_3_bmr,
  ], [grouped])

  const selected = allMaladies.find((m) => m.id === value)

  const filtered = useMemo(() => {
    if (!search.trim()) return grouped
    const q = search.toLowerCase()
    const filter = (list: Maladie[]) =>
      list.filter((m) => m.nom.toLowerCase().includes(q) || m.codeCim10.toLowerCase().includes(q))
    return {
      categorie_1_mdo: filter(grouped.categorie_1_mdo),
      categorie_2_epidemique: filter(grouped.categorie_2_epidemique),
      categorie_3_bmr: filter(grouped.categorie_3_bmr),
    }
  }, [search, grouped])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const select = (m: Maladie) => {
    onChange(m.id, m)
    setOpen(false)
    setSearch("")
  }

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange("", undefined)
  }

  const hasResults = Object.values(filtered).some((list) => list.length > 0)

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`input w-full flex items-center justify-between text-left ${error ? "input-error" : ""}`}
      >
        {selected ? (
          <span className="flex items-center gap-2 flex-1 min-w-0">
            <span className="truncate text-[13px]">{selected.nom}</span>
            <span className="text-[11px] text-gray-400 shrink-0 text-mono">({selected.codeCim10})</span>
          </span>
        ) : (
          <span className="text-gray-400 text-[13px]">Rechercher une maladie...</span>
        )}
        <span className="flex items-center gap-1 ml-2 shrink-0">
          {selected && (
            <span onClick={clear} className="hover:text-red-500 p-0.5 transition-colors">
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </span>
      </button>

      {open && (
        <div className="animate-scale-in absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col" style={{ boxShadow: "var(--shadow-lg)", maxHeight: "320px" }}>
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input w-full pl-8 h-[32px] text-[12px]"
                placeholder="Nom ou code CIM-10..."
              />
            </div>
          </div>
          <div className="overflow-y-auto flex-1">
            {!hasResults && (
              <p className="text-[13px] text-gray-400 text-center py-6">Aucune maladie trouvée</p>
            )}
            {(Object.entries(filtered) as [string, Maladie[]][]).map(([cat, list]) => {
              if (list.length === 0) return null
              const colors = CATEGORY_COLORS[cat]
              return (
                <div key={cat}>
                  <div
                    className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.05em] sticky top-0"
                    style={{ backgroundColor: colors.bg, color: colors.text }}
                  >
                    {CATEGORY_LABELS[cat]}
                  </div>
                  {list.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => select(m)}
                      className={`w-full text-left px-3 py-2 text-[13px] hover:bg-gray-50 flex items-center justify-between gap-2 transition-colors ${
                        m.id === value ? "bg-blue-50" : ""
                      }`}
                    >
                      <span className="flex-1 min-w-0">
                        <span className="block truncate text-gray-700">{m.nom}</span>
                        {m.hasFicheSpecifique && (
                          <span className="text-[10px] text-green-600 font-medium">+ Fiche spécifique</span>
                        )}
                      </span>
                      <span className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[11px] text-gray-400 text-mono">{m.codeCim10}</span>
                        {m.id === value && <Check size={13} className="text-blue-600" />}
                      </span>
                    </button>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      )}
      {error && <p className="text-red-500 text-[11px] mt-1">{error}</p>}
    </div>
  )
}
