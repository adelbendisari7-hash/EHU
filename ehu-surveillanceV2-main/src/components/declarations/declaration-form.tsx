"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { cn } from "@/utils/cn"
import ProtocoleAlertModal from "@/components/protocoles/protocole-alert-modal"
import DiseaseCombobox from "@/components/ui/disease-combobox"
import FormHeaderSection from "@/components/declarations/form-header-section"
import FicheDynamiqueRenderer from "@/components/declarations/fiche-dynamique-renderer"
import { toast } from "sonner"
import { AlertCircle, CheckCircle2, Loader2, Plus, X, Search, ChevronDown, FileText } from "lucide-react"
import { NATIONALITIES } from "@/constants/nationalities"
import { SYMPTOM_CATEGORIES } from "@/constants/symptoms"
import { SAMPLE_TYPES } from "@/constants/sample-types"
import { LIEU_TYPES } from "@/constants/lieu-types"

// ---------------------------------------------------------------------------
// Zod Schema
// ---------------------------------------------------------------------------
function optNum(min: number, max: number) {
  return z.union([
    z.number().refine(n => !isNaN(n)).pipe(z.number().min(min).max(max)),
    z.nan().transform(() => undefined),
  ]).optional()
}
function optInt() {
  return z.union([
    z.number().refine(n => !isNaN(n)).pipe(z.number().int()),
    z.nan().transform(() => undefined),
  ]).optional()
}

const declarationSchema = z.object({
  // Header — médecin déclarant
  medecinDeclarantId: z.string().optional(),
  nomMedecinDeclarant: z.string().min(2, "Nom du médecin requis"),
  prenomMedecinDeclarant: z.string().min(2, "Prénom du médecin requis"),
  serviceDeclarant: z.string().min(1, "Service déclarant requis"),
  // kept for DB compat but not shown in UI
  moisDeclaration: optInt(),
  anneeDeclaration: optInt(),

  // Section 1 — Informations Administratives
  dateDeclaration: z.string().optional(),
  firstName: z.string().min(2, "Minimum 2 caractères"),
  lastName: z.string().min(2, "Minimum 2 caractères"),
  nin: z.string().max(18).optional(),
  dateOfBirth: z.string().optional(),
  ageAns: optNum(0, 150),
  ageMois: optNum(0, 11),
  ageJours: optNum(0, 30),
  sex: z.enum(["homme", "femme"], { message: "Sexe requis" }),
  address: z.string().min(2, "Adresse requise"),
  wilayadId: z.string().optional(),
  communeId: z.string().optional(),
  phone: z.string().optional(),
  emailPatient: z.string().email("Email invalide").optional().or(z.literal("")),
  profession: z.string().optional(),
  lieuTravail: z.string().optional(),
  estEtranger: z.boolean().optional(),
  nationalite: z.string().optional(),
  nationaliteCode: z.string().optional(),

  // Section 2 — Données Cliniques
  maladieId: z.string().min(1, "Maladie requise"),
  dateDebutSymptomes: z.string().optional(),
  dateDiagnostic: z.string().optional(),
  symptomesTexte: z.string().optional(),
  observation: z.enum(["cas_confirme", "cas_suspect"]).optional(),
  modeConfirmation: z.enum(["clinique", "biologique", "epidemiologique"]).optional(),
  atcd: z.string().optional(),
  casSimilaire: z.boolean().optional(),
  casSimilaireId: z.string().optional(),

  // Hospitalisation & Evacuation
  estHospitalise: z.boolean().optional(),
  dateHospitalisation: z.string().optional(),
  structureHospitalisationId: z.string().optional(),
  serviceHospitalisation: z.string().optional(),
  estEvacue: z.boolean().optional(),
  dateEvacuation: z.string().optional(),
  structureEvacuation: z.string().optional(),

  // Evolution
  evolution: z.enum(["guerison", "en_cours_guerison", "sortant", "toujours_malade", "autre", "deces"]).optional(),
  dateSortie: z.string().optional(),
  dateDeces: z.string().optional(),

  etablissementId: z.string().optional(),
  service: z.string().optional(),
  notesCliniques: z.string().optional(),
  resultatLabo: z.string().optional(),
})

// Brouillon schema — only the bare minimum
const brouillonSchema = declarationSchema.partial().extend({
  maladieId: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  sex: z.enum(["homme", "femme"]).optional(),
  address: z.string().optional(),
  nomMedecinDeclarant: z.string().optional(),
  prenomMedecinDeclarant: z.string().optional(),
  serviceDeclarant: z.string().optional(),
})

type DeclarationFormData = z.infer<typeof declarationSchema>

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
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

interface Wilaya { id: string; nom: string; code: string }
interface Commune { id: string; nom: string; wilayadId: string }
interface Etablissement { id: string; nom: string }
interface SymptomeRef { id: string; nom: string; code: string; categorie: string | null }
interface GermeRef { id: string; nom: string; code: string; type: string | null }
interface CasSearchResult {
  id: string
  codeCas: string
  statut: string
  createdAt: string
  maladie: { nom: string; codeCim10: string }
  patient: { firstName: string; lastName: string }
}

interface LieuEntry {
  nom: string
  type: string
  adresse: string
  communeId: string
  dateDebut: string
  dateFin: string
}

interface ResultatLaboEntry {
  typePrelevement: string
  datePrelevement: string
  germeId: string
  resultat: string
  antibiogramme: string
  laboratoire: string
  notes: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function toDateStr(val: string | null | undefined): string {
  if (!val) return ""
  try { return new Date(val).toISOString().slice(0, 10) } catch { return "" }
}

// Strip diacritics for accent-insensitive matching
function stripAccents(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "")
}

function getRelevantSymptomCategories(maladieName: string, codeCim10?: string): string[] {
  if (!maladieName) return []
  // Strip accents so "typhoïde" matches "typho", "méningite" matches "meningit", etc.
  const name = stripAccents(maladieName.toLowerCase())
  const code = (codeCim10 ?? "").toUpperCase()
  const cats = new Set<string>()

  // ── By CIM-10 code prefix (most reliable) ──────────────────────────────
  if (/^J/.test(code))                      { cats.add("general"); cats.add("respiratoire"); cats.add("orl") }
  if (/^A0[0-9]/.test(code))               { cats.add("general"); cats.add("digestif") }        // diarrhées / entérites
  if (/^A1[5-9]/.test(code))               { cats.add("general"); cats.add("respiratoire") }     // tuberculose
  if (/^A2[0-9]/.test(code))               { cats.add("general"); cats.add("musculosquelettique") } // zoonoses
  if (/^A3[3-7]/.test(code))               { cats.add("general"); cats.add("neurologique") }     // tétanos, coqueluche
  if (/^A7[5-9]/.test(code))               { cats.add("general"); cats.add("cutane"); cats.add("neurologique") } // rickettsioses
  if (/^A8[0-9]/.test(code))               { cats.add("general"); cats.add("neurologique") }     // infections virales SNC
  if (/^A9[0-9]/.test(code))               { cats.add("general"); cats.add("cutane") }           // arbovirus / dengue
  if (/^B0[0-9]/.test(code))               { cats.add("general"); cats.add("cutane") }           // infections virales cutanées
  if (/^B1[5-9]/.test(code))               { cats.add("general"); cats.add("digestif") }         // hépatites virales
  if (/^B5[0-9]|^B6[0-4]/.test(code))     { cats.add("general"); cats.add("cutane"); cats.add("neurologique") } // paludisme / leishmanios
  if (/^G0[0-9]/.test(code))               { cats.add("general"); cats.add("neurologique") }     // méningites
  if (/^H1[0-9]/.test(code))               { cats.add("general"); cats.add("ophtalmologique") }  // maladies oculaires
  if (/^[IN]/.test(code))                  { cats.add("general"); cats.add("cardiovasculaire") }
  if (/^M/.test(code))                     { cats.add("general"); cats.add("musculosquelettique") }
  if (/^N/.test(code))                     { cats.add("general"); cats.add("urinaire") }

  // ── By name (accent-stripped, so one pattern covers accented + non-accented) ──
  if (/respirat|pneumon|tubercul|grippe|covid|coqueluche|bronchit|pleur|emphys/.test(name)) {
    cats.add("general"); cats.add("respiratoire"); cats.add("orl")
  }
  if (/diarrhee|gastro|intestin|cholera|typho|salmonell|dysenter|hepatit|ictere/.test(name)) {
    cats.add("general"); cats.add("digestif")
  }
  if (/meningit|encephal|tetanos|polio|paralys|rage/.test(name)) {
    cats.add("general"); cats.add("neurologique")
  }
  if (/rougeol|varicell|variole|rubeo|scarlatine|lepre|gale|teigne/.test(name)) {
    cats.add("general"); cats.add("cutane")
  }
  if (/paludism|malaria|dengue|arbovirus|leishmani|fievre jaune|ricketts|chikungunya/.test(name)) {
    cats.add("general"); cats.add("cutane"); cats.add("neurologique")
  }
  if (/urinair|itu|pyelon|cystit/.test(name)) {
    cats.add("general"); cats.add("urinaire")
  }
  if (/arthrit|rhumat|osteo|brucell/.test(name)) {
    cats.add("general"); cats.add("musculosquelettique")
  }
  if (/angine|pharyngit|sinusit|amygdalit/.test(name)) {
    cats.add("general"); cats.add("orl")
  }
  if (/conjonctiv/.test(name)) {
    cats.add("general"); cats.add("ophtalmologique")
  }
  if (/cardio|endocardit|myocardit|pericardi/.test(name)) {
    cats.add("general"); cats.add("cardiovasculaire")
  }

  return Array.from(cats) // empty array = no specific match → show all
}

