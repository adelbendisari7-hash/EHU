"use client"

interface Maladie { id: string; nom: string }
interface Commune { id: string; nom: string }

interface Props {
  maladies: Maladie[]
  communes: Commune[]
  filters: { maladieId: string; communeId: string; days: string }
  onChange: (filters: { maladieId: string; communeId: string; days: string }) => void
}

export default function DashboardFilters({ maladies, communes, filters, onChange }: Props) {
  return (
    <div className="flex gap-2 flex-wrap">
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
            onClick={() => onChange({ ...filters, days: opt.value })}
            className={`px-3 h-[30px] text-[11px] font-semibold transition-all border-r border-gray-200 last:border-r-0 ${
              filters.days === opt.value
                ? "bg-[#1B4F8A] text-white"
                : "bg-white text-gray-500 hover:bg-gray-50"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <select
        value={filters.maladieId}
        onChange={e => onChange({ ...filters, maladieId: e.target.value })}
        className="input h-[30px] text-[11px] font-medium w-auto min-w-[140px]"
        style={{ paddingRight: "28px" }}
      >
        <option value="">Toutes maladies</option>
        {maladies.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
      </select>

      <select
        value={filters.communeId}
        onChange={e => onChange({ ...filters, communeId: e.target.value })}
        className="input h-[30px] text-[11px] font-medium w-auto min-w-[140px]"
        style={{ paddingRight: "28px" }}
      >
        <option value="">Toutes communes</option>
        {communes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
      </select>
    </div>
  )
}
