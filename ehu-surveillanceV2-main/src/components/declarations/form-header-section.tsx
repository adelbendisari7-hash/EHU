"use client"
import { useState, useEffect, useRef } from "react"
import { UseFormRegister, FieldErrors, UseFormSetValue, UseFormWatch } from "react-hook-form"
import { SERVICES_EHU } from "@/constants/services"
import { Search, ChevronDown, UserPlus } from "lucide-react"
import { cn } from "@/utils/cn"

interface MedecinDeclarant {
  id: string
  nom: string
  prenom: string
  service: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function FormHeaderSection({
  register,
  errors,
  setValue,
  watch,
}: {
  register: UseFormRegister<any>
  errors: FieldErrors
  setValue: UseFormSetValue<any>
  watch: UseFormWatch<any>
}) {
  const [medecins, setMedecins] = useState<MedecinDeclarant[]>([])
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [serviceOpen, setServiceOpen] = useState(false)
  const [serviceSearch, setServiceSearch] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const nomVal: string = watch("nomMedecinDeclarant") ?? ""
  const prenomVal: string = watch("prenomMedecinDeclarant") ?? ""
  const serviceVal: string = watch("serviceDeclarant") ?? ""

  useEffect(() => {
    fetch("/api/medecins-declarants")
      .then(r => r.json())
      .then(setMedecins)
      .catch(() => {})
  }, [])

  // Suggestions filtered by query (name or firstname)
  const suggestions = query.length >= 2
    ? medecins.filter(m =>
        `${m.nom} ${m.prenom}`.toLowerCase().includes(query.toLowerCase()) ||
        `${m.prenom} ${m.nom}`.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : []

  const selectMedecin = (m: MedecinDeclarant) => {
    setValue("medecinDeclarantId", m.id)
    setValue("nomMedecinDeclarant", m.nom)
    setValue("prenomMedecinDeclarant", m.prenom)
    setValue("serviceDeclarant", m.service)
    setQuery(`${m.prenom} ${m.nom}`)
    setOpen(false)
  }

  const clearSelection = () => {
    setValue("medecinDeclarantId", "")
    setValue("nomMedecinDeclarant", "")
    setValue("prenomMedecinDeclarant", "")
    setQuery("")
    setOpen(false)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const filteredServices = SERVICES_EHU.filter(s =>
    s.nom.toLowerCase().includes(serviceSearch.toLowerCase())
  )

  const hasErrors = errors.nomMedecinDeclarant || errors.prenomMedecinDeclarant || errors.serviceDeclarant

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

          {/* Médecin déclarant — autocomplete */}
          <div className="md:col-span-2">
            <label className="label">
              Médecin déclarant <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              {/* If nom/prenom already filled, show as a tag */}
              {nomVal && prenomVal ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#1B4F8A] bg-[#EBF1FA]">
                  <UserPlus size={14} className="text-[#1B4F8A] shrink-0" />
                  <span className="flex-1 text-sm font-medium text-[#1B4F8A]">
                    Dr {prenomVal} {nomVal}
                  </span>
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="text-[#1B4F8A] hover:text-blue-900 text-xs underline"
                  >
                    Modifier
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      ref={inputRef}
                      type="text"
                      value={query}
                      onChange={e => { setQuery(e.target.value); setOpen(true) }}
                      onFocus={() => setOpen(true)}
                      placeholder="Rechercher ou saisir le nom du médecin..."
                      className={cn("input w-full pl-9", hasErrors && "input-error")}
                    />
                  </div>
                  {open && query.length >= 2 && (
                    <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
                      {suggestions.length > 0 ? (
                        <>
                          {suggestions.map(m => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => selectMedecin(m)}
                              className="w-full text-left px-3 py-2.5 hover:bg-gray-50 border-b border-gray-50 last:border-0"
                            >
                              <p className="text-sm font-medium text-gray-800">Dr {m.prenom} {m.nom}</p>
                              <p className="text-xs text-gray-400">{m.service}</p>
                            </button>
                          ))}
                          <div className="px-3 py-2 border-t border-gray-100 bg-gray-50">
                            <p className="text-[11px] text-gray-400">Ou saisissez les informations ci-dessous pour un nouveau médecin</p>
                          </div>
                        </>
                      ) : (
                        <div className="px-3 py-2.5 bg-amber-50 border-b border-amber-100">
                          <p className="text-xs text-amber-700">Médecin non trouvé — remplissez nom, prénom et service ci-dessous</p>
                        </div>
                      )}
                    </div>
                  )}
                  {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
                </>
              )}
            </div>

            {/* Manual entry fields when not selected from list */}
            {!nomVal && !prenomVal && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <input
                    {...register("prenomMedecinDeclarant")}
                    placeholder="Prénom *"
                    className={cn("input w-full text-sm", errors.prenomMedecinDeclarant && "input-error")}
                  />
                  {errors.prenomMedecinDeclarant && (
                    <p className="text-xs text-red-500 mt-1">{String(errors.prenomMedecinDeclarant.message)}</p>
                  )}
                </div>
                <div>
                  <input
                    {...register("nomMedecinDeclarant")}
                    placeholder="Nom *"
                    className={cn("input w-full text-sm", errors.nomMedecinDeclarant && "input-error")}
                  />
                  {errors.nomMedecinDeclarant && (
                    <p className="text-xs text-red-500 mt-1">{String(errors.nomMedecinDeclarant.message)}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Service déclarant — searchable dropdown */}
          <div>
            <label className="label">
              Service déclarant <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setServiceOpen(!serviceOpen)}
                className={cn(
                  "input w-full text-left flex items-center justify-between",
                  errors.serviceDeclarant && "input-error"
                )}
              >
                <span className={serviceVal ? "text-gray-900 text-sm truncate" : "text-gray-400 text-sm"}>
                  {serviceVal || "Sélectionner un service..."}
                </span>
                <ChevronDown size={14} className="text-gray-400 shrink-0 ml-2" />
              </button>
              {serviceOpen && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-hidden">
                  <div className="p-2 border-b border-gray-100">
                    <div className="relative">
                      <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={serviceSearch}
                        onChange={e => setServiceSearch(e.target.value)}
                        placeholder="Rechercher un service..."
                        className="input w-full pl-8 text-sm"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="overflow-y-auto max-h-48">
                    {filteredServices.length === 0 ? (
                      <p className="p-3 text-sm text-gray-400 text-center">Aucun résultat</p>
                    ) : (
                      filteredServices.map(s => (
                        <button
                          key={s.code}
                          type="button"
                          onClick={() => {
                            setValue("serviceDeclarant", s.nom)
                            setServiceOpen(false)
                            setServiceSearch("")
                          }}
                          className={cn(
                            "w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0",
                            serviceVal === s.nom && "bg-blue-50 text-[#1B4F8A] font-medium"
                          )}
                        >
                          {s.nom}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
              {serviceOpen && <div className="fixed inset-0 z-40" onClick={() => { setServiceOpen(false); setServiceSearch("") }} />}
            </div>
            {errors.serviceDeclarant && (
              <p className="text-xs text-red-500 mt-1">{String(errors.serviceDeclarant.message)}</p>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