// Smart age: returns value + best unit based on age magnitude
function calculateSmartAge(dateString: string): { value: number; unit: "ans" | "mois" | "jours" } | null {
  try {
    const dob = new Date(dateString)
    if (isNaN(dob.getTime())) return null
    const today = new Date()
    const diffMs = today.getTime() - dob.getTime()
    if (diffMs < 0) return null
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays >= 365) {
      let ans = today.getFullYear() - dob.getFullYear()
      const beforeBirthday =
        today.getMonth() < dob.getMonth() ||
        (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())
      if (beforeBirthday) ans--
      return { value: Math.max(0, ans), unit: "ans" }
    }
    if (diffDays >= 30) {
      return { value: Math.floor(diffDays / 30.44), unit: "mois" }
    }
    return { value: diffDays, unit: "jours" }
  } catch {
    return null
  }
}

function calculateAgeDetailed(dateString: string): { ans: number; mois: number; jours: number } | null {
  try {
    const dob = new Date(dateString)
    if (isNaN(dob.getTime())) return null
    const today = new Date()
    let ans = today.getFullYear() - dob.getFullYear()
    let mois = today.getMonth() - dob.getMonth()
    let jours = today.getDate() - dob.getDate()
    if (jours < 0) {
      mois--
      const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0)
      jours += prevMonth.getDate()
    }
    if (mois < 0) {
      ans--
      mois += 12
    }
    return { ans: Math.max(0, ans), mois: Math.max(0, mois), jours: Math.max(0, jours) }
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
}: {
  options: { value: string; label: string }[]
  value: string
  onChange: (val: string) => void
  placeholder: string
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase())
  )
  const selected = options.find(o => o.value === value)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="input w-full text-left flex items-center justify-between"
      >
        <span className={selected ? "text-gray-900" : "text-gray-400"}>
          {selected?.label || placeholder}
        </span>
        <ChevronDown size={14} className="text-gray-400" />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher..."
                className="input w-full pl-8 text-sm"
                autoFocus
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-48">
            {filtered.length === 0 ? (
              <p className="p-3 text-sm text-gray-400 text-center">Aucun résultat</p>
            ) : (
              filtered.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); setSearch("") }}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors",
                    value === opt.value && "bg-blue-50 text-blue-700 font-medium"
                  )}
                >
                  {opt.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
      {open && <div className="fixed inset-0 z-40" onClick={() => { setOpen(false); setSearch("") }} />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function DeclarationForm({ casId, copyId }: { casId?: string; copyId?: string } = {}) {
  const router = useRouter()
  const isEditMode = !!casId

  // Data state
  const [maladies, setMaladies] = useState<Maladie[]>([])
  const [groupedMaladies, setGroupedMaladies] = useState<GroupedMaladies>({
    categorie_1_mdo: [],
    categorie_2_epidemique: [],
    categorie_3_bmr: [],
  })
  const [wilayas, setWilayas] = useState<Wilaya[]>([])
  const [allCommunes, setAllCommunes] = useState<Commune[]>([])
  const [filteredCommunes, setFilteredCommunes] = useState<Commune[]>([])
  const [etablissements, setEtablissements] = useState<Etablissement[]>([])
  const [symptomes, setSymptomes] = useState<SymptomeRef[]>([])
  const [germes, setGermes] = useState<GermeRef[]>([])

  // UI state
  const [loading, setLoading] = useState(false)
  const [brouillonLoading, setBrouillonLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(isEditMode)
  const [error, setError] = useState<string | null>(null)
  const [pendingCasId, setPendingCasId] = useState<string | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [declenchement, setDeclenchement] = useState<any>(null)
  const [ficheSpecifiqueSlug, setFicheSpecifiqueSlug] = useState<string | null>(null)

  // Feature state
  const [selectedSymptomeIds, setSelectedSymptomeIds] = useState<string[]>([])
  const [lieux, setLieux] = useState<LieuEntry[]>([])
  const [resultatsLabo, setResultatsLabo] = useState<ResultatLaboEntry[]>([])
  const [casSearchQuery, setCasSearchQuery] = useState("")
  const [casSearchResults, setCasSearchResults] = useState<CasSearchResult[]>([])
  const [casSearchLoading, setCasSearchLoading] = useState(false)
  const [selectedCasSimilaire, setSelectedCasSimilaire] = useState<CasSearchResult | null>(null)

  // Duplicate detection
  const [duplicates, setDuplicates] = useState<{ id: string; codeCas: string; statut: string; maladie: string }[]>([])
  const [dismissDuplicates, setDismissDuplicates] = useState(false)

  // Age unit selector state
  const [ageUnit, setAgeUnit] = useState<"ans" | "mois" | "jours">("ans")
  const ageUnitRef = useRef<"ans" | "mois" | "jours">("ans")
  ageUnitRef.current = ageUnit

  // Prevent circular DOB <-> age updates
  const ageChangedByUser = useRef(false)
  const dobChangedByUser = useRef(false)
  // Prevent wilayadId effect from clearing communeId during initial edit load
  const skipCommuneReset = useRef(false)

  // Form
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    getValues,
    reset,
    formState: { errors },
  } = useForm<DeclarationFormData>({
    resolver: zodResolver(declarationSchema),
    defaultValues: {
      estEtranger: false,
      casSimilaire: false,
      estHospitalise: false,
      estEvacue: false,
    },
  })

  // Watched values
  const firstName = watch("firstName")
  const lastName = watch("lastName")
  const dateOfBirth = watch("dateOfBirth")
  const ageAns = watch("ageAns")
  const wilayadId = watch("wilayadId")
  const estEtranger = watch("estEtranger")
  const estHospitalise = watch("estHospitalise")
  const estEvacue = watch("estEvacue")
  const evolution = watch("evolution")
  const maladieId = watch("maladieId")
  const observation = watch("observation")
  const casSimilaire = watch("casSimilaire")

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

  // DOB → smart age (auto unit: ans if ≥1 year, mois if ≥1 month, jours otherwise)
  useEffect(() => {
    if (ageChangedByUser.current) {
      ageChangedByUser.current = false
      return
    }
    if (dateOfBirth) {
      dobChangedByUser.current = true
      const result = calculateSmartAge(dateOfBirth)
      if (result) {
        setValue("ageAns", result.unit === "ans" ? result.value : undefined)
        setValue("ageMois", result.unit === "mois" ? result.value : undefined)
        setValue("ageJours", result.unit === "jours" ? result.value : undefined)
        setAgeUnit(result.unit)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateOfBirth, setValue])

  // ageAns → DOB (only when unit is "ans"; set to June 30 of the calculated year)
  useEffect(() => {
    if (dobChangedByUser.current) {
      dobChangedByUser.current = false
      return
    }
    if (ageUnitRef.current === "ans" && ageAns !== undefined && ageAns !== null && !isNaN(ageAns as number)) {
      ageChangedByUser.current = true
      const year = new Date().getFullYear() - (ageAns as number)
      setValue("dateOfBirth", `${year}-06-30`)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ageAns, setValue])

  useEffect(() => {
    if (wilayadId) {
      setFilteredCommunes(allCommunes.filter(c => c.wilayadId === wilayadId))
      if (!skipCommuneReset.current) {
        setValue("communeId", "")
      }
      skipCommuneReset.current = false
    } else {
      setFilteredCommunes(allCommunes)
    }
  }, [wilayadId, allCommunes, setValue])

  // Duplicate patient check — fires when all three identity fields are filled (create mode only)
  useEffect(() => {
    if (isEditMode) return
    if (!firstName || firstName.length < 2 || !lastName || lastName.length < 2) {
      setDuplicates([])
      return
    }
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ firstName: firstName.trim(), lastName: lastName.trim() })
        if (dateOfBirth) params.set("dateOfBirth", dateOfBirth)
        const res = await fetch(`/api/patients/check-duplicate?${params}`)
        if (!res.ok) return
        const data = await res.json()
        setDuplicates(data.matches ?? [])
        setDismissDuplicates(false)
      } catch { /* silent */ }
    }, 800)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstName, lastName, dateOfBirth, isEditMode])

  // Load reference data — create mode only
  useEffect(() => {
    if (isEditMode) return

    fetch("/api/maladies")
      .then(r => r.json())
      .then(data => {
        setMaladies(data.maladies)
        setGroupedMaladies(data.grouped)
      })
      .catch(console.error)

    fetch("/api/communes")
      .then(r => r.json())
      .then((data: Commune[]) => {
        setAllCommunes(data)
        setFilteredCommunes(data)
        const wilayadMap = new Map<string, Wilaya>()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data.forEach((c: any) => {
          if (c.wilaya && !wilayadMap.has(c.wilaya.id)) {
            wilayadMap.set(c.wilaya.id, { id: c.wilaya.id, nom: c.wilaya.nom, code: c.wilaya.code ?? "" })
          }
        })
        setWilayas(Array.from(wilayadMap.values()).sort((a, b) => a.nom.localeCompare(b.nom)))
      })
      .catch(console.error)

    fetch("/api/etablissements")
      .then(r => r.json())
      .then(setEtablissements)
      .catch(console.error)

    fetch("/api/symptomes")
      .then(r => r.json())
      .then(setSymptomes)
      .catch(console.error)

    fetch("/api/germes")
      .then(r => r.json())
      .then(setGermes)
      .catch(console.error)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode])

  // Load reference data + case data — edit mode only
  useEffect(() => {
    if (!casId) return

    Promise.all([
      fetch("/api/maladies").then(r => r.json()),
      fetch("/api/communes").then(r => r.json()),
      fetch("/api/etablissements").then(r => r.json()),
      fetch("/api/symptomes").then(r => r.json()),
      fetch("/api/germes").then(r => r.json()),
      fetch(`/api/cas/${casId}`).then(r => r.json()),
    ]).then(([maladiesData, communesData, etabData, sympData, germeData, caseData]) => {
      setMaladies(maladiesData.maladies)
      setGroupedMaladies(maladiesData.grouped)
      setAllCommunes(communesData)
      setEtablissements(etabData)
      setSymptomes(sympData)
      setGermes(germeData)

      const wilayadMap = new Map<string, Wilaya>()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      communesData.forEach((c: any) => {
        if (c.wilaya && !wilayadMap.has(c.wilaya.id)) {
          wilayadMap.set(c.wilaya.id, { id: c.wilaya.id, nom: c.wilaya.nom, code: c.wilaya.code ?? "" })
        }
      })
      setWilayas(Array.from(wilayadMap.values()).sort((a, b) => a.nom.localeCompare(b.nom)))

      const p = caseData.patient
      const md = caseData.medecinDeclarant

      // Find wilayadId from the patient's commune
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const commune = communesData.find((c: any) => c.id === p?.communeId)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const resolvedWilayadId: string = commune?.wilaya?.id ?? (commune as any)?.wilayadId ?? ""

      // Pre-filter communes and prevent the effect from clearing communeId
      if (resolvedWilayadId) {
        skipCommuneReset.current = true
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setFilteredCommunes(communesData.filter((c: any) => c.wilayadId === resolvedWilayadId || c.wilaya?.id === resolvedWilayadId))
      }

      // Pre-fill form with case data
      reset({
        medecinDeclarantId: md?.id ?? "",
        nomMedecinDeclarant: md?.nom ?? "",
        prenomMedecinDeclarant: md?.prenom ?? "",
        serviceDeclarant: caseData.serviceDeclarant ?? "",
        firstName: p?.firstName ?? "",
        lastName: p?.lastName ?? "",
        nin: caseData.nin ?? "",
        dateOfBirth: toDateStr(p?.dateOfBirth),
        ageAns: caseData.ageAns !== null && caseData.ageAns !== undefined ? Number(caseData.ageAns) : undefined,
        ageMois: caseData.ageMois !== null && caseData.ageMois !== undefined ? Number(caseData.ageMois) : undefined,
        ageJours: caseData.ageJours !== null && caseData.ageJours !== undefined ? Number(caseData.ageJours) : undefined,
        sex: p?.sex ?? "homme",
        address: p?.address ?? "",
        wilayadId: resolvedWilayadId,
        communeId: p?.communeId ?? "",
        phone: p?.phone ?? "",
        emailPatient: caseData.emailPatient ?? "",
        profession: caseData.profession ?? "",
        lieuTravail: caseData.lieuTravail ?? "",
        estEtranger: caseData.estEtranger ?? false,
        nationalite: caseData.nationalite ?? "",
        nationaliteCode: caseData.nationaliteCode ?? "",
        maladieId: caseData.maladieId ?? "",
        dateDebutSymptomes: toDateStr(caseData.dateDebutSymptomes),
        dateDiagnostic: toDateStr(caseData.dateDiagnostic),
        symptomesTexte: caseData.symptomesTexte ?? "",
        observation: caseData.observation ?? undefined,
        modeConfirmation: caseData.modeConfirmation ?? undefined,
        atcd: caseData.atcd ?? "",
        casSimilaire: caseData.casSimilaire ?? false,
        casSimilaireId: caseData.casSimilaireId ?? "",
        estHospitalise: caseData.estHospitalise ?? false,
        dateHospitalisation: toDateStr(caseData.dateHospitalisation),
        structureHospitalisationId: caseData.structureHospitalisationId ?? "",
        serviceHospitalisation: caseData.serviceHospitalisation ?? "",
        estEvacue: caseData.estEvacue ?? false,
        dateEvacuation: toDateStr(caseData.dateEvacuation),
        structureEvacuation: caseData.structureEvacuation ?? "",
        evolution: caseData.evolution ?? undefined,
        dateSortie: toDateStr(caseData.dateSortie),
        dateDeces: toDateStr(caseData.dateDeces),
        service: caseData.service ?? "",
        notesCliniques: caseData.notesCliniques ?? "",
        resultatLabo: caseData.resultatLabo ?? "",
        etablissementId: caseData.etablissementId ?? "",
      })

      // Pre-fill symptomes
      if (Array.isArray(caseData.symptomes)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setSelectedSymptomeIds(caseData.symptomes.map((s: any) => s.symptomeId))
      }

      // Pre-fill lieux
      if (Array.isArray(caseData.lieux)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setLieux(caseData.lieux.map((l: any) => ({
          nom: l.nom ?? "", type: l.type ?? "", adresse: l.adresse ?? "",
          communeId: l.communeId ?? "", dateDebut: toDateStr(l.dateDebut), dateFin: toDateStr(l.dateFin),
        })))
      }

      // Pre-fill resultatsLabo
      if (Array.isArray(caseData.resultatsLabo)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setResultatsLabo(caseData.resultatsLabo.map((r: any) => ({
          typePrelevement: r.typePrelevement ?? "", datePrelevement: toDateStr(r.datePrelevement),
          germeId: r.germeId ?? "", resultat: r.resultat ?? "",
          antibiogramme: r.antibiogramme ?? "", laboratoire: r.laboratoire ?? "", notes: r.notes ?? "",
        })))
      }

      // Pre-fill ficheSpecifique
      if (caseData.ficheSpecifiqueType) {
        setFicheSpecifiqueSlug(caseData.ficheSpecifiqueType)
      }

      // Pre-fill cas similaire reference
      if (caseData.casSimilaireRef) {
        setSelectedCasSimilaire({
          id: caseData.casSimilaireRef.id,
          codeCas: caseData.casSimilaireRef.codeCas,
          statut: "",
          createdAt: "",
          maladie: caseData.casSimilaireRef.maladie ?? { nom: "", codeCim10: "" },
          patient: caseData.casSimilaireRef.patient ?? { firstName: "", lastName: "" },
        })
      }

      setInitialLoading(false)
    }).catch(err => {
      console.error("Edit mode load error:", err)
      setInitialLoading(false)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [casId])

  // Load source case data for copy mode (pre-fill clinical data, exclude patient identity)
  useEffect(() => {
    if (!copyId || isEditMode) return

    fetch(`/api/cas/${copyId}`)
      .then(r => r.json())
      .then(caseData => {
        setValue("maladieId", caseData.maladieId ?? "")
        setValue("symptomesTexte", caseData.symptomesTexte ?? "")
        if (caseData.observation) setValue("observation", caseData.observation)
        if (caseData.modeConfirmation) setValue("modeConfirmation", caseData.modeConfirmation)
        setValue("atcd", caseData.atcd ?? "")
        setValue("service", caseData.service ?? "")
        setValue("notesCliniques", caseData.notesCliniques ?? "")
        setValue("etablissementId", caseData.etablissementId ?? "")
        setValue("serviceDeclarant", caseData.serviceDeclarant ?? "")
        if (Array.isArray(caseData.symptomes)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setSelectedSymptomeIds(caseData.symptomes.map((s: any) => s.symptomeId))
        }
      })
      .catch(console.error)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [copyId])

  useEffect(() => {
    if (maladieId) {
      const found = maladies.find(m => m.id === maladieId)
      setFicheSpecifiqueSlug(found?.ficheSpecifiqueSlug ?? null)
    } else {
      setFicheSpecifiqueSlug(null)
    }
  }, [maladieId, maladies])

  // Cas similaire search with debounce
  const searchCasSimilaire = useCallback(async (q: string) => {
    if (q.length < 2) { setCasSearchResults([]); return }
    setCasSearchLoading(true)
    try {
      const res = await fetch(`/api/cas-search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setCasSearchResults(data)
    } catch { setCasSearchResults([]) }
    finally { setCasSearchLoading(false) }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => searchCasSimilaire(casSearchQuery), 300)
    return () => clearTimeout(timer)
  }, [casSearchQuery, searchCasSimilaire])

  // ---------------------------------------------------------------------------
  // Build payload helper
  // ---------------------------------------------------------------------------
  const buildPayload = (data: Partial<DeclarationFormData>, statut: string) => ({
    patient: {
      firstName: data.firstName ?? "",
      lastName: data.lastName ?? "",
      dateOfBirth: data.dateOfBirth || null,
      sex: data.sex ?? "homme",
      address: data.address ?? "",
      communeId: data.communeId || null,
      phone: data.phone || null,
    },
    communeId: data.communeId || null,
    maladieId: data.maladieId,
    dateDebutSymptomes: data.dateDebutSymptomes || null,
    dateDiagnostic: data.dateDiagnostic || null,
    modeConfirmation: data.modeConfirmation || null,
    nin: data.nin || null,
    ageAns: data.ageAns ?? null,
    ageMois: data.ageMois ?? null,
    ageJours: data.ageJours ?? null,
    profession: data.profession || null,
    emailPatient: data.emailPatient || null,
    lieuTravail: data.lieuTravail || null,
    estEtranger: data.estEtranger ?? null,
    nationalite: data.nationalite || null,
    symptomesTexte: data.symptomesTexte || null,
    observation: data.observation || null,
    atcd: data.atcd || null,
    casSimilaire: data.casSimilaire ?? null,
    estHospitalise: data.estHospitalise ?? null,
    dateHospitalisation: data.dateHospitalisation || null,
    estEvacue: data.estEvacue ?? null,
    dateEvacuation: data.dateEvacuation || null,
    structureEvacuation: data.structureEvacuation || null,
    evolution: data.evolution || null,
    dateSortie: data.dateSortie || null,
    dateDeces: data.dateDeces || null,
    serviceDeclarant: data.serviceDeclarant || null,
    moisDeclaration: data.moisDeclaration ?? null,
    anneeDeclaration: data.anneeDeclaration ?? null,
    etablissementId: data.etablissementId || null,
    service: data.service,
    notesCliniques: data.notesCliniques || null,
    resultatLabo: data.resultatLabo || null,
    ficheSpecifiqueType: ficheSpecifiqueSlug || null,
    donneesSpecifiques: ficheSpecifiqueSlug ? (data as Record<string, unknown>).fiche ?? null : null,
    nationaliteCode: data.nationaliteCode || null,
    casSimilaireId: selectedCasSimilaire?.id || null,
    structureHospitalisationId: data.structureHospitalisationId || null,
    serviceHospitalisation: data.serviceHospitalisation || null,
    symptomeIds: selectedSymptomeIds,
    lieux: lieux.filter(l => l.nom.trim()),
    resultatsLabo: resultatsLabo.filter(r => r.typePrelevement && r.datePrelevement),
    nomMedecinDeclarant: data.nomMedecinDeclarant || null,
    prenomMedecinDeclarant: data.prenomMedecinDeclarant || null,
    medecinDeclarantId: data.medecinDeclarantId || null,
    statut,
  })

  // ---------------------------------------------------------------------------
  // Submit — handles both create (POST) and update (PATCH)
  // ---------------------------------------------------------------------------
  const onSubmit = async (data: DeclarationFormData) => {
    setLoading(true)
    setError(null)
    try {
      let statut = "nouveau"
      if (data.observation === "cas_confirme") statut = "confirme"
      else if (data.observation === "cas_suspect") statut = "suspect"

      const payload = buildPayload(data, statut)

      if (isEditMode) {
        const res = await fetch(`/api/cas/${casId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error ?? "Erreur lors de la mise à jour")
        }
        toast.success("Déclaration mise à jour")
        router.push(`/declarations/${casId}`)
      } else {
        const res = await fetch("/api/cas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error ?? "Erreur lors de la déclaration")
        }
        const cas = await res.json()
        toast.success("Déclaration enregistrée avec succès")
        if (cas.declenchement) {
          setDeclenchement(cas.declenchement)
          setPendingCasId(cas.id)
        } else {
          router.push(`/declarations/${cas.id}`)
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue"
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Auto-save on page unload (create mode only)
  // ---------------------------------------------------------------------------
  const autoSaveRef = useRef(false)
  useEffect(() => {
    if (isEditMode) return
    const handler = (e: BeforeUnloadEvent) => {
      const vals = getValues()
      const hasData = vals.firstName || vals.lastName || vals.maladieId
      if (!hasData || autoSaveRef.current) return
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [isEditMode, getValues])

  // Auto-save brouillon when navigating away via Next.js router (create mode)
  useEffect(() => {
    if (isEditMode) return
    const handleRouteChange = async () => {
      if (autoSaveRef.current) return
      const vals = getValues()
      const hasData = vals.firstName || vals.lastName || vals.maladieId
      if (!hasData) return
      autoSaveRef.current = true
      try {
        const parsed = brouillonSchema.safeParse(vals)
        const data = parsed.success ? parsed.data : vals
        const payload = buildPayload(data, "brouillon")
        await fetch("/api/cas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        toast.success("Brouillon sauvegardé automatiquement", { duration: 3000 })
      } catch { /* silent */ }
    }
    const originalPush = router.push.bind(router)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(router as any).push = async (...args: Parameters<typeof router.push>) => {
      await handleRouteChange()
      return originalPush(...args)
    }
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(router as any).push = originalPush
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode])

  // ---------------------------------------------------------------------------
  // Save as brouillon — create mode only
  // ---------------------------------------------------------------------------
  const saveBrouillon = async () => {
    setBrouillonLoading(true)
    setError(null)
    try {
      const raw = getValues()
      const parsed = brouillonSchema.safeParse(raw)
      const data = parsed.success ? parsed.data : raw

      const payload = buildPayload(data, "brouillon")

      const res = await fetch("/api/cas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Erreur lors de l'enregistrement du brouillon")
      }

      const cas = await res.json()
      toast.success("Brouillon enregistré")
      router.push(`/declarations/${cas.id}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue"
      setError(msg)
      toast.error(msg)
    } finally {
      setBrouillonLoading(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Lieu helpers
  // ---------------------------------------------------------------------------
  const addLieu = () => {
    if (lieux.length >= 4) return
    setLieux([...lieux, { nom: "", type: "", adresse: "", communeId: "", dateDebut: "", dateFin: "" }])
  }
  const removeLieu = (idx: number) => setLieux(lieux.filter((_, i) => i !== idx))
  const updateLieu = (idx: number, field: keyof LieuEntry, value: string) =>
    setLieux(lieux.map((l, i) => i === idx ? { ...l, [field]: value } : l))

  // ---------------------------------------------------------------------------
  // Resultat Labo helpers
  // ---------------------------------------------------------------------------
  const addResultatLabo = () => {
    setResultatsLabo([...resultatsLabo, {
      typePrelevement: "", datePrelevement: "", germeId: "", resultat: "",
      antibiogramme: "", laboratoire: "", notes: "",
    }])
  }
  const removeResultatLabo = (idx: number) => setResultatsLabo(resultatsLabo.filter((_, i) => i !== idx))
  const updateResultatLabo = (idx: number, field: keyof ResultatLaboEntry, value: string) =>
    setResultatsLabo(resultatsLabo.map((r, i) => i === idx ? { ...r, [field]: value } : r))

  // ---------------------------------------------------------------------------
  // Symptom toggle
  // ---------------------------------------------------------------------------
  const toggleSymptome = (id: string) => {
    setSelectedSymptomeIds(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  // ---------------------------------------------------------------------------
  // Style helpers
  // ---------------------------------------------------------------------------
  const inputCls = (hasError: boolean) => cn("input w-full", hasError && "input-error")

  const selectedMaladie = maladies.find(m => m.id === maladieId)

  const SectionHeader = ({ letter, title }: { letter: string; title: string }) => (
    <div className="px-5 py-3 flex items-center gap-3 border-b border-gray-100" style={{ backgroundColor: "var(--gray-50)" }}>
      <span className="w-6 h-6 rounded-md text-white text-[11px] font-bold flex items-center justify-center shrink-0" style={{ backgroundColor: "#1B4F8A" }}>
        {letter}
      </span>
      <h2 className="text-[13px] font-semibold text-gray-800">{title}</h2>
    </div>
  )

  const FieldError = ({ msg }: { msg?: string }) =>
    msg ? <p className="text-xs text-red-500 mt-1">{msg}</p> : null

  const ToggleGroup = ({ value, onChange }: {
    value: unknown
    onChange: (val: boolean) => void
  }) => (
    <div className="flex gap-3">
      {([true, false] as const).map(val => (
        <label
          key={String(val)}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-all flex-1 justify-center text-sm",
            value === val
              ? "border-[#1B4F8A] bg-[#EBF1FA] text-[#1B4F8A] font-medium"
              : "border-gray-200 text-gray-600 hover:border-gray-300"
          )}
        >
          <input type="radio" className="sr-only" checked={value === val} onChange={() => onChange(val)} />
          {val ? "Oui" : "Non"}
        </label>
      ))}
    </div>
  )

  const relevantSymptomCategories = selectedMaladie
    ? getRelevantSymptomCategories(selectedMaladie.nom, selectedMaladie.codeCim10)
    : []

  const symptomesByCategory = SYMPTOM_CATEGORIES.map(cat => ({
    ...cat,
    items: symptomes.filter(s => s.categorie === cat.key),
  })).filter(g => {
    if (g.items.length === 0) return false
    if (relevantSymptomCategories.length === 0) return true
    return relevantSymptomCategories.includes(g.key)
  })

  // ---------------------------------------------------------------------------
  // Loading spinner (edit mode while fetching case data)
  // ---------------------------------------------------------------------------
  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: "#1B4F8A" }} />
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <>
      {!isEditMode && declenchement && (
        <ProtocoleAlertModal
          declenchement={declenchement}
          maladieName={selectedMaladie?.nom ?? ""}
          onClose={() => {
            setDeclenchement(null)
            if (pendingCasId) router.push(`/declarations/${pendingCasId}`)
          }}
        />
      )}

      {/* Top bar */}
      <div className="max-w-3xl mb-5">
        <p className="text-[13px] text-gray-500">
          Remplissez le formulaire ci-dessous pour déclarer un nouveau cas.
        </p>
      </div>

      {/* Duplicate patient warning */}
      {duplicates.length > 0 && !dismissDuplicates && (
        <div className="max-w-3xl mb-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle size={16} className="text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Patient(s) similaire(s) trouvé(s)</p>
                <p className="text-xs text-amber-700 mt-0.5">Un ou plusieurs patients avec le même nom existent déjà dans le système. Vérifiez avant de soumettre :</p>
                <ul className="mt-1.5 space-y-0.5">
                  {duplicates.map(d => (
                    <li key={d.id} className="text-xs text-amber-800">
                      • <span className="font-medium">{d.codeCas}</span> — {d.maladie} — <span className="capitalize">{d.statut}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <button type="button" onClick={() => setDismissDuplicates(true)} className="text-amber-500 hover:text-amber-700 shrink-0">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl space-y-6">

        {/* ── Section 0 — En-tête ───────────────────────────────────────── */}
        <FormHeaderSection register={register} errors={errors} setValue={setValue} watch={watch} />

        {/* ── Section 1 — Informations Administratives ─────────────────── */}
        <div className="card">
          <SectionHeader letter="1" title="Informations Administratives" />
          <div className="p-5 grid grid-cols-2 gap-4">

            {/* Nom */}
            <div>
              <label className="label">Nom <span className="text-red-500">*</span></label>
              <input {...register("lastName")} className={inputCls(!!errors.lastName)} placeholder="Benali" />
              <FieldError msg={errors.lastName?.message} />
            </div>

            {/* Prénom */}
            <div>
              <label className="label">Prénom <span className="text-red-500">*</span></label>
              <input {...register("firstName")} className={inputCls(!!errors.firstName)} placeholder="Ahmed" />
              <FieldError msg={errors.firstName?.message} />
            </div>

            {/* NIN — full width */}
            <div className="col-span-2">
              <label className="label">NIN (Numéro d&apos;Identification National)</label>
              <input {...register("nin")} className={inputCls(false)} placeholder="18 caractères max" maxLength={18} />
            </div>

            {/* Date de naissance + Âge — full-width row, side by side */}
            <div className="col-span-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Date de naissance</label>
                  <input
                    {...register("dateOfBirth")}
                    type="date"
                    className={inputCls(false)}
                    onChange={e => {
                      dobChangedByUser.current = true
                      ageChangedByUser.current = false
                      register("dateOfBirth").onChange(e)
                    }}
                  />
                </div>
                <div>
                  <label className="label">Âge</label>
                  <div className="grid grid-cols-[1fr_120px]">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={
                        ageUnit === "ans" ? (ageAns ?? "") :
                        ageUnit === "mois" ? (watch("ageMois") ?? "") :
                        (watch("ageJours") ?? "")
                      }
                      onChange={e => {
                        const val = e.target.value === "" ? undefined : parseFloat(e.target.value)
                        ageChangedByUser.current = true
                        dobChangedByUser.current = false
                        if (ageUnit === "ans") setValue("ageAns", val as number | undefined)
                        else if (ageUnit === "mois") setValue("ageMois", val as number | undefined)
                        else setValue("ageJours", val as number | undefined)
                      }}
                      className="input w-full rounded-r-none border-r-0 text-base font-medium"
                      placeholder="0"
                    />
                    <select
                      value={ageUnit}
                      onChange={e => {
                        const unit = e.target.value as "ans" | "mois" | "jours"
                        setAgeUnit(unit)
                        if (unit !== "ans") setValue("ageAns", undefined)
                        if (unit !== "mois") setValue("ageMois", undefined)
                        if (unit !== "jours") setValue("ageJours", undefined)
                      }}
                      className="input rounded-l-none border-l border-gray-200 bg-gray-50 text-sm w-full"
                    >
                      <option value="ans">Ans</option>
                      <option value="mois">Mois</option>
                      <option value="jours">Jours</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Sexe */}
            <div className="col-span-2">
              <label className="label">Sexe <span className="text-red-500">*</span></label>
              <div className="flex gap-4">
                {(["homme", "femme"] as const).map(s => {
                  const sexValue = watch("sex")
                  return (
                    <label
                      key={s}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-all flex-1 justify-center text-sm",
                        sexValue === s
                          ? "border-[#1B4F8A] bg-[#EBF1FA] text-[#1B4F8A] font-medium"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      )}
                    >
                      <input type="radio" value={s} {...register("sex")} className="sr-only" />
                      {s === "homme" ? "Masculin" : "Féminin"}
                    </label>
                  )
                })}
              </div>
              <FieldError msg={errors.sex?.message} />
            </div>

            {/* Wilaya */}
            <div>
              <label className="label">Wilaya de résidence</label>
              <select {...register("wilayadId")} className={inputCls(false)}>
                <option value="">Sélectionner une wilaya...</option>
                {wilayas.map(w => <option key={w.id} value={w.id}>{w.nom}</option>)}
              </select>
            </div>

            {/* Commune */}
            <div>
              <label className="label">Commune</label>
              <select {...register("communeId")} className={inputCls(false)}>
                <option value="">Sélectionner une commune...</option>
                {filteredCommunes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </div>

            {/* Adresse */}
            <div className="col-span-2">
              <label className="label">Adresse complète <span className="text-red-500">*</span></label>
              <textarea
                {...register("address")}
                rows={2}
                className={cn(inputCls(!!errors.address), "h-auto py-2 resize-none")}
                placeholder="Numéro, rue, quartier..."
              />
              <FieldError msg={errors.address?.message} />
            </div>

            {/* Profession */}
            <div>
              <label className="label">Profession</label>
              <input {...register("profession")} className={inputCls(false)} placeholder="Ex: Enseignant" />
            </div>

            {/* Téléphone */}
            <div>
              <label className="label">Téléphone</label>
              <input {...register("phone")} className={inputCls(false)} placeholder="0555 xx xx xx" />
            </div>

            {/* E-mail */}
            <div>
              <label className="label">E-mail</label>
              <input
                {...register("emailPatient")}
                type="email"
                className={inputCls(!!errors.emailPatient)}
                placeholder="exemple@mail.com"
              />
              <FieldError msg={errors.emailPatient?.message} />
            </div>

            {/* Lieu de travail */}
            <div>
              <label className="label">Lieu de travail / École</label>
              <input {...register("lieuTravail")} className={inputCls(false)} placeholder="Nom de l'établissement" />
            </div>

            {/* Nationalité */}
            <div className="col-span-2">
              <label className="label">Ressortissant étranger</label>
              <ToggleGroup value={estEtranger} onChange={val => setValue("estEtranger", val)} />
            </div>

            {estEtranger && (
              <div className="col-span-2">
                <label className="label">Nationalité <span className="text-red-500">*</span></label>
                <SearchableSelect
                  options={NATIONALITIES.map(n => ({ value: n.code, label: n.label }))}
                  value={watch("nationaliteCode") ?? ""}
                  onChange={val => {
                    setValue("nationaliteCode", val)
                    const nat = NATIONALITIES.find(n => n.code === val)
                    setValue("nationalite", nat?.label ?? val)
                  }}
                  placeholder="Sélectionner une nationalité..."
                />
              </div>
            )}
          </div>
        </div>

        {/* ── Section 2 — Hospitalisation & Évacuation ─────────────────── */}
        <div className="card">
          <SectionHeader letter="2" title="Hospitalisation & Évacuation" />
          <div className="p-5 grid grid-cols-2 gap-4">

            {/* Hospitalisation */}
            <div className="col-span-2">
              <label className="label">Hospitalisation</label>
              <ToggleGroup value={estHospitalise} onChange={val => setValue("estHospitalise", val)} />
            </div>

            {estHospitalise && (
              <>
                <div>
                  <label className="label">Date d&apos;hospitalisation</label>
                  <input {...register("dateHospitalisation")} type="date" className={inputCls(false)} />
                </div>
                <div>
                  <label className="label">Structure d&apos;hospitalisation</label>
                  <select {...register("structureHospitalisationId")} className={inputCls(false)}>
                    <option value="">Sélectionner...</option>
                    {etablissements.map(e => <option key={e.id} value={e.id}>{e.nom}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Service d&apos;hospitalisation</label>
                  <input
                    {...register("serviceHospitalisation")}
                    className={inputCls(false)}
                    placeholder="Ex: Réanimation, Médecine interne..."
                  />
                </div>
              </>
            )}

            {/* Évacuation */}
            <div className="col-span-2">
              <label className="label">Évacuation</label>
              <ToggleGroup value={estEvacue} onChange={val => setValue("estEvacue", val)} />
            </div>

            {estEvacue && (
              <>
                <div>
                  <label className="label">Date d&apos;évacuation</label>
                  <input {...register("dateEvacuation")} type="date" className={inputCls(false)} />
                </div>
                <div>
                  <label className="label">Structure d&apos;évacuation</label>
                  <input {...register("structureEvacuation")} className={inputCls(false)} placeholder="Nom de la structure" />
                </div>
              </>
            )}

            {/* Évolution */}
            <div className="col-span-2">
              <label className="label">Évolution</label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: "guerison", label: "Guérison" },
                  { value: "en_cours_guerison", label: "En cours de guérison" },
                  { value: "sortant", label: "Sortant" },
                  { value: "toujours_malade", label: "Toujours malade" },
                  { value: "autre", label: "Autre" },
                  { value: "deces", label: "Décès" },
                ] as const).map(opt => (
                  <label
                    key={opt.value}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2.5 rounded-lg border cursor-pointer transition-all text-sm",
                      evolution === opt.value
                        ? opt.value === "deces"
                          ? "border-red-400 bg-red-50 text-red-700 font-medium"
                          : "border-[#1B4F8A] bg-[#EBF1FA] text-[#1B4F8A] font-medium"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    )}
                  >
                    <input type="radio" value={opt.value} {...register("evolution")} className="sr-only" />
                    {opt.label}
                  </label>
                ))}
              </div>

              {(evolution === "guerison" || evolution === "sortant") && (
                <div className="mt-3">
                  <label className="label">Date de sortie</label>
                  <input {...register("dateSortie")} type="date" className={inputCls(false)} />
                </div>
              )}

              {evolution === "deces" && (
                <div className="mt-3">
                  <label className="label">Date du décès <span className="text-red-500">*</span></label>
                  <input {...register("dateDeces")} type="date" className={inputCls(false)} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Section 3 — Données Cliniques ────────────────────────────── */}
        <div className="card">
          <SectionHeader letter="3" title="Données Cliniques" />
          <div className="p-5 grid grid-cols-2 gap-4">

            {/* Maladie */}
            <div className="col-span-2">
              <label className="label">Maladie <span className="text-red-500">*</span></label>
              <DiseaseCombobox
                grouped={groupedMaladies}
                value={watch("maladieId")}
                onChange={(id, maladie) => {
                  setValue("maladieId", id)
                  if (maladie?.ficheSpecifiqueSlug) {
                    setFicheSpecifiqueSlug(maladie.ficheSpecifiqueSlug)
                  } else {
                    setFicheSpecifiqueSlug(null)
                  }
                }}
                error={errors.maladieId?.message}
              />
            </div>

            {/* Dates — not required */}
            <div>
              <label className="label">Date d&apos;apparition des symptômes</label>
              <input
                {...register("dateDebutSymptomes")}
                type="date"
                className={inputCls(false)}
              />
            </div>
            <div>
              <label className="label">Date du diagnostic</label>
              <input
                {...register("dateDiagnostic")}
                type="date"
                className={inputCls(false)}
              />
            </div>

            {/* Symptômes codés */}
            <div className="col-span-2">
              <label className="label">
                Symptômes codés
                {relevantSymptomCategories.length > 0 && (
                  <span className="ml-2 text-[11px] text-blue-500 font-normal">
                    (filtrés pour {selectedMaladie?.nomCourt ?? selectedMaladie?.nom})
                  </span>
                )}
              </label>
              {selectedSymptomeIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {selectedSymptomeIds.map(id => {
                    const s = symptomes.find(x => x.id === id)
                    if (!s) return null
                    return (
                      <span key={id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        {s.nom}
                        <button type="button" onClick={() => toggleSymptome(id)} className="hover:text-blue-900">
                          <X size={12} />
                        </button>
                      </span>
                    )
                  })}
                </div>
              )}
              <div className="border border-gray-200 rounded-lg max-h-52 overflow-y-auto">
                {symptomesByCategory.map(cat => (
                  <div key={cat.key}>
                    <div className="px-3 py-1.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-100 sticky top-0">
                      {cat.label}
                    </div>
                    <div className="grid grid-cols-2 gap-x-2 px-3 py-1.5">
                      {cat.items.map(s => (
                        <label
                          key={s.id}
                          className={cn(
                            "flex items-center gap-2 px-2 py-1.5 rounded text-sm cursor-pointer hover:bg-gray-50 transition-colors",
                            selectedSymptomeIds.includes(s.id) && "bg-blue-50"
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={selectedSymptomeIds.includes(s.id)}
                            onChange={() => toggleSymptome(s.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-gray-700">{s.nom}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Free text symptômes */}
            <div className="col-span-2">
              <label className="label">Symptômes supplémentaires (texte libre)</label>
              <textarea
                {...register("symptomesTexte")}
                rows={2}
                className={cn(inputCls(false), "h-auto py-2 resize-none")}
                placeholder="Symptômes non listés ci-dessus..."
              />
            </div>

            {/* Observation — drives statut */}
            <div className="col-span-2">
              <label className="label">
                Observation
                <span className="ml-2 text-[11px] text-gray-400 font-normal">(détermine le statut du cas)</span>
              </label>
              <div className="flex gap-4">
                {([
                  { value: "cas_confirme", label: "Cas confirmé", statut: "Statut → Confirmé" },
                  { value: "cas_suspect", label: "Cas suspect", statut: "Statut → Suspect" },
                ] as const).map(opt => {
                  const obsValue = watch("observation")
                  return (
                    <label
                      key={opt.value}
                      className={cn(
                        "flex flex-col items-center gap-1 px-4 py-2.5 rounded-lg border cursor-pointer transition-all flex-1 justify-center text-sm",
                        obsValue === opt.value
                          ? "border-[#1B4F8A] bg-[#EBF1FA] text-[#1B4F8A] font-medium"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      )}
                    >
                      <input type="radio" value={opt.value} {...register("observation")} className="sr-only" />
                      <span>{opt.label}</span>
                      {obsValue === opt.value && (
                        <span className="text-[10px] opacity-70">{opt.statut}</span>
                      )}
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Mode de confirmation */}
            {observation === "cas_confirme" && (
              <div className="col-span-2">
                <label className="label">Mode de confirmation</label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { value: "clinique", label: "Clinique" },
                    { value: "biologique", label: "Biologique" },
                    { value: "epidemiologique", label: "Épidémiologique" },
                  ] as const).map(opt => {
                    const modeVal = watch("modeConfirmation")
                    return (
                      <label
                        key={opt.value}
                        className={cn(
                          "flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border cursor-pointer transition-all text-sm",
                          modeVal === opt.value
                            ? "border-green-500 bg-green-50 text-green-700 font-medium"
                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                        )}
                      >
                        <input type="radio" value={opt.value} {...register("modeConfirmation")} className="sr-only" />
                        {opt.label}
                      </label>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ATCD */}
            <div className="col-span-2">
              <label className="label">ATCD (Antécédents médicaux)</label>
              <textarea
                {...register("atcd")}
                rows={2}
                className={cn(inputCls(false), "h-auto py-2 resize-none")}
                placeholder="Antécédents médicaux pertinents..."
              />
            </div>

            {/* Cas similaire */}
            <div className="col-span-2">
              <label className="label">Cas similaire dans l&apos;entourage</label>
              <ToggleGroup value={casSimilaire} onChange={val => {
                setValue("casSimilaire", val)
                if (!val) { setSelectedCasSimilaire(null); setValue("casSimilaireId", "") }
              }} />
            </div>

            {casSimilaire && (
              <div className="col-span-2">
                <label className="label">Lier à un cas existant (optionnel)</label>
                {selectedCasSimilaire ? (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900">
                        {selectedCasSimilaire.codeCas} — {selectedCasSimilaire.patient.lastName} {selectedCasSimilaire.patient.firstName}
                      </p>
                      <p className="text-xs text-blue-700">{selectedCasSimilaire.maladie.nom}</p>
                    </div>
                    <button type="button" onClick={() => { setSelectedCasSimilaire(null); setValue("casSimilaireId", "") }} className="text-blue-500 hover:text-blue-700">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={casSearchQuery}
                        onChange={e => setCasSearchQuery(e.target.value)}
                        placeholder="Rechercher par code cas, nom du patient..."
                        className="input w-full pl-9"
                      />
                      {casSearchLoading && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />}
                    </div>
                    {casSearchResults.length > 0 && (
                      <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {casSearchResults.map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setSelectedCasSimilaire(c)
                              setValue("casSimilaireId", c.id)
                              setCasSearchQuery("")
                              setCasSearchResults([])
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-50 last:border-0"
                          >
                            <p className="text-sm font-medium text-gray-900">{c.codeCas} — {c.patient.lastName} {c.patient.firstName}</p>
                            <p className="text-xs text-gray-500">{c.maladie.nom} • {new Date(c.createdAt).toLocaleDateString("fr-FR")}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Section 4 — Lieux Fréquentés ─────────────────────────────── */}
        <div className="card">
          <SectionHeader letter="4" title="Lieux Fréquentés" />
          <div className="p-5 space-y-4">
            <p className="text-xs text-gray-500">Ajoutez jusqu&apos;à 4 lieux fréquentés par le patient durant la période de contagiosité.</p>

            {lieux.map((lieu, idx) => (
              <div key={idx} className="p-4 border border-gray-200 rounded-lg bg-gray-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500">Lieu {idx + 1}</span>
                  <button type="button" onClick={() => removeLieu(idx)} className="text-red-400 hover:text-red-600">
                    <X size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Nom du lieu</label>
                    <input value={lieu.nom} onChange={e => updateLieu(idx, "nom", e.target.value)} className={inputCls(false)} placeholder="Ex: Marché Mdina Jdida" />
                  </div>
                  <div>
                    <label className="label">Type</label>
                    <select value={lieu.type} onChange={e => updateLieu(idx, "type", e.target.value)} className={inputCls(false)}>
                      <option value="">Sélectionner...</option>
                      {LIEU_TYPES.map(t => <option key={t.code} value={t.code}>{t.label}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="label">Adresse</label>
                    <input value={lieu.adresse} onChange={e => updateLieu(idx, "adresse", e.target.value)} className={inputCls(false)} placeholder="Adresse du lieu..." />
                  </div>
                  <div>
                    <label className="label">Date début fréquentation</label>
                    <input type="date" value={lieu.dateDebut} onChange={e => updateLieu(idx, "dateDebut", e.target.value)} className={inputCls(false)} />
                  </div>
                  <div>
                    <label className="label">Date fin fréquentation</label>
                    <input type="date" value={lieu.dateFin} onChange={e => updateLieu(idx, "dateFin", e.target.value)} className={inputCls(false)} />
                  </div>
                </div>
              </div>
            ))}

            {lieux.length < 4 && (
              <button type="button" onClick={addLieu} className="btn btn-secondary btn-sm">
                <Plus size={14} />
                Ajouter un lieu ({lieux.length}/4)
              </button>
            )}
          </div>
        </div>

        {/* ── Section 5 — Résultats Laboratoire ────────────────────────── */}
        <div className="card">
          <SectionHeader letter="5" title="Prélèvements & Résultats Laboratoire" />
          <div className="p-5 space-y-4">
            <p className="text-xs text-gray-500">Ajoutez un ou plusieurs prélèvements avec leurs résultats et germes identifiés.</p>

            {resultatsLabo.map((r, idx) => (
              <div key={idx} className="p-4 border border-gray-200 rounded-lg bg-gray-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500">Prélèvement {idx + 1}</span>
                  <button type="button" onClick={() => removeResultatLabo(idx)} className="text-red-400 hover:text-red-600">
                    <X size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Type de prélèvement</label>
                    <SearchableSelect
                      options={SAMPLE_TYPES.map(t => ({ value: t.code, label: t.label }))}
                      value={r.typePrelevement}
                      onChange={val => updateResultatLabo(idx, "typePrelevement", val)}
                      placeholder="Sélectionner..."
                    />
                  </div>
                  <div>
                    <label className="label">Date du prélèvement</label>
                    <input type="date" value={r.datePrelevement} onChange={e => updateResultatLabo(idx, "datePrelevement", e.target.value)} className={inputCls(false)} />
                  </div>
                  <div>
                    <label className="label">Germe identifié</label>
                    <SearchableSelect
                      options={germes.map(g => ({ value: g.id, label: g.nom }))}
                      value={r.germeId}
                      onChange={val => updateResultatLabo(idx, "germeId", val)}
                      placeholder="Sélectionner un germe..."
                    />
                  </div>
                  <div>
                    <label className="label">Résultat</label>
                    <select value={r.resultat} onChange={e => updateResultatLabo(idx, "resultat", e.target.value)} className={inputCls(false)}>
                      <option value="">Sélectionner...</option>
                      <option value="positif">Positif</option>
                      <option value="negatif">Négatif</option>
                      <option value="en_attente">En attente</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Laboratoire</label>
                    <input value={r.laboratoire} onChange={e => updateResultatLabo(idx, "laboratoire", e.target.value)} className={inputCls(false)} placeholder="Nom du laboratoire..." />
                  </div>
                  <div>
                    <label className="label">Antibiogramme</label>
                    <input value={r.antibiogramme} onChange={e => updateResultatLabo(idx, "antibiogramme", e.target.value)} className={inputCls(false)} placeholder="Résultat antibiogramme..." />
                  </div>
                  <div className="col-span-2">
                    <label className="label">Notes</label>
                    <input value={r.notes} onChange={e => updateResultatLabo(idx, "notes", e.target.value)} className={inputCls(false)} placeholder="Notes supplémentaires..." />
                  </div>
                </div>
              </div>
            ))}

            <button type="button" onClick={addResultatLabo} className="btn btn-secondary btn-sm">
              <Plus size={14} />
              Ajouter un prélèvement
            </button>
          </div>
        </div>

        {/* ── Section 6 — Fiche spécifique (conditionnelle) ─────────── */}
        {ficheSpecifiqueSlug && (
          <FicheDynamiqueRenderer
            slug={ficheSpecifiqueSlug}
            register={register}
            watch={watch}
            setValue={setValue}
            errors={errors}
            control={control}
          />
        )}

        {/* Error banner */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
            <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
            <div>
              <p className="text-sm font-medium text-red-800">Erreur lors de la soumission</p>
              <p className="text-sm text-red-600 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Validation errors summary */}
        {Object.keys(errors).length > 0 && !error && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
            <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
            <div>
              <p className="text-sm font-medium text-amber-800">Veuillez corriger les champs suivants :</p>
              <ul className="text-sm text-amber-700 mt-1 list-disc list-inside">
                {Object.entries(errors).map(([key, err]) => (
                  <li key={key}>{(err as { message?: string })?.message || key}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 pb-8">
          {isEditMode ? (
            <>
              <Link
                href={`/declarations/${casId}`}
                className="btn btn-secondary btn-lg"
              >
                Annuler
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-success btn-lg flex-1"
              >
                {loading ? (
                  <><Loader2 size={15} className="animate-spin" /> Enregistrement...</>
                ) : (
                  <><CheckCircle2 size={15} /> Sauvegarder les Modifications</>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={saveBrouillon}
                disabled={brouillonLoading}
                className="btn btn-secondary btn-lg"
              >
                {brouillonLoading ? (
                  <><Loader2 size={14} className="animate-spin" /> Enregistrement...</>
                ) : (
                  <><FileText size={14} /> Enregistrer en tant que brouillon</>
                )}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-success btn-lg flex-1"
              >
                {loading ? (
                  <><Loader2 size={15} className="animate-spin" /> Enregistrement...</>
                ) : (
                  <><CheckCircle2 size={15} /> Valider la Déclaration</>
                )}
              </button>
            </>
          )}
        </div>
      </form>
    </>
  )
}
