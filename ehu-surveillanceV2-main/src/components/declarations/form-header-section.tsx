"use client"
import { UseFormRegister, FieldErrors } from "react-hook-form"

const MOIS = [
  { value: 1, label: "Janvier" }, { value: 2, label: "Février" }, { value: 3, label: "Mars" },
  { value: 4, label: "Avril" }, { value: 5, label: "Mai" }, { value: 6, label: "Juin" },
  { value: 7, label: "Juillet" }, { value: 8, label: "Août" }, { value: 9, label: "Septembre" },
  { value: 10, label: "Octobre" }, { value: 11, label: "Novembre" }, { value: 12, label: "Décembre" },
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function FormHeaderSection({ register, errors }: { register: UseFormRegister<any>; errors: FieldErrors }) {
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

  return (
    <div className="card">
      <div className="px-5 py-3 flex items-center gap-3 border-b border-gray-100" style={{ backgroundColor: "var(--gray-50)" }}>
        <span className="w-6 h-6 rounded-md text-white text-[11px] font-bold flex items-center justify-center shrink-0 bg-gray-400">
          H
        </span>
        <h2 className="text-[13px] font-semibold text-gray-800">En-tête de déclaration</h2>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">Service déclarant</label>
            <input
              {...register("serviceDeclarant")}
              className="input w-full"
              placeholder="Ex: Maladies infectieuses"
            />
            {errors.serviceDeclarant && <p className="text-red-500 text-[11px] mt-1">{String(errors.serviceDeclarant.message)}</p>}
          </div>
          <div>
            <label className="label">Mois</label>
            <select {...register("moisDeclaration", { valueAsNumber: true })} className="input w-full">
              <option value="">-- Sélectionner --</option>
              {MOIS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Année</label>
            <select {...register("anneeDeclaration", { valueAsNumber: true })} className="input w-full">
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
