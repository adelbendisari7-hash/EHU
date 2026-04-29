"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { cn } from "@/utils/cn"
import { toast } from "sonner"
import { Loader2, CheckCircle2, AlertCircle, Search, ChevronDown, X, Plus } from "lucide-react"
import { SERVICES_EHU } from "@/constants/services"
import { NATIONALITIES } from "@/constants/nationalities"
import { SYMPTOM_CATEGORIES } from "@/constants/symptoms"
import { SAMPLE_TYPES } from "@/constants/sample-types"
import { LIEU_TYPES } from "@/constants/lieu-types"
import DiseaseCombobox from "@/components/ui/disease-combobox"

interface Wilaya { id: string; nom: string; code: string }
interface Commune { id: string; nom: string; wilayadId: string }
interface Etablissement { id: string; nom: string }
interface SymptomeRef { id: string; nom: string; code: string; categorie: string | null }
interface GermeRef { id: string; nom: string; code: string; type: string | null }
interface Maladie { id: string; nom: string; codeCim10: string; categorie: string; nomCourt?: string | null; hasFicheSpecifique: boolean; ficheSpecifiqueSlug?: string | null }
interface GroupedMaladies { categorie_1_mdo: Maladie[]; categorie_2_epidemique: Maladie[]; categorie_3_bmr: Maladie[] }
interface MedecinDeclarant { id: string; nom: string; prenom: string; service: string }

interface LieuEntry { nom: string; type: string; adresse: string; communeId: string; dateDebut: string; dateFin: string }
interface ResultatLaboEntry { typePrelevement: string; datePrelevement: string; germeId: string; resultat: string; antibiogramme: string; laboratoire: string; notes: string }

function toDateStr(val: string | null | undefined): string {
  if (!val) return ""
  try { return new Date(val).toISOString().slice(0, 10) } catch { return "" }
}

