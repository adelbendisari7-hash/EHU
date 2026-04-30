"use client"

import { useState, useRef, useEffect } from "react"
import { Search, ChevronDown, X } from "lucide-react"
import { cn } from "@/utils/cn"



interface Maladie { id: string; nom: string }
interface Commune { id: string; nom: string; wilayadId?: string }
interface Wilaya { id: string; nom: string; code: string }

export interface DashboardFiltersState {
  days: string
  dateDebut: string
  dateFin: string
  maladieIds: string[]
  wilayadIds: string[]
  communeId: string
}

interface Props {
  maladies: Maladie[]
  communes: Commune[]
  wilayas: Wilaya[]
  filters: DashboardFiltersState
  onChange: (filters: DashboardFiltersState) => void
}

// Generic multi-select searchable component
function MultiSelect({
  options,
  selected,
  onChange,
  placeholder,
  width = "min-w-[160px]",
}: {
  options: { value: string; label: string }[]
  selected: string[]
  onChange: (vals: string[]) => void
  placeholder: string
  width?: string
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)

  const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
  const toggle = (val: string) => {
    if (selected.includes(val)) {
      onChange(selected.filter(v => v !== val))
    } else {
      onChange([...selected, val])
    }
  }

  const label = selected.length === 0
    ? placeholder
    : selected.length === 1
      ? options.find(o => o.value === selected[0])?.label ?? placeholder
      : `${selected.length} sélectionnés`

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  return (
    <div ref={containerRef} className={cn("relative", width)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "input h-[30px] text-[11px] font-medium w-full flex items-center justify-between gap-1",
          selected.length > 0 && "border-[#1B4F8A]"
        )}
        style={{ paddingRight: "8px" }}
      >
        <span className={cn("truncate", selected.length > 0 ? "text-gray-900" : "text-gray-500")}>{label}</span>
        <div className="flex items-center gap-1 shrink-0">
          {selected.length > 0 && (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onChange([]); }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={10} />
            </button>
          )}
          <ChevronDown size={11} className="text-gray-400" />
        </div>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden" style={{ minWidth: "200px" }}>
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher..."
                className="input w-full pl-7 h-7 text-[12px]"
                autoFocus
              />
            </div>
          </div>
          {selected.length > 0 && (
            <div className="px-3 py-1.5 border-b border-gray-100 flex flex-wrap gap-1">
              {selected.map(v => {
                const opt = options.find(o => o.value === v)
                if (!opt) return null
                return (
                  <span key={v} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-blue-50 text-blue-700 border border-blue-200">
                    {opt.label}
                    <button type="button" onClick={() => toggle(v)}><X size={10} /></button>
                  </span>
                )
              })}
            </div>
          )}
          <div className="overflow-y-auto max-h-48">
            {filtered.length === 0 ? (
              <p className="p-3 text-[12px] text-gray-400 text-center">Aucun résultat</p>
            ) : (
              filtered.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggle(opt.value)}
                  className={cn(
                    "w-full text-left px-3 py-2 text-[12px] hover:bg-gray-50 transition-colors flex items-center gap-2 border-b border-gray-50 last:border-0",
                    selected.includes(opt.value) && "bg-blue-50 text-blue-700"
                  )}
                >
                  <span className={cn("w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0",
                    selected.includes(opt.value) ? "bg-[#1B4F8A] border-[#1B4F8A]" : "border-gray-300")}>
                    {selected.includes(opt.value) && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  {opt.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function DashboardFilters({ maladies, communes, wilayas, filters, onChange }: Props) {
  // Filter communes by selected wilayas
  const filteredCommunes = filters.wilayadIds.length > 0
    ? communes.filter(c => c.wilayadId && filters.wilayadIds.includes(c.wilayadId))
    : communes

  return (
    <div className="flex gap-2 flex-wrap items-center">
      {/* Period quick-select */}
      <div className="flex rounded-lg border border-gray-200 overflow-hidden">
        {[
          { value: "7", label: "7j" },
          { value: "30", label: "30j" },
          { value: "90", label: "90j" },
          { value: "365", label: "1an" },
        ].map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange({ ...filters, days: opt.value, dateDebut: "", dateFin: "" })}
            className={`px-3 h-[30px] text-[11px] font-semibold transition-all border-r border-gray-200 last:border-r-0 ${
              filters.days === opt.value && !filters.dateDebut && !filters.dateFin
                ? "bg-[#1B4F8A] text-white"
                : "bg-white text-gray-500 hover:bg-gray-50"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Custom date range */}
      <div className="flex items-center gap-1">
        <input
          type="date"
          value={filters.dateDebut}
          onChange={e => onChange({ ...filters, dateDebut: e.target.value })}
          className={cn(
            "input h-[30px] text-[11px] font-medium w-32",
            (filters.dateDebut || filters.dateFin) && "border-[#1B4F8A]"
          )}
          title="Date début"
        />
        <span className="text-gray-400 text-xs">→</span>
        <input
          type="date"
          value={filters.dateFin}
          onChange={e => onChange({ ...filters, dateFin: e.target.value })}
          className={cn(
            "input h-[30px] text-[11px] font-medium w-32",
            (filters.dateDebut || filters.dateFin) && "border-[#1B4F8A]"
          )}
          title="Date fin"
        />
        {(filters.dateDebut || filters.dateFin) && (
          <button
            type="button"
            onClick={() => onChange({ ...filters, dateDebut: "", dateFin: "" })}
            className="text-gray-400 hover:text-gray-600"
            title="Réinitialiser dates"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Wilayas multi-select */}
      <MultiSelect
        options={wilayas.map(w => ({ value: w.id, label: w.nom }))}
        selected={filters.wilayadIds}
        onChange={wilayadIds => onChange({ ...filters, wilayadIds, communeId: "" })}
        placeholder="Toutes wilayas"
        width="min-w-[150px]"
      />

      {/* Communes filtered by wilaya */}
      <select
        value={filters.communeId}
        onChange={e => onChange({ ...filters, communeId: e.target.value })}
        className="input h-[30px] text-[11px] font-medium w-auto min-w-[140px]"
        style={{ paddingRight: "28px" }}
      >
        <option value="">Toutes communes</option>
        {filteredCommunes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
      </select>

      {/* Maladies multi-select */}
      <MultiSelect
        options={maladies.map(m => ({ value: m.id, label: m.nom }))}
        selected={filters.maladieIds}
        onChange={maladieIds => onChange({ ...filters, maladieIds })}
        placeholder="Toutes maladies"
        width="min-w-[150px]"
      />
    </div>
  )
}
