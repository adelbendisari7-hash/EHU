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
  const [medecinsLoaded, setMedecinsLoaded] = useState(false)
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [serviceOpen, setServiceOpen] = useState(false)
  const [serviceSearch, setServiceSearch] = useState("")

  const serviceButtonRef = useRef<HTMLButtonElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [serviceRect, setServiceRect] = useState<DOMRect | null>(null)
  const [searchRect, setSearchRect] = useState<DOMRect | null>(null)

  const medecinIdVal: string = watch("medecinDeclarantId") ?? ""
  const prenomVal: string = watch("prenomMedecinDeclarant") ?? ""
  const nomVal: string = watch("nomMedecinDeclarant") ?? ""
  const serviceVal: string = watch("serviceDeclarant") ?? ""

  const loadMedecins = () => {
    if (medecinsLoaded) return
    setMedecinsLoaded(true)
    fetch("/api/medecins-declarants")
      .then(r => r.json())
      .then(setMedecins)
      .catch(() => {})
  }

  const suggestions = query.length >= 2
    ? medecins.filter(m =>
        `${m.nom} ${m.prenom}`.toLowerCase().includes(query.toLowerCase()) ||
        `${m.prenom} ${m.nom}`.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : []

  const filteredServices = SERVICES_EHU.filter(s =>
    s.nom.toLowerCase().includes(serviceSearch.toLowerCase())
  )

  const selectMedecin = (m: MedecinDeclarant) => {
    setValue("medecinDeclarantId", m.id)
    setValue("nomMedecinDeclarant", m.nom)
    setValue("prenomMedecinDeclarant", m.prenom)
    setValue("serviceDeclarant", m.service)
    setQuery(`${m.prenom} ${m.nom}`)
    setOpen(false)
  }

  // Parse "prenom nom" from query for new doctor creation
  const queryParts = query.trim().split(/\s+/)
  const canCreate = queryParts.length >= 2 && queryParts[0].length >= 1 && queryParts[1].length >= 1
  const createPrenom = queryParts[0] ?? ""
  const createNom = queryParts.slice(1).join(" ") || ""

  const createMedecin = () => {
    setValue("medecinDeclarantId", "")
    setValue("prenomMedecinDeclarant", createPrenom)
    setValue("nomMedecinDeclarant", createNom)
    setOpen(false)
  }

  const clearSelection = () => {
    setValue("medecinDeclarantId", "")
    setValue("nomMedecinDeclarant", "")
    setValue("prenomMedecinDeclarant", "")
    setValue("serviceDeclarant", "")
    setQuery("")
    setOpen(false)
    setTimeout(() => searchInputRef.current?.focus(), 50)
  }

  const openSearchDropdown = () => {
    if (searchInputRef.current) {
      setSearchRect(searchInputRef.current.getBoundingClientRect())
    }
    setOpen(true)
  }

  const openServiceDropdown = () => {
    if (serviceButtonRef.current) {
      setServiceRect(serviceButtonRef.current.getBoundingClientRect())
    }
    setServiceOpen(v => !v)
  }

  // Doctor is "confirmed" if picked from DB or created via "Créer"
  const isDoctorConfirmed = !!(medecinIdVal || (nomVal.length >= 2 && prenomVal.length >= 2))
  const isNewDoctor = !medecinIdVal && isDoctorConfirmed

  const hasErrors = errors.nomMedecinDeclarant || errors.prenomMedecinDeclarant || errors.serviceDeclarant

  // Sync query display when form is pre-filled (edit mode)
  useEffect(() => {
    if (prenomVal && nomVal && !query) {
      setQuery(`${prenomVal} ${nomVal}`)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prenomVal, nomVal])

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

          {/* ── Médecin déclarant ──────────────────────────────────────── */}
          <div className="md:col-span-2">
            <label className="label">
              Médecin déclarant <span className="text-red-500">*</span>
            </label>

            {/* Hidden inputs — hold values for form validation & submission */}
            <input type="hidden" {...register("nomMedecinDeclarant")} />
            <input type="hidden" {...register("prenomMedecinDeclarant")} />

            {isDoctorConfirmed ? (
              <div className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg border",
                isNewDoctor ? "border-amber-300 bg-amber-50" : "border-[#1B4F8A] bg-[#EBF1FA]"
              )}>
                <UserPlus size={14} className={cn("shrink-0", isNewDoctor ? "text-amber-600" : "text-[#1B4F8A]")} />
                <span className={cn("flex-1 text-sm font-medium", isNewDoctor ? "text-amber-800" : "text-[#1B4F8A]")}>
                  Dr {prenomVal} {nomVal}
                  {isNewDoctor && (
                    <span className="ml-2 text-[11px] font-normal opacity-70">(sera enregistré)</span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={clearSelection}
                  className={cn("text-xs underline shrink-0", isNewDoctor ? "text-amber-600 hover:text-amber-800" : "text-[#1B4F8A] hover:text-blue-900")}
                >
                  Modifier
                </button>
              </div>
            ) : (
              <>
                {/* Search input — only this, no manual nom/prenom fields */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={query}
                    onChange={e => { setQuery(e.target.value); openSearchDropdown() }}
                    onFocus={() => { loadMedecins(); openSearchDropdown() }}
                    placeholder="Rechercher le médecin déclarant..."
                    className={cn("input w-full pl-9", hasErrors && "input-error")}
                  />
                </div>

                {/* Suggestions dropdown — position:fixed bypasses overflow:hidden */}
                {open && query.length >= 2 && searchRect && (
                  <div
                    className="fixed z-[9999] bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                    style={{ top: searchRect.bottom + 4, left: searchRect.left, width: searchRect.width }}
                  >
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

                    {/* Create new doctor option */}
                    {canCreate && (
                      <button
                        type="button"
                        onClick={createMedecin}
                        className="w-full text-left px-3 py-2.5 bg-blue-50 hover:bg-blue-100 border-t border-blue-100"
                      >
                        <div className="flex items-center gap-2">
                          <UserPlus size={13} className="text-blue-600 shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-blue-700">Créer : Dr {createPrenom} {createNom}</p>
                            <p className="text-[11px] text-blue-500">Ce médecin sera enregistré à la soumission</p>
                          </div>
                        </div>
                      </button>
                    )}

                    {suggestions.length === 0 && !canCreate && (
                      <div className="px-3 py-2.5 text-center">
                        <p className="text-xs text-gray-400">Saisissez prénom et nom (ex: Ahmed Benali) pour créer</p>
                      </div>
                    )}
                  </div>
                )}
                {open && <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />}
              </>
            )}

            {hasErrors && (
              <p className="text-xs text-red-500 mt-1">Médecin déclarant requis</p>
            )}
          </div>

          {/* ── Service déclarant ──────────────────────────────────────── */}
          <div>
            <label className="label">
              Service déclarant <span className="text-red-500">*</span>
            </label>
            <div>
              <button
                ref={serviceButtonRef}
                type="button"
                onClick={openServiceDropdown}
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

              {serviceOpen && serviceRect && (
                <div
                  className="fixed z-[9999] bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
                  style={{ top: serviceRect.bottom + 4, left: serviceRect.left, width: serviceRect.width, maxHeight: "260px" }}
                >
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
                  <div className="overflow-y-auto" style={{ maxHeight: "200px" }}>
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
              {serviceOpen && <div className="fixed inset-0 z-[9998]" onClick={() => { setServiceOpen(false); setServiceSearch("") }} />}
            </div>
            {errors.serviceDeclarant && (
              <p className="text-xs text-red-500 mt-1">{String(errors.serviceDeclarant.message)}</p>
            )}
          </div>

          {/* ── Date de déclaration ─────────────────────────────────────── */}
          <div>
            <label className="label">Date de déclaration</label>
            <input {...register("dateDeclaration")} type="date" className="input w-full" />
          </div>

        </div>
      </div>
    </div>
  )
}