function SearchableSelect({ options, value, onChange, placeholder }: {
  options: { value: string; label: string }[]
  value: string; onChange: (val: string) => void; placeholder: string
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
  const selected = options.find(o => o.value === value)
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(!open)} className="input w-full text-left flex items-center justify-between">
        <span className={selected ? "text-gray-900" : "text-gray-400"}>{selected?.label || placeholder}</span>
        <ChevronDown size={14} className="text-gray-400" />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="input w-full pl-8 text-sm" autoFocus />
            </div>
          </div>
          <div className="overflow-y-auto max-h-48">
            {filtered.length === 0 ? (
              <p className="p-3 text-sm text-gray-400 text-center">Aucun résultat</p>
            ) : filtered.map(opt => (
              <button key={opt.value} type="button" onClick={() => { onChange(opt.value); setOpen(false); setSearch("") }}
                className={cn("w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors", value === opt.value && "bg-blue-50 text-blue-700 font-medium")}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
      {open && <div className="fixed inset-0 z-40" onClick={() => { setOpen(false); setSearch("") }} />}
    </div>
  )
}

export default function EditCasPage() {
  const params = useParams()
  const router = useRouter()
  const casId = params.casId as string
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  // Reference data
  const [groupedMaladies, setGroupedMaladies] = useState<GroupedMaladies>({ categorie_1_mdo: [], categorie_2_epidemique: [], categorie_3_bmr: [] })
  const [wilayas, setWilayas] = useState<Wilaya[]>([])
  const [allCommunes, setAllCommunes] = useState<Commune[]>([])
  const [filteredCommunes, setFilteredCommunes] = useState<Commune[]>([])
  const [etablissements, setEtablissements] = useState<Etablissement[]>([])
  const [symptomes, setSymptomes] = useState<SymptomeRef[]>([])
  const [germes, setGermes] = useState<GermeRef[]>([])
  const [medecins, setMedecins] = useState<MedecinDeclarant[]>([])

  // Form state
  const [form, setForm] = useState({
    // Header
    medecinDeclarantId: "",
    nomMedecinDeclarant: "",
    prenomMedecinDeclarant: "",
    serviceDeclarant: "",
    // Patient
    firstName: "", lastName: "", nin: "", dateOfBirth: "",
    ageAns: "" as string | number, ageMois: "" as string | number, ageJours: "" as string | number,
    sex: "" as "homme" | "femme" | "",
    address: "", wilayadId: "", communeId: "", phone: "", emailPatient: "", profession: "", lieuTravail: "",
    estEtranger: false, nationalite: "", nationaliteCode: "",
    // Clinical
    maladieId: "", dateDebutSymptomes: "", dateDiagnostic: "", symptomesTexte: "",
    observation: "" as "cas_confirme" | "cas_suspect" | "",
    modeConfirmation: "" as "clinique" | "biologique" | "epidemiologique" | "",
    atcd: "", casSimilaire: false,
    // Hospitalisation
    estHospitalise: false, dateHospitalisation: "", structureHospitalisationId: "", serviceHospitalisation: "",
    estEvacue: false, dateEvacuation: "", structureEvacuation: "",
    evolution: "" as string, dateSortie: "", dateDeces: "",
    // Other
    service: "", notesCliniques: "", resultatLabo: "",
    etablissementId: "",
  })
  const [selectedSymptomeIds, setSelectedSymptomeIds] = useState<string[]>([])
  const [lieux, setLieux] = useState<LieuEntry[]>([])
  const [resultatsLabo, setResultatsLabo] = useState<ResultatLaboEntry[]>([])

  // Service dropdown
  const [serviceDeclarantOpen, setServiceDeclarantOpen] = useState(false)
  const [serviceDeclarantSearch, setServiceDeclarantSearch] = useState("")

  // Medecin autocomplete
  const [medecinQuery, setMedecinQuery] = useState("")
  const [medecinOpen, setMedecinOpen] = useState(false)
  const medecinInputRef = useRef<HTMLInputElement>(null)

  // Age/DOB refs to prevent circular updates
  const ageChangedByUser = useRef(false)
  const dobChangedByUser = useRef(false)

  // Load reference data
  useEffect(() => {
    Promise.all([
      fetch("/api/maladies").then(r => r.json()),
      fetch("/api/communes").then(r => r.json()),
      fetch("/api/etablissements").then(r => r.json()),
      fetch("/api/symptomes").then(r => r.json()),
      fetch("/api/germes").then(r => r.json()),
      fetch("/api/medecins-declarants").then(r => r.json()),
    ]).then(([maladiesData, communesData, etabData, sympData, germeData, medData]) => {
      setGroupedMaladies(maladiesData.grouped)
      setAllCommunes(communesData)
      setFilteredCommunes(communesData)
      const wilayadMap = new Map<string, Wilaya>()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      communesData.forEach((c: any) => {
        if (c.wilaya && !wilayadMap.has(c.wilaya.id)) {
          wilayadMap.set(c.wilaya.id, { id: c.wilaya.id, nom: c.wilaya.nom, code: c.wilaya.code ?? "" })
        }
      })
      setWilayas(Array.from(wilayadMap.values()).sort((a, b) => a.nom.localeCompare(b.nom)))
      setEtablissements(etabData)
      setSymptomes(sympData)
      setGermes(germeData)
      setMedecins(medData)
    }).catch(console.error)
  }, [])

  // Load case data
  useEffect(() => {
    fetch(`/api/cas/${casId}`)
      .then(r => r.json())
      .then(data => {
        const p = data.patient
        const md = data.medecinDeclarant
        setForm({
          medecinDeclarantId: md?.id ?? "",
          nomMedecinDeclarant: md?.nom ?? "",
          prenomMedecinDeclarant: md?.prenom ?? "",
          serviceDeclarant: data.serviceDeclarant ?? "",
          firstName: p.firstName ?? "",
          lastName: p.lastName ?? "",
          nin: data.nin ?? "",
          dateOfBirth: toDateStr(p.dateOfBirth),
          ageAns: data.ageAns ?? "",
          ageMois: data.ageMois ?? "",
          ageJours: data.ageJours ?? "",
          sex: p.sex ?? "",
          address: p.address ?? "",
          wilayadId: p.commune?.wilayad?.id ?? "",
          communeId: p.communeId ?? "",
          phone: p.phone ?? "",
          emailPatient: data.emailPatient ?? "",
          profession: data.profession ?? "",
          lieuTravail: data.lieuTravail ?? "",
          estEtranger: data.estEtranger ?? false,
          nationalite: data.nationalite ?? "",
          nationaliteCode: data.nationaliteCode ?? "",
          maladieId: data.maladieId ?? "",
          dateDebutSymptomes: toDateStr(data.dateDebutSymptomes),
          dateDiagnostic: toDateStr(data.dateDiagnostic),
          symptomesTexte: data.symptomesTexte ?? "",
          observation: data.observation ?? "",
          modeConfirmation: data.modeConfirmation ?? "",
          atcd: data.atcd ?? "",
          casSimilaire: data.casSimilaire ?? false,
          estHospitalise: data.estHospitalise ?? false,
          dateHospitalisation: toDateStr(data.dateHospitalisation),
          structureHospitalisationId: data.structureHospitalisationId ?? "",
          serviceHospitalisation: data.serviceHospitalisation ?? "",
          estEvacue: data.estEvacue ?? false,
          dateEvacuation: toDateStr(data.dateEvacuation),
          structureEvacuation: data.structureEvacuation ?? "",
          evolution: data.evolution ?? "",
          dateSortie: toDateStr(data.dateSortie),
          dateDeces: toDateStr(data.dateDeces),
          service: data.service ?? "",
          notesCliniques: data.notesCliniques ?? "",
          resultatLabo: data.resultatLabo ?? "",
          etablissementId: data.etablissementId ?? "",
        })
        if (md) setMedecinQuery(`${md.prenom} ${md.nom}`)
        // Pre-fill symptomes
        if (Array.isArray(data.symptomes)) {
          setSelectedSymptomeIds(data.symptomes.map((s: { symptomeId: string }) => s.symptomeId))
        }
        // Pre-fill lieux
        if (Array.isArray(data.lieux)) {
          setLieux(data.lieux.map((l: { nom: string; type: string | null; adresse: string | null; communeId: string | null; dateDebut: string | null; dateFin: string | null }) => ({
            nom: l.nom, type: l.type ?? "", adresse: l.adresse ?? "",
            communeId: l.communeId ?? "", dateDebut: toDateStr(l.dateDebut), dateFin: toDateStr(l.dateFin),
          })))
        }
        // Pre-fill labo
        if (Array.isArray(data.resultatsLabo)) {
          setResultatsLabo(data.resultatsLabo.map((r: { typePrelevement: string; datePrelevement: string; germeId: string | null; resultat: string | null; antibiogramme: string | null; laboratoire: string | null; notes: string | null }) => ({
            typePrelevement: r.typePrelevement, datePrelevement: toDateStr(r.datePrelevement),
            germeId: r.germeId ?? "", resultat: r.resultat ?? "", antibiogramme: r.antibiogramme ?? "",
            laboratoire: r.laboratoire ?? "", notes: r.notes ?? "",
          })))
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [casId])

  // Wilaya → filter communes
  useEffect(() => {
    if (form.wilayadId) {
      setFilteredCommunes(allCommunes.filter(c => c.wilayadId === form.wilayadId))
    } else {
      setFilteredCommunes(allCommunes)
    }
  }, [form.wilayadId, allCommunes])

  // DOB → age
  useEffect(() => {
    if (ageChangedByUser.current) { ageChangedByUser.current = false; return }
    if (!form.dateOfBirth) return
    dobChangedByUser.current = true
    try {
      const dob = new Date(form.dateOfBirth)
      if (isNaN(dob.getTime())) return
      const today = new Date()
      let ans = today.getFullYear() - dob.getFullYear()
      let mois = today.getMonth() - dob.getMonth()
      let jours = today.getDate() - dob.getDate()
      if (jours < 0) { mois--; jours += new Date(today.getFullYear(), today.getMonth(), 0).getDate() }
      if (mois < 0) { ans--; mois += 12 }
      setForm(f => ({ ...f, ageAns: Math.max(0, ans), ageMois: Math.max(0, mois), ageJours: Math.max(0, jours) }))
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.dateOfBirth])

  // ageAns → DOB
  useEffect(() => {
    if (dobChangedByUser.current) { dobChangedByUser.current = false; return }
    const ans = Number(form.ageAns)
    if (isNaN(ans) || form.ageAns === "") return
    ageChangedByUser.current = true
    const year = new Date().getFullYear() - ans
    setForm(f => ({ ...f, dateOfBirth: `${year}-06-30` }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.ageAns])

  const set = (field: string, value: unknown) => setForm(f => ({ ...f, [field]: value }))
  const inp = (field: string) => ({ value: (form as Record<string, unknown>)[field] as string ?? "", onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => set(field, e.target.value) })

  const medecinSuggestions = medecinQuery.length >= 2
    ? medecins.filter(m => `${m.nom} ${m.prenom}`.toLowerCase().includes(medecinQuery.toLowerCase()) || `${m.prenom} ${m.nom}`.toLowerCase().includes(medecinQuery.toLowerCase())).slice(0, 8)
    : []

  const selectMedecin = (m: MedecinDeclarant) => {
    setForm(f => ({ ...f, medecinDeclarantId: m.id, nomMedecinDeclarant: m.nom, prenomMedecinDeclarant: m.prenom, serviceDeclarant: m.service }))
    setMedecinQuery(`${m.prenom} ${m.nom}`)
    setMedecinOpen(false)
  }

  const toggleSymptome = (id: string) =>
    setSelectedSymptomeIds(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])

  const symptomesByCategory = SYMPTOM_CATEGORIES.map(cat => ({
    ...cat,
    items: symptomes.filter(s => s.categorie === cat.key),
  })).filter(g => g.items.length > 0)

  const save = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")
    try {
      let statut: string | undefined
      if (form.observation === "cas_confirme") statut = "confirme"
      else if (form.observation === "cas_suspect") statut = "suspect"

      const res = await fetch(`/api/cas/${casId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          statut,
          patient: {
            firstName: form.firstName,
            lastName: form.lastName,
            dateOfBirth: form.dateOfBirth || null,
            sex: form.sex || null,
            address: form.address,
            communeId: form.communeId || null,
            phone: form.phone || null,
          },
          ageAns: form.ageAns !== "" ? Number(form.ageAns) : null,
          ageMois: form.ageMois !== "" ? Number(form.ageMois) : null,
          ageJours: form.ageJours !== "" ? Number(form.ageJours) : null,
          symptomeIds: selectedSymptomeIds,
          lieux: lieux.filter(l => l.nom.trim()),
          resultatsLabo: resultatsLabo.filter(r => r.typePrelevement),
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Erreur lors de la mise à jour")
      }
      toast.success("Déclaration mise à jour")
      router.push(`/declarations/${casId}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue"
      setError(msg)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }, [casId, form, selectedSymptomeIds, lieux, resultatsLabo, router])

  const inputCls = "input w-full"
  const SectionHeader = ({ letter, title }: { letter: string; title: string }) => (
    <div className="px-5 py-3 flex items-center gap-3 border-b border-gray-100" style={{ backgroundColor: "var(--gray-50)" }}>
      <span className="w-6 h-6 rounded-md text-white text-[11px] font-bold flex items-center justify-center shrink-0" style={{ backgroundColor: "#1B4F8A" }}>{letter}</span>
      <h2 className="text-[13px] font-semibold text-gray-800">{title}</h2>
    </div>
  )
  const ToggleGroup = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <div className="flex gap-3">
      {([true, false] as const).map(val => (
        <label key={String(val)} className={cn("flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-all flex-1 justify-center text-sm",
          value === val ? "border-[#1B4F8A] bg-[#EBF1FA] text-[#1B4F8A] font-medium" : "border-gray-200 text-gray-600 hover:border-gray-300")}>
          <input type="radio" className="sr-only" checked={value === val} onChange={() => onChange(val)} />
          {val ? "Oui" : "Non"}
        </label>
      ))}
    </div>
  )

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: "#1B4F8A" }} />
    </div>
  )

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/declarations/${casId}`} className="text-sm text-gray-400 hover:text-gray-600">← Retour</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-semibold text-gray-800">Modifier la Déclaration</h1>
      </div>

      <form onSubmit={save} className="max-w-3xl space-y-6">

        {/* ── En-tête ── */}
        <div className="card">
          <SectionHeader letter="H" title="En-tête de déclaration" />
          <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Médecin déclarant */}
            <div className="md:col-span-2">
              <label className="label">Médecin déclarant <span className="text-red-500">*</span></label>
              {form.nomMedecinDeclarant && form.prenomMedecinDeclarant ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#1B4F8A] bg-[#EBF1FA]">
                  <span className="flex-1 text-sm font-medium text-[#1B4F8A]">Dr {form.prenomMedecinDeclarant} {form.nomMedecinDeclarant}</span>
                  <button type="button" onClick={() => { setForm(f => ({ ...f, medecinDeclarantId: "", nomMedecinDeclarant: "", prenomMedecinDeclarant: "" })); setMedecinQuery("") }}
                    className="text-[#1B4F8A] hover:text-blue-900 text-xs underline">Modifier</button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input ref={medecinInputRef} type="text" value={medecinQuery} onChange={e => { setMedecinQuery(e.target.value); setMedecinOpen(true) }}
                      onFocus={() => setMedecinOpen(true)} placeholder="Rechercher ou saisir le médecin..." className="input w-full pl-9" />
                  </div>
                  {medecinOpen && medecinQuery.length >= 2 && medecinSuggestions.length > 0 && (
                    <div className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto w-full">
                      {medecinSuggestions.map(m => (
                        <button key={m.id} type="button" onClick={() => selectMedecin(m)} className="w-full text-left px-3 py-2.5 hover:bg-gray-50 border-b border-gray-50 last:border-0">
                          <p className="text-sm font-medium text-gray-800">Dr {m.prenom} {m.nom}</p>
                          <p className="text-xs text-gray-400">{m.service}</p>
                        </button>
                      ))}
                    </div>
                  )}
                  {medecinOpen && <div className="fixed inset-0 z-40" onClick={() => setMedecinOpen(false)} />}
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <input value={form.prenomMedecinDeclarant} onChange={e => set("prenomMedecinDeclarant", e.target.value)} placeholder="Prénom *" className={inputCls} />
                    <input value={form.nomMedecinDeclarant} onChange={e => set("nomMedecinDeclarant", e.target.value)} placeholder="Nom *" className={inputCls} />
                  </div>
                </>
              )}
            </div>
            {/* Service déclarant */}
            <div>
              <label className="label">Service déclarant <span className="text-red-500">*</span></label>
              <div className="relative">
                <button type="button" onClick={() => setServiceDeclarantOpen(!serviceDeclarantOpen)}
                  className="input w-full text-left flex items-center justify-between">
                  <span className={form.serviceDeclarant ? "text-gray-900 text-sm truncate" : "text-gray-400 text-sm"}>{form.serviceDeclarant || "Sélectionner..."}</span>
                  <ChevronDown size={14} className="text-gray-400 shrink-0 ml-2" />
                </button>
                {serviceDeclarantOpen && (
                  <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-hidden">
                    <div className="p-2 border-b border-gray-100">
                      <div className="relative">
                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="text" value={serviceDeclarantSearch} onChange={e => setServiceDeclarantSearch(e.target.value)}
                          placeholder="Rechercher..." className="input w-full pl-8 text-sm" autoFocus />
                      </div>
                    </div>
                    <div className="overflow-y-auto max-h-48">
                      {SERVICES_EHU.filter(s => s.nom.toLowerCase().includes(serviceDeclarantSearch.toLowerCase())).map(s => (
                        <button key={s.code} type="button"
                          onClick={() => { set("serviceDeclarant", s.nom); setServiceDeclarantOpen(false); setServiceDeclarantSearch("") }}
                          className={cn("w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors", form.serviceDeclarant === s.nom && "bg-blue-50 text-[#1B4F8A] font-medium")}>
                          {s.nom}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {serviceDeclarantOpen && <div className="fixed inset-0 z-40" onClick={() => { setServiceDeclarantOpen(false); setServiceDeclarantSearch("") }} />}
              </div>
            </div>
          </div>
        </div>

        {/* ── Section 1 — Informations Administratives ── */}
        <div className="card">
          <SectionHeader letter="1" title="Informations Administratives" />
          <div className="p-5 grid grid-cols-2 gap-4">
            <div>
              <label className="label">Nom <span className="text-red-500">*</span></label>
              <input {...inp("lastName")} className={inputCls} placeholder="Benali" />
            </div>
            <div>
              <label className="label">Prénom <span className="text-red-500">*</span></label>
              <input {...inp("firstName")} className={inputCls} placeholder="Ahmed" />
            </div>
            <div>
              <label className="label">NIN</label>
              <input {...inp("nin")} className={inputCls} maxLength={18} placeholder="18 caractères max" />
            </div>
            <div>
              <label className="label">Date de naissance</label>
              <input type="date" value={form.dateOfBirth}
                onChange={e => { dobChangedByUser.current = true; ageChangedByUser.current = false; set("dateOfBirth", e.target.value) }}
                className={inputCls} />
            </div>
            <div>
              <label className="label">Âge (Ans / Mois / Jours)</label>
              <div className="flex gap-2">
                <input type="number" min={0} max={150} value={form.ageAns}
                  onChange={e => { ageChangedByUser.current = true; dobChangedByUser.current = false; set("ageAns", e.target.value) }}
                  className={inputCls} placeholder="Ans" />
                <input type="number" min={0} max={11} value={form.ageMois} onChange={e => set("ageMois", e.target.value)} className={inputCls} placeholder="Mois" />
                <input type="number" min={0} max={30} value={form.ageJours} onChange={e => set("ageJours", e.target.value)} className={inputCls} placeholder="Jours" />
              </div>
            </div>
            <div>
              <label className="label">Sexe <span className="text-red-500">*</span></label>
              <div className="flex gap-3">
                {(["homme", "femme"] as const).map(s => (
                  <label key={s} className={cn("flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-all flex-1 justify-center text-sm",
                    form.sex === s ? "border-[#1B4F8A] bg-[#EBF1FA] text-[#1B4F8A] font-medium" : "border-gray-200 text-gray-600")}>
                    <input type="radio" className="sr-only" checked={form.sex === s} onChange={() => set("sex", s)} />
                    {s === "homme" ? "Masculin" : "Féminin"}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Wilaya</label>
              <select value={form.wilayadId} onChange={e => { set("wilayadId", e.target.value); set("communeId", "") }} className={inputCls}>
                <option value="">Sélectionner...</option>
                {wilayas.map(w => <option key={w.id} value={w.id}>{w.nom}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Commune</label>
              <select {...inp("communeId")} className={inputCls}>
                <option value="">Sélectionner...</option>
                {filteredCommunes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Adresse complète <span className="text-red-500">*</span></label>
              <textarea {...inp("address")} rows={2} className={cn(inputCls, "h-auto py-2 resize-none")} placeholder="Numéro, rue, quartier..." />
            </div>
            <div>
              <label className="label">Profession</label>
              <input {...inp("profession")} className={inputCls} />
            </div>
            <div>
              <label className="label">Téléphone</label>
              <input {...inp("phone")} className={inputCls} />
            </div>
            <div>
              <label className="label">E-mail</label>
              <input type="email" {...inp("emailPatient")} className={inputCls} />
            </div>
            <div>
              <label className="label">Lieu de travail / École</label>
              <input {...inp("lieuTravail")} className={inputCls} />
            </div>
            <div className="col-span-2">
              <label className="label">Ressortissant étranger</label>
              <ToggleGroup value={form.estEtranger} onChange={v => set("estEtranger", v)} />
            </div>
            {form.estEtranger && (
              <div className="col-span-2">
                <label className="label">Nationalité</label>
                <SearchableSelect
                  options={NATIONALITIES.map(n => ({ value: n.code, label: n.label }))}
                  value={form.nationaliteCode}
                  onChange={val => { set("nationaliteCode", val); const nat = NATIONALITIES.find(n => n.code === val); set("nationalite", nat?.label ?? val) }}
                  placeholder="Sélectionner une nationalité..."
                />
              </div>
            )}
          </div>
        </div>

        {/* ── Section 2 — Hospitalisation ── */}
        <div className="card">
          <SectionHeader letter="2" title="Hospitalisation & Évacuation" />
          <div className="p-5 grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Hospitalisation</label>
              <ToggleGroup value={form.estHospitalise} onChange={v => set("estHospitalise", v)} />
            </div>
            {form.estHospitalise && (
              <>
                <div>
                  <label className="label">Date d&apos;hospitalisation</label>
                  <input type="date" {...inp("dateHospitalisation")} className={inputCls} />
                </div>
                <div>
                  <label className="label">Structure</label>
                  <select {...inp("structureHospitalisationId")} className={inputCls}>
                    <option value="">Sélectionner...</option>
                    {etablissements.map(e => <option key={e.id} value={e.id}>{e.nom}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Service d&apos;hospitalisation</label>
                  <input {...inp("serviceHospitalisation")} className={inputCls} />
                </div>
              </>
            )}
            <div className="col-span-2">
              <label className="label">Évacuation</label>
              <ToggleGroup value={form.estEvacue} onChange={v => set("estEvacue", v)} />
            </div>
            {form.estEvacue && (
              <>
                <div>
                  <label className="label">Date d&apos;évacuation</label>
                  <input type="date" {...inp("dateEvacuation")} className={inputCls} />
                </div>
                <div>
                  <label className="label">Structure d&apos;évacuation</label>
                  <input {...inp("structureEvacuation")} className={inputCls} />
                </div>
              </>
            )}
            <div className="col-span-2">
              <label className="label">Évolution</label>
              <div className="grid grid-cols-3 gap-2">
                {(["guerison", "en_cours_guerison", "sortant", "toujours_malade", "autre", "deces"] as const).map(opt => (
                  <label key={opt} className={cn("flex items-center gap-2 px-3 py-2.5 rounded-lg border cursor-pointer transition-all text-sm",
                    form.evolution === opt
                      ? (opt === "deces" ? "border-red-400 bg-red-50 text-red-700 font-medium" : "border-[#1B4F8A] bg-[#EBF1FA] text-[#1B4F8A] font-medium")
                      : "border-gray-200 text-gray-600 hover:border-gray-300")}>
                    <input type="radio" className="sr-only" checked={form.evolution === opt} onChange={() => set("evolution", opt)} />
                    {{ guerison: "Guérison", en_cours_guerison: "En cours de guérison", sortant: "Sortant", toujours_malade: "Toujours malade", autre: "Autre", deces: "Décès" }[opt]}
                  </label>
                ))}
              </div>
              {(form.evolution === "guerison" || form.evolution === "sortant") && (
                <div className="mt-3"><label className="label">Date de sortie</label><input type="date" {...inp("dateSortie")} className={inputCls} /></div>
              )}
              {form.evolution === "deces" && (
                <div className="mt-3"><label className="label">Date du décès</label><input type="date" {...inp("dateDeces")} className={inputCls} /></div>
              )}
            </div>
          </div>
        </div>

        {/* ── Section 3 — Données Cliniques ── */}
        <div className="card">
          <SectionHeader letter="3" title="Données Cliniques" />
          <div className="p-5 grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Maladie <span className="text-red-500">*</span></label>
              <DiseaseCombobox grouped={groupedMaladies} value={form.maladieId} onChange={id => set("maladieId", id)} />
            </div>
            <div>
              <label className="label">Date d&apos;apparition des symptômes</label>
              <input type="date" {...inp("dateDebutSymptomes")} className={inputCls} />
            </div>
            <div>
              <label className="label">Date du diagnostic</label>
              <input type="date" {...inp("dateDiagnostic")} className={inputCls} />
            </div>
            {/* Symptômes */}
            <div className="col-span-2">
              <label className="label">Symptômes codés</label>
              {selectedSymptomeIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {selectedSymptomeIds.map(id => {
                    const s = symptomes.find(x => x.id === id)
                    if (!s) return null
                    return (
                      <span key={id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        {s.nom}
                        <button type="button" onClick={() => toggleSymptome(id)}><X size={12} /></button>
                      </span>
                    )
                  })}
                </div>
              )}
              <div className="border border-gray-200 rounded-lg max-h-52 overflow-y-auto">
                {symptomesByCategory.map(cat => (
                  <div key={cat.key}>
                    <div className="px-3 py-1.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-100 sticky top-0">{cat.label}</div>
                    <div className="grid grid-cols-2 gap-x-2 px-3 py-1.5">
                      {cat.items.map(s => (
                        <label key={s.id} className={cn("flex items-center gap-2 px-2 py-1.5 rounded text-sm cursor-pointer hover:bg-gray-50", selectedSymptomeIds.includes(s.id) && "bg-blue-50")}>
                          <input type="checkbox" checked={selectedSymptomeIds.includes(s.id)} onChange={() => toggleSymptome(s.id)} className="rounded border-gray-300 text-blue-600" />
                          <span className="text-gray-700">{s.nom}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="col-span-2">
              <label className="label">Symptômes supplémentaires</label>
              <textarea {...inp("symptomesTexte")} rows={2} className={cn(inputCls, "h-auto py-2 resize-none")} />
            </div>
            {/* Observation */}
            <div className="col-span-2">
              <label className="label">Observation <span className="ml-2 text-[11px] text-gray-400 font-normal">(détermine le statut)</span></label>
              <div className="flex gap-4">
                {([{ value: "cas_confirme", label: "Cas confirmé" }, { value: "cas_suspect", label: "Cas suspect" }] as const).map(opt => (
                  <label key={opt.value} className={cn("flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-all flex-1 justify-center text-sm",
                    form.observation === opt.value ? "border-[#1B4F8A] bg-[#EBF1FA] text-[#1B4F8A] font-medium" : "border-gray-200 text-gray-600 hover:border-gray-300")}>
                    <input type="radio" className="sr-only" checked={form.observation === opt.value} onChange={() => set("observation", opt.value)} />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
            {form.observation === "cas_confirme" && (
              <div className="col-span-2">
                <label className="label">Mode de confirmation</label>
                <div className="grid grid-cols-3 gap-2">
                  {([{ value: "clinique", label: "Clinique" }, { value: "biologique", label: "Biologique" }, { value: "epidemiologique", label: "Épidémiologique" }] as const).map(opt => (
                    <label key={opt.value} className={cn("flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border cursor-pointer transition-all text-sm",
                      form.modeConfirmation === opt.value ? "border-green-500 bg-green-50 text-green-700 font-medium" : "border-gray-200 text-gray-600")}>
                      <input type="radio" className="sr-only" checked={form.modeConfirmation === opt.value} onChange={() => set("modeConfirmation", opt.value)} />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div className="col-span-2">
              <label className="label">ATCD</label>
              <textarea {...inp("atcd")} rows={2} className={cn(inputCls, "h-auto py-2 resize-none")} />
            </div>
          </div>
        </div>

        {/* ── Section 4 — Lieux ── */}
        <div className="card">
          <SectionHeader letter="4" title="Lieux Fréquentés" />
          <div className="p-5 space-y-4">
            {lieux.map((lieu, idx) => (
              <div key={idx} className="p-4 border border-gray-200 rounded-lg bg-gray-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500">Lieu {idx + 1}</span>
                  <button type="button" onClick={() => setLieux(lieux.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600"><X size={16} /></button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label">Nom</label><input value={lieu.nom} onChange={e => setLieux(lieux.map((l, i) => i === idx ? { ...l, nom: e.target.value } : l))} className={inputCls} /></div>
                  <div>
                    <label className="label">Type</label>
                    <select value={lieu.type} onChange={e => setLieux(lieux.map((l, i) => i === idx ? { ...l, type: e.target.value } : l))} className={inputCls}>
                      <option value="">Sélectionner...</option>
                      {LIEU_TYPES.map(t => <option key={t.code} value={t.code}>{t.label}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2"><label className="label">Adresse</label><input value={lieu.adresse} onChange={e => setLieux(lieux.map((l, i) => i === idx ? { ...l, adresse: e.target.value } : l))} className={inputCls} /></div>
                  <div><label className="label">Date début</label><input type="date" value={lieu.dateDebut} onChange={e => setLieux(lieux.map((l, i) => i === idx ? { ...l, dateDebut: e.target.value } : l))} className={inputCls} /></div>
                  <div><label className="label">Date fin</label><input type="date" value={lieu.dateFin} onChange={e => setLieux(lieux.map((l, i) => i === idx ? { ...l, dateFin: e.target.value } : l))} className={inputCls} /></div>
                </div>
              </div>
            ))}
            {lieux.length < 4 && (
              <button type="button" onClick={() => setLieux([...lieux, { nom: "", type: "", adresse: "", communeId: "", dateDebut: "", dateFin: "" }])} className="btn btn-secondary btn-sm">
                <Plus size={14} /> Ajouter un lieu ({lieux.length}/4)
              </button>
            )}
          </div>
        </div>

        {/* ── Section 5 — Résultats Labo ── */}
        <div className="card">
          <SectionHeader letter="5" title="Prélèvements & Résultats Laboratoire" />
          <div className="p-5 space-y-4">
            {resultatsLabo.map((r, idx) => (
              <div key={idx} className="p-4 border border-gray-200 rounded-lg bg-gray-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500">Prélèvement {idx + 1}</span>
                  <button type="button" onClick={() => setResultatsLabo(resultatsLabo.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600"><X size={16} /></button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Type</label>
                    <SearchableSelect options={SAMPLE_TYPES.map(t => ({ value: t.code, label: t.label }))} value={r.typePrelevement}
                      onChange={val => setResultatsLabo(resultatsLabo.map((x, i) => i === idx ? { ...x, typePrelevement: val } : x))} placeholder="Sélectionner..." />
                  </div>
                  <div><label className="label">Date</label><input type="date" value={r.datePrelevement} onChange={e => setResultatsLabo(resultatsLabo.map((x, i) => i === idx ? { ...x, datePrelevement: e.target.value } : x))} className={inputCls} /></div>
                  <div>
                    <label className="label">Germe</label>
                    <SearchableSelect options={germes.map(g => ({ value: g.id, label: g.nom }))} value={r.germeId}
                      onChange={val => setResultatsLabo(resultatsLabo.map((x, i) => i === idx ? { ...x, germeId: val } : x))} placeholder="Sélectionner..." />
                  </div>
                  <div>
                    <label className="label">Résultat</label>
                    <select value={r.resultat} onChange={e => setResultatsLabo(resultatsLabo.map((x, i) => i === idx ? { ...x, resultat: e.target.value } : x))} className={inputCls}>
                      <option value="">Sélectionner...</option>
                      <option value="positif">Positif</option>
                      <option value="negatif">Négatif</option>
                      <option value="en_attente">En attente</option>
                    </select>
                  </div>
                  <div><label className="label">Laboratoire</label><input value={r.laboratoire} onChange={e => setResultatsLabo(resultatsLabo.map((x, i) => i === idx ? { ...x, laboratoire: e.target.value } : x))} className={inputCls} /></div>
                  <div><label className="label">Antibiogramme</label><input value={r.antibiogramme} onChange={e => setResultatsLabo(resultatsLabo.map((x, i) => i === idx ? { ...x, antibiogramme: e.target.value } : x))} className={inputCls} /></div>
                </div>
              </div>
            ))}
            <button type="button" onClick={() => setResultatsLabo([...resultatsLabo, { typePrelevement: "", datePrelevement: "", germeId: "", resultat: "", antibiogramme: "", laboratoire: "", notes: "" }])} className="btn btn-secondary btn-sm">
              <Plus size={14} /> Ajouter un prélèvement
            </button>
          </div>
        </div>

        {/* Notes */}
        <div className="card p-5 space-y-4">
          <div>
            <label className="label">Notes cliniques</label>
            <textarea {...inp("notesCliniques")} rows={3} className={cn(inputCls, "h-auto py-2 resize-none")} />
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
            <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="flex gap-3 pb-8">
          <Link href={`/declarations/${casId}`} className="btn btn-secondary btn-lg">Annuler</Link>
          <button type="submit" disabled={saving} className="btn btn-success btn-lg flex-1">
            {saving ? <><Loader2 size={15} className="animate-spin" /> Enregistrement...</> : <><CheckCircle2 size={15} /> Sauvegarder les Modifications</>}
          </button>
        </div>
      </form>
    </div>
  )
}
