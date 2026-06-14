"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { createPortal } from "react-dom"
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
import { AlertCircle, CheckCircle2, Loader2, Plus, X, Search, ChevronDown, FileText, Paperclip } from "lucide-react"
import { FileUpload, type UploadedFile } from "@/components/shared/file-upload"
import { NATIONALITIES } from "@/constants/nationalities"
import { SYMPTOM_CATEGORIES } from "@/constants/symptoms"
import { SAMPLE_TYPES } from "@/constants/sample-types"
import { LIEU_TYPES } from "@/constants/lieu-types"
import { ANTECEDENTS_PREDEFINED } from "@/constants/antecedents"
import { SERVICES_EHU } from "@/constants/services"
import DateInput from "@/components/shared/date-input"

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
  // Header — médecin déclarant optionnel, service obligatoire
  medecinDeclarantId: z.string().optional(),
  nomMedecinDeclarant: z.string().optional(),
  prenomMedecinDeclarant: z.string().optional(),
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
  address: z.string().optional(),
  wilayadId: z.string().min(1, "Wilaya requise"),
  communeId: z.string().min(1, "Commune requise"),
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
  asymptomatique: z.boolean().optional(),
  observation: z.enum(["cas_confirme", "cas_suspect"], {
    error: "L'observation est obligatoire (cas confirmé ou cas suspect)",
  }),
  modeConfirmation: z.enum(["clinique", "biologique", "epidemiologique"]).optional().catch(undefined),
  atcd: z.string().optional(),
  casSimilaire: z.boolean().optional(),
  nombreCasSimilaires: optInt(),

  // Hospitalisation & Evacuation
  estHospitalise: z.boolean().optional(),
  dateHospitalisation: z.string().optional(),
  structureHospitalisationId: z.string().optional(),
  serviceHospitalisation: z.string().optional(),
  estEvacue: z.boolean().optional(),
  dateEvacuation: z.string().optional(),
  structureEvacuation: z.string().optional(),

  // Evolution
  evolution: z.enum(["guerison", "en_cours_guerison", "sortant", "toujours_malade", "autre", "deces"], {
    error: "L'évolution du cas est obligatoire",
  }),
  dateSortie: z.string().optional(),
  dateDeces: z.string().optional(),

  etablissementId: z.string().optional(),
  service: z.string().optional(),
  notesCliniques: z.string().optional(),
  resultatLabo: z.string().optional(),
  typeBmrId: z.string().optional(),
})

// ---------------------------------------------------------------------------
// Cross-field date integrity constraints — used as the form resolver
// (brouillonSchema keeps using declarationSchema.partial() — no strict checks there)
// ---------------------------------------------------------------------------
function pd(s: string | undefined | null): Date | null {
  if (!s) return null
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}

const declarationSchemaFull = declarationSchema.superRefine((data, ctx) => {
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  const MIN_DATE = new Date("1900-01-01")

  const dob   = pd(data.dateOfBirth)
  const dds   = pd(data.dateDebutSymptomes)
  const ddx   = pd(data.dateDiagnostic)
  const dhosp = pd(data.dateHospitalisation)
  const devac = pd(data.dateEvacuation)
  const dsort = pd(data.dateSortie)
  const ddec  = pd(data.dateDeces)
  const ddecl = pd(data.dateDeclaration)

  // ── Groupe 1 — Aucune date dans le futur ─────────────────────────────────
  if (dob   && dob   > today) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["dateOfBirth"],          message: "La date de naissance ne peut pas être dans le futur" })
  if (dds   && dds   > today) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["dateDebutSymptomes"],   message: "La date de début des symptômes ne peut pas être dans le futur" })
  if (ddx   && ddx   > today) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["dateDiagnostic"],       message: "La date de diagnostic ne peut pas être dans le futur" })
  if (dhosp && dhosp > today) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["dateHospitalisation"],  message: "La date d'hospitalisation ne peut pas être dans le futur" })
  if (devac && devac > today) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["dateEvacuation"],       message: "La date d'évacuation ne peut pas être dans le futur" })
  if (dsort && dsort > today) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["dateSortie"],           message: "La date de sortie ne peut pas être dans le futur" })
  if (ddec  && ddec  > today) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["dateDeces"],            message: "La date de décès ne peut pas être dans le futur" })
  if (ddecl && ddecl > today) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["dateDeclaration"],      message: "La date de déclaration ne peut pas être dans le futur" })

  // ── Groupe 2 — Cohérence avec la date de naissance ───────────────────────
  if (dob && dob < MIN_DATE)            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["dateOfBirth"],         message: "La date de naissance ne peut pas être antérieure à 1900" })
  if (dob && dds   && dds   < dob)      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["dateDebutSymptomes"],  message: "La date de début des symptômes ne peut pas être avant la naissance du patient" })
  if (dob && ddx   && ddx   < dob)      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["dateDiagnostic"],      message: "La date de diagnostic ne peut pas être avant la naissance du patient" })
  if (dob && dhosp && dhosp < dob)      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["dateHospitalisation"], message: "La date d'hospitalisation ne peut pas être avant la naissance du patient" })
  if (dob && dsort && dsort < dob)      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["dateSortie"],          message: "La date de sortie ne peut pas être avant la naissance du patient" })
  if (dob && ddec  && ddec  < dob)      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["dateDeces"],           message: "La date de décès ne peut pas être avant la naissance du patient" })
  if (dob && devac && devac < dob)      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["dateEvacuation"],      message: "La date d'évacuation ne peut pas être avant la naissance du patient" })

  // ── Groupe 3 — Séquence clinique (contraintes dures) ─────────────────────
  if (!data.asymptomatique && dds && ddx && ddx < dds)
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["dateDiagnostic"],      message: "La date de diagnostic ne peut pas précéder le début des symptômes" })
  if (dhosp && dsort && dsort < dhosp)
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["dateSortie"],          message: "La date de sortie doit être postérieure à la date d'hospitalisation" })
  if (dhosp && ddec  && ddec  < dhosp)
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["dateDeces"],           message: "La date de décès ne peut pas être avant la date d'hospitalisation" })
  if (dds   && ddec  && ddec  < dds)
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["dateDeces"],           message: "La date de décès ne peut pas être avant le début des symptômes" })
  if (dhosp && devac && devac < dhosp)
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["dateEvacuation"],      message: "La date d'évacuation doit être postérieure à la date d'hospitalisation" })

  // ── Groupe 5 — Cohérence logique ─────────────────────────────────────────
  if (data.evolution !== "deces" && ddec)
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["dateDeces"],           message: "Date de décès saisie alors que l'évolution sélectionnée n'est pas « décès »" })
  if (dsort && ddec) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["dateSortie"],          message: "Impossible de renseigner à la fois une date de sortie et une date de décès" })
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["dateDeces"],           message: "Impossible de renseigner à la fois une date de sortie et une date de décès" })
  }
  if (!data.estHospitalise) {
    if (dhosp) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["dateHospitalisation"], message: "Date d'hospitalisation saisie alors que le patient n'est pas marqué comme hospitalisé" })
    if (dsort) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["dateSortie"],          message: "Date de sortie saisie alors que le patient n'est pas marqué comme hospitalisé" })
    if (devac) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["dateEvacuation"],      message: "Date d'évacuation saisie alors que le patient n'est pas marqué comme hospitalisé" })
  }
})

// Brouillon schema — only the bare minimum
const brouillonSchema = declarationSchema.partial().extend({
  maladieId: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  sex: z.enum(["homme", "femme"]).optional(),
  address: z.string().optional(),
  wilayadId: z.string().optional(),
  communeId: z.string().optional(),
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
  pev: Maladie[]
  mth: Maladie[]
  zoonose: Maladie[]
  ist: Maladie[]
  vectorielle: Maladie[]
  nosocomiale: Maladie[]
  autre: Maladie[]
}

interface Wilaya { id: string; nom: string; code: string }
interface Commune { id: string; nom: string; wilayadId: string }
interface Etablissement { id: string; nom: string }
interface SymptomeRef { id: string; nom: string; code: string; categorie: string | null }
interface GermeRef { id: string; nom: string; code: string; type: string | null }

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
  files: UploadedFile[]
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
  const [activeIdx, setActiveIdx] = useState(-1)
  const [dropStyle, setDropStyle] = useState<React.CSSProperties>({})
  const btnRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = options.filter(o =>
    stripAccents(o.label.toLowerCase()).includes(stripAccents(search.toLowerCase()))
  )
  const selected = options.find(o => o.value === value)

  const calcStyle = useCallback(() => {
    if (!btnRef.current) return
    const r = btnRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - r.bottom - 8
    const spaceAbove = r.top - 8
    const maxH = 260
    if (spaceBelow >= 120 || spaceBelow >= spaceAbove) {
      setDropStyle({ position: "fixed", top: r.bottom + 4, left: r.left, width: r.width, maxHeight: Math.min(maxH, Math.max(spaceBelow, 120)), zIndex: 9999 })
    } else {
      setDropStyle({ position: "fixed", top: r.top - Math.min(maxH, spaceAbove) - 4, left: r.left, width: r.width, maxHeight: Math.min(maxH, spaceAbove), zIndex: 9999 })
    }
  }, [])

  const open_ = () => { calcStyle(); setOpen(true) }
  const close = () => { setOpen(false); setSearch(""); setActiveIdx(-1) }
  const pick = (val: string) => { onChange(val); close() }

  // Focus search input after dropdown renders (no autoFocus to avoid scroll-to-element)
  useEffect(() => { if (open) inputRef.current?.focus() }, [open])

  // Reposition on scroll or resize while open
  useEffect(() => {
    if (!open) return
    window.addEventListener("scroll", calcStyle, true)
    window.addEventListener("resize", calcStyle)
    return () => {
      window.removeEventListener("scroll", calcStyle, true)
      window.removeEventListener("resize", calcStyle)
    }
  }, [open, calcStyle])

  useEffect(() => { setActiveIdx(-1) }, [search])

  useEffect(() => {
    if (activeIdx >= 0 && listRef.current) {
      const el = listRef.current.children[activeIdx] as HTMLElement | undefined
      el?.scrollIntoView({ block: "nearest" })
    }
  }, [activeIdx])

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, filtered.length - 1)) }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)) }
    else if (e.key === "Enter") { e.preventDefault(); if (activeIdx >= 0 && filtered[activeIdx]) pick(filtered[activeIdx].value) }
    else if (e.key === "Escape") { e.preventDefault(); close(); btnRef.current?.focus() }
  }

  const onBtnKey = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") { e.preventDefault(); if (!open) open_() }
    else if (e.key === "Escape") close()
  }

  const dropdown = open ? createPortal(
    <>
      <div style={{ position: "fixed", inset: 0, zIndex: 9998 }} onClick={close} />
      <div
        style={{ ...dropStyle, overflow: "hidden", display: "flex", flexDirection: "column", background: "white", border: "1px solid #e5e7eb", borderRadius: "8px", boxShadow: "0 10px 25px -5px rgba(0,0,0,.12),0 4px 10px -5px rgba(0,0,0,.08)" }}
      >
        <div style={{ padding: "8px", borderBottom: "1px solid #f3f4f6", flexShrink: 0 }}>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={onKey}
              placeholder="Rechercher..."
              className="input w-full text-sm"
              style={{ paddingLeft: 32 }}
            />
          </div>
        </div>
        <div ref={listRef} style={{ overflowY: "auto", flex: 1 }} role="listbox">
          {filtered.length === 0 ? (
            <p style={{ padding: "12px", fontSize: "14px", color: "#9ca3af", textAlign: "center" }}>Aucun résultat</p>
          ) : (
            filtered.map((opt, idx) => (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={value === opt.value}
                onMouseDown={e => { e.preventDefault(); pick(opt.value) }}
                style={{
                  display: "block", width: "100%", textAlign: "left",
                  padding: "8px 12px", fontSize: "14px", cursor: "pointer",
                  background: value === opt.value ? "#eff6ff" : activeIdx === idx ? "#f3f4f6" : "white",
                  color: value === opt.value ? "#1d4ed8" : "#111827",
                  fontWeight: value === opt.value ? 500 : 400,
                  borderBottom: "1px solid #f9fafb",
                }}
                onMouseEnter={() => setActiveIdx(idx)}
              >
                {opt.label}
              </button>
            ))
          )}
        </div>
      </div>
    </>,
    document.body
  ) : null

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={() => open ? close() : open_()}
        onKeyDown={onBtnKey}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="input w-full text-left flex items-center justify-between"
      >
        <span className={selected ? "text-gray-900 truncate pr-2" : "text-gray-400 truncate pr-2"}>
          {selected?.label || placeholder}
        </span>
        <ChevronDown size={14} className="text-gray-400 shrink-0" />
      </button>
      {dropdown}
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
    pev: [], mth: [], zoonose: [], ist: [], vectorielle: [], nosocomiale: [], autre: [],
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [ficheInitData, setFicheInitData] = useState<Record<string, any> | null>(null)

  // Feature state
  const [selectedSymptomeIds, setSelectedSymptomeIds] = useState<string[]>([])
  const [lieux, setLieux] = useState<LieuEntry[]>([])
  const [resultatsLabo, setResultatsLabo] = useState<ResultatLaboEntry[]>([])
  const [declarationFiles, setDeclarationFiles] = useState<UploadedFile[]>([])

  // New symptom entry state
  const [newSymptomNom, setNewSymptomNom] = useState("")
  const [newSymptomCategorie, setNewSymptomCategorie] = useState("")
  const [newSymptomLoading, setNewSymptomLoading] = useState(false)

  // New germe entry state
  const [newGermeNom, setNewGermeNom] = useState("")
  const [newGermeCode, setNewGermeCode] = useState("")
  const [newGermeLoading, setNewGermeLoading] = useState(false)

  // BMR type state
  const [bmrTypes, setBmrTypes] = useState<{ id: string; nom: string; codeCim10: string | null }[]>([])
  const [bmrTypeCreating, setBmrTypeCreating] = useState(false)
  const [bmrTypeSearch, setBmrTypeSearch] = useState("")
  const [bmrTypeDropOpen, setBmrTypeDropOpen] = useState(false)
  const [bmrNewCodCim10, setBmrNewCodCim10] = useState("")

  // ATCD multi-select state
  const [atcdList, setAtcdList] = useState<string[]>([...ANTECEDENTS_PREDEFINED])
  const [selectedAtcds, setSelectedAtcds] = useState<string[]>([])
  const [showAtcdDropdown, setShowAtcdDropdown] = useState(false)
  const [atcdSearch, setAtcdSearch] = useState("")

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
    resolver: zodResolver(declarationSchemaFull),
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
  const asymptomatique = watch("asymptomatique")
  const typeBmrId = watch("typeBmrId")
  const isBmr = !!maladies.find(m => m.id === maladieId && (m.nomCourt === "BMR" || m.codeCim10 === "U82"))

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

  // Fetch BMR types whenever a BMR disease is selected
  useEffect(() => {
    if (!isBmr) return
    fetch("/api/bmr-types")
      .then(r => r.json())
      .then(setBmrTypes)
      .catch(console.error)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBmr])

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

      // Pre-fill form — fiche incluse pour que les champs lisent les valeurs dès le montage
      reset({
        medecinDeclarantId: md?.id ?? "",
        nomMedecinDeclarant: md?.nom ?? "",
        prenomMedecinDeclarant: md?.prenom ?? "",
        serviceDeclarant: caseData.serviceDeclarant ?? "",
        dateDeclaration: toDateStr(caseData.createdAt),
        ...(caseData.donneesSpecifiques ? { fiche: caseData.donneesSpecifiques } : {}),
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
        observation: caseData.observation ?? undefined,
        modeConfirmation: caseData.modeConfirmation ?? undefined,
        atcd: caseData.atcd ?? "",
        casSimilaire: caseData.casSimilaire ?? false,
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
        typeBmrId: caseData.typeBmrId ?? undefined,
      })

      // Pre-fill symptomes
      if (Array.isArray(caseData.symptomes)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setSelectedSymptomeIds(caseData.symptomes.map((s: any) => s.symptomeId))
      }

      // Pre-fill ATCD multi-select from stored string
      if (caseData.atcd) {
        const stored = (caseData.atcd as string).split(",").map((s: string) => s.trim()).filter(Boolean)
        stored.forEach((a: string) => {
          if (!ANTECEDENTS_PREDEFINED.includes(a as never)) {
            setAtcdList(prev => prev.includes(a) ? prev : [...prev, a])
          }
        })
        setSelectedAtcds(stored)
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

      // Activer la fiche spécifique et stocker ses données initiales
      if (caseData.ficheSpecifiqueType) {
        setFicheSpecifiqueSlug(caseData.ficheSpecifiqueType)
        if (caseData.donneesSpecifiques) {
          setFicheInitData(caseData.donneesSpecifiques)
        }
      }

      // Pre-fill pièces jointes — TOUS les fichiers attachés au cas
      if (Array.isArray(caseData.fichiers) && caseData.fichiers.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setDeclarationFiles(caseData.fichiers.map((f: any) => ({
          id: f.id,
          name: f.filename || f.url?.split("/").pop() || "Fichier",
          url: f.url,
        })))
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
    asymptomatique: data.asymptomatique ?? null,
    observation: data.observation || null,
    atcd: data.atcd || null,
    casSimilaire: data.casSimilaire ?? null,
    nombreCasSimilaires: data.nombreCasSimilaires ?? null,
    estHospitalise: data.estHospitalise ?? null,
    dateHospitalisation: data.dateHospitalisation || null,
    estEvacue: data.estEvacue ?? null,
    dateEvacuation: data.dateEvacuation || null,
    structureEvacuation: data.structureEvacuation || null,
    evolution: data.evolution || null,
    dateSortie: data.dateSortie || null,
    dateDeces: data.dateDeces || null,
    typeBmrId: data.typeBmrId || null,
    serviceDeclarant: data.serviceDeclarant || null,
    moisDeclaration: data.moisDeclaration ?? null,
    anneeDeclaration: data.anneeDeclaration ?? null,
    etablissementId: data.etablissementId || null,
    service: data.service,
    notesCliniques: data.notesCliniques || null,
    resultatLabo: data.resultatLabo || null,
    ficheSpecifiqueType: ficheSpecifiqueSlug || null,
    // getValues("fiche") lit directement dans le store RHF, sans passer par zodResolver
    // qui supprime les champs non déclarés dans le schéma Zod.
    donneesSpecifiques: ficheSpecifiqueSlug ? (getValues("fiche") ?? null) : null,
    nationaliteCode: data.nationaliteCode || null,
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
      // ── Avertissements non-bloquants (groupe 3 soft + groupe 5 warning) ──
      const _dds  = pd(data.dateDebutSymptomes)
      const _dhosp = pd(data.dateHospitalisation)
      if (_dds && _dhosp && _dhosp < _dds)
        toast.warning("Date d'hospitalisation antérieure au début des symptômes")
      if (data.evolution === "deces" && !data.dateDeces)
        toast.warning("L'évolution indique un décès mais la date de décès n'est pas renseignée")

      // ── Validation des dates de prélèvement (résultats labo) ─────────────
      const _today = new Date(); _today.setHours(23, 59, 59, 999)
      const _dob = pd(data.dateOfBirth)
      let laboValid = true
      for (let i = 0; i < resultatsLabo.length; i++) {
        const r = resultatsLabo[i]
        if (!r.datePrelevement) continue
        const dp = new Date(r.datePrelevement)
        if (dp > _today) {
          toast.error(`Prélèvement ${i + 1} : la date de prélèvement ne peut pas être dans le futur`)
          laboValid = false
        }
        if (_dob && dp < _dob) {
          toast.error(`Prélèvement ${i + 1} : la date de prélèvement ne peut pas être avant la naissance du patient`)
          laboValid = false
        }
        if (_dds && dp < _dds)
          toast.warning(`Prélèvement ${i + 1} : date de prélèvement antérieure au début des symptômes`)
      }
      if (!laboValid) { setLoading(false); return }

      // ── Validation BMR : type obligatoire si maladie BMR sélectionnée ──────
      const selectedMaladie = maladies.find(m => m.id === data.maladieId)
      const isBmr = selectedMaladie?.nomCourt === "BMR" || selectedMaladie?.codeCim10 === "U82"
      if (isBmr && !data.typeBmrId) {
        setError("Le type de BMR est obligatoire pour cette maladie")
        setLoading(false)
        return
      }

      let statut = "suspect"
      if (data.observation === "cas_confirme") statut = "confirme"
      else if (data.observation === "cas_suspect") statut = "suspect"

      const payload = buildPayload(data, statut)

      // Fonction commune d'upload de fichiers
      const uploadPendingFiles = async (targetCasId: string) => {
        const newFiles: { file: File; type: string }[] = [
          ...declarationFiles.filter(f => f.file).map(f => ({ file: f.file!, type: "declaration" })),
          ...resultatsLabo.flatMap(r =>
            (r.files ?? []).filter(f => f.file).map(f => ({ file: f.file!, type: "resultat_labo" }))
          ),
        ]
        if (newFiles.length === 0) return
        const results = await Promise.allSettled(newFiles.map(({ file, type }) => {
          const fd = new FormData()
          fd.append("file", file)
          fd.append("casId", targetCasId)
          fd.append("type", type)
          return fetch("/api/upload", { method: "POST", body: fd }).then(r => {
            if (!r.ok) throw new Error(`Upload échoué: ${r.status}`)
            return r.json()
          })
        }))
        const failed = results.filter(r => r.status === "rejected")
        if (failed.length > 0) {
          console.warn(`${failed.length} fichier(s) non uploadé(s)`)
        }
      }

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
        // Uploader les nouveaux fichiers ajoutés en mode édition
        await uploadPendingFiles(casId!)
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
        await uploadPendingFiles(cas.id)
        toast.success("Déclaration enregistrée avec succès")
        autoSaveRef.current = true
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
      autoSaveRef.current = true
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
      antibiogramme: "", laboratoire: "", notes: "", files: [],
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
  // Add new symptom to DB
  // ---------------------------------------------------------------------------
  const addNewSymptom = async () => {
    if (!newSymptomNom.trim() || newSymptomNom.trim().length < 2) return
    setNewSymptomLoading(true)
    try {
      const res = await fetch("/api/symptomes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom: newSymptomNom.trim(), categorie: newSymptomCategorie || null }),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? "Erreur lors de l'ajout du symptôme")
        return
      }
      const newSymp: SymptomeRef = await res.json()
      setSymptomes(prev => [...prev, newSymp].sort((a, b) => a.nom.localeCompare(b.nom)))
      setSelectedSymptomeIds(prev => [...prev, newSymp.id])
      setNewSymptomNom("")
      setNewSymptomCategorie("")
      toast.success(`Symptôme "${newSymp.nom}" ajouté`)
    } catch {
      toast.error("Erreur lors de l'ajout du symptôme")
    } finally {
      setNewSymptomLoading(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Add new germe to DB
  // ---------------------------------------------------------------------------
  const addNewGerme = async () => {
    if (!newGermeNom.trim() || newGermeNom.trim().length < 2) return
    setNewGermeLoading(true)
    try {
      const res = await fetch("/api/germes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom: newGermeNom.trim(), code: newGermeCode.trim() || "U82.8" }),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? "Erreur lors de l'ajout du germe")
        return
      }
      const newG: GermeRef = await res.json()
      setGermes(prev => [...prev, newG].sort((a, b) => a.nom.localeCompare(b.nom)))
      setNewGermeNom("")
      setNewGermeCode("")
      toast.success(`Germe "${newG.nom}" ajouté`)
    } catch {
      toast.error("Erreur lors de l'ajout du germe")
    } finally {
      setNewGermeLoading(false)
    }
  }

  // ---------------------------------------------------------------------------
  // ATCD helpers
  // ---------------------------------------------------------------------------
  const toggleAtcd = (item: string) => {
    setSelectedAtcds(prev => {
      const next = prev.includes(item) ? prev.filter(a => a !== item) : [...prev, item]
      setValue("atcd", next.join(", "))
      return next
    })
  }

  const addNewAtcd = () => {
    const trimmed = atcdSearch.trim()
    if (!trimmed || trimmed.length < 2) return
    if (!atcdList.includes(trimmed)) setAtcdList(prev => [...prev, trimmed])
    setSelectedAtcds(prev => {
      const next = prev.includes(trimmed) ? prev : [...prev, trimmed]
      setValue("atcd", next.join(", "))
      return next
    })
    setAtcdSearch("")
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

  // Toutes les catégories de symptômes — sans filtre par maladie
  const symptomesByCategory = SYMPTOM_CATEGORIES.map(cat => ({
    ...cat,
    items: symptomes.filter(s => s.categorie === cat.key),
  })).filter(g => g.items.length > 0)

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
                  <DateInput
                    name="dateOfBirth"
                    watch={watch}
                    setValue={setValue}
                    className={inputCls(!!errors.dateOfBirth)}
                    onAfterChange={() => {
                      dobChangedByUser.current = true
                      ageChangedByUser.current = false
                    }}
                  />
                  <FieldError msg={errors.dateOfBirth?.message} />
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
              <label className="label">Wilaya de résidence <span className="text-red-500">*</span></label>
              <SearchableSelect
                options={wilayas.map(w => ({ value: w.id, label: `${w.code} — ${w.nom}` }))}
                value={watch("wilayadId") ?? ""}
                onChange={val => setValue("wilayadId", val, { shouldValidate: true })}
                placeholder="Rechercher une wilaya..."
              />
              <FieldError msg={errors.wilayadId?.message} />
            </div>

            {/* Commune */}
            <div>
              <label className="label">Commune <span className="text-red-500">*</span></label>
              <SearchableSelect
                options={filteredCommunes.map(c => ({ value: c.id, label: c.nom }))}
                value={watch("communeId") ?? ""}
                onChange={val => setValue("communeId", val, { shouldValidate: true })}
                placeholder={watch("wilayadId") ? "Rechercher une commune..." : "Sélectionner d'abord une wilaya..."}
              />
              <FieldError msg={errors.communeId?.message} />
            </div>

            {/* Adresse */}
            <div className="col-span-2">
              <label className="label">Adresse complète</label>
              <textarea
                {...register("address")}
                rows={2}
                className={cn(inputCls(false), "h-auto py-2 resize-none")}
                placeholder="Numéro, rue, quartier..."
              />
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
                <label className="label">Nationalité</label>
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
                  <DateInput name="dateHospitalisation" watch={watch} setValue={setValue} className={inputCls(!!errors.dateHospitalisation)} />
                  <FieldError msg={errors.dateHospitalisation?.message} />
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
                  <select {...register("serviceHospitalisation")} className={inputCls(false)}>
                    <option value="">Sélectionner un service...</option>
                    {SERVICES_EHU.map(s => (
                      <option key={s.code} value={s.nom}>{s.nom}</option>
                    ))}
                  </select>
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
                  <DateInput name="dateEvacuation" watch={watch} setValue={setValue} className={inputCls(!!errors.dateEvacuation)} />
                  <FieldError msg={errors.dateEvacuation?.message} />
                </div>
                <div>
                  <label className="label">Structure d&apos;évacuation</label>
                  <input {...register("structureEvacuation")} className={inputCls(false)} placeholder="Nom de la structure" />
                </div>
              </>
            )}

            {/* Évolution */}
            <div className="col-span-2">
              <label className="label">Évolution <span className="text-red-500">*</span></label>
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
                        : errors.evolution && !evolution
                          ? "border-red-300 text-gray-600 hover:border-red-400"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                    )}
                  >
                    <input type="radio" value={opt.value} {...register("evolution")} className="sr-only" />
                    {opt.label}
                  </label>
                ))}
              </div>
              <FieldError msg={errors.evolution?.message} />

              {(evolution === "guerison" || evolution === "sortant") && (
                <div className="mt-3">
                  <label className="label">Date de sortie</label>
                  <DateInput name="dateSortie" watch={watch} setValue={setValue} className={inputCls(!!errors.dateSortie)} />
                  <FieldError msg={errors.dateSortie?.message} />
                </div>
              )}

              {evolution === "deces" && (
                <div className="mt-3">
                  <label className="label">Date du décès <span className="text-red-500">*</span></label>
                  <DateInput name="dateDeces" watch={watch} setValue={setValue} className={inputCls(!!errors.dateDeces)} />
                  <FieldError msg={errors.dateDeces?.message} />
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

            {/* Type BMR — affiché uniquement si la maladie sélectionnée est BMR */}
            {isBmr && (() => {
              const selected = bmrTypes.find(t => t.id === typeBmrId)
              const q = stripAccents(bmrTypeSearch.trim().toLowerCase())
              const filtered = q
                ? bmrTypes.filter(t =>
                    stripAccents(t.nom.toLowerCase()).includes(q) ||
                    (t.codeCim10 && stripAccents(t.codeCim10.toLowerCase()).includes(q))
                  )
                : bmrTypes
              const exactMatch = bmrTypes.some(
                t => t.nom.toLowerCase() === bmrTypeSearch.trim().toLowerCase() ||
                     (t.codeCim10 && t.codeCim10.toLowerCase() === bmrTypeSearch.trim().toLowerCase())
              )
              const showCreate = bmrTypeSearch.trim().length > 0 && !exactMatch
              return (
                <div className="col-span-2">
                  <label className="label">Type de BMR <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => { setBmrTypeDropOpen(o => !o); setBmrNewCodCim10("") }}
                      className={cn(
                        "input w-full text-left flex items-center justify-between",
                        !selected ? "text-gray-400" : "text-gray-900"
                      )}
                    >
                      <span className="truncate pr-2">
                        {selected
                          ? selected.codeCim10
                            ? `${selected.nom} (${selected.codeCim10})`
                            : selected.nom
                          : "Sélectionner ou créer un type de BMR"}
                      </span>
                      <ChevronDown size={14} className="text-gray-400 shrink-0" />
                    </button>
                    {bmrTypeDropOpen && (
                      <>
                        <div
                          style={{ position: "fixed", inset: 0, zIndex: 40 }}
                          onClick={() => { setBmrTypeDropOpen(false); setBmrTypeSearch(""); setBmrNewCodCim10("") }}
                        />
                        <div
                          style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4, zIndex: 50 }}
                          className="bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
                        >
                          {/* Search */}
                          <div className="p-2 border-b border-gray-100">
                            <input
                              autoFocus
                              type="text"
                              value={bmrTypeSearch}
                              onChange={e => setBmrTypeSearch(e.target.value)}
                              onKeyDown={e => { if (e.key === "Escape") { setBmrTypeDropOpen(false); setBmrTypeSearch(""); setBmrNewCodCim10("") } }}
                              placeholder="Rechercher par nom ou code CIM-10…"
                              className="input w-full text-sm"
                            />
                          </div>

                          {/* List */}
                          <div className="max-h-48 overflow-y-auto">
                            {filtered.map(t => (
                              <button
                                key={t.id}
                                type="button"
                                onMouseDown={e => {
                                  e.preventDefault()
                                  setValue("typeBmrId", t.id)
                                  setBmrTypeDropOpen(false)
                                  setBmrTypeSearch("")
                                  setBmrNewCodCim10("")
                                }}
                                className={cn(
                                  "block w-full text-left px-3 py-2 text-sm",
                                  typeBmrId === t.id ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-900 hover:bg-gray-50"
                                )}
                              >
                                <span className="font-medium">{t.nom}</span>
                                {t.codeCim10 && (
                                  <span className="ml-2 text-xs text-gray-400 font-normal">{t.codeCim10}</span>
                                )}
                              </button>
                            ))}
                            {filtered.length === 0 && !showCreate && (
                              <p className="px-3 py-4 text-sm text-gray-400 text-center">
                                Aucun type trouvé — saisissez un nom pour en créer un
                              </p>
                            )}
                          </div>

                          {/* Inline creation form */}
                          {showCreate && (
                            <div className="border-t border-gray-100 p-3 bg-gray-50 space-y-2">
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Créer un nouveau type</p>
                              <div className="flex gap-2">
                                <div className="flex-1">
                                  <label className="block text-[10px] text-gray-400 mb-0.5">Nom *</label>
                                  <input
                                    type="text"
                                    value={bmrTypeSearch}
                                    onChange={e => setBmrTypeSearch(e.target.value)}
                                    placeholder="Ex: E. coli BLSE"
                                    className="input w-full text-sm"
                                  />
                                </div>
                                <div className="w-28">
                                  <label className="block text-[10px] text-gray-400 mb-0.5">Code CIM-10</label>
                                  <input
                                    type="text"
                                    value={bmrNewCodCim10}
                                    onChange={e => setBmrNewCodCim10(e.target.value.toUpperCase())}
                                    placeholder="Ex: U82"
                                    className="input w-full text-sm"
                                    maxLength={20}
                                  />
                                </div>
                              </div>
                              <button
                                type="button"
                                disabled={bmrTypeCreating || !bmrTypeSearch.trim()}
                                onMouseDown={async e => {
                                  e.preventDefault()
                                  setBmrTypeCreating(true)
                                  try {
                                    const res = await fetch("/api/bmr-types", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({
                                        nom: bmrTypeSearch.trim(),
                                        codeCim10: bmrNewCodCim10.trim() || undefined,
                                      }),
                                    })
                                    if (res.ok) {
                                      const newType: { id: string; nom: string; codeCim10: string | null } = await res.json()
                                      setBmrTypes(prev => [...prev.filter(t => t.id !== newType.id), newType].sort((a, b) => a.nom.localeCompare(b.nom)))
                                      setValue("typeBmrId", newType.id)
                                      setBmrTypeDropOpen(false)
                                      setBmrTypeSearch("")
                                      setBmrNewCodCim10("")
                                    }
                                  } catch { /* silent */ } finally { setBmrTypeCreating(false) }
                                }}
                                className="w-full py-1.5 text-sm text-white rounded-lg font-medium disabled:opacity-50 transition-colors"
                                style={{ backgroundColor: "#1B4F8A" }}
                              >
                                {bmrTypeCreating ? "Création en cours…" : "Créer ce type"}
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )
            })()}

            {/* Dates — not required */}
            <div>
              <label className="label">Date d&apos;apparition des symptômes</label>
              <DateInput name="dateDebutSymptomes" watch={watch} setValue={setValue} className={inputCls(!!errors.dateDebutSymptomes)} />
              <FieldError msg={errors.dateDebutSymptomes?.message} />
            </div>
            <div>
              <label className="label">Date du diagnostic</label>
              <DateInput name="dateDiagnostic" watch={watch} setValue={setValue} className={inputCls(!!errors.dateDiagnostic)} />
              <FieldError msg={errors.dateDiagnostic?.message} />
            </div>

            {/* Asymptomatique */}
            <div className="col-span-2">
              <label className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-all text-sm",
                asymptomatique
                  ? "border-amber-400 bg-amber-50 text-amber-800 font-medium"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              )}>
                <input
                  type="checkbox"
                  checked={!!asymptomatique}
                  onChange={e => {
                    setValue("asymptomatique", e.target.checked)
                    if (e.target.checked) setSelectedSymptomeIds([])
                  }}
                  className="rounded border-gray-300 text-amber-500 focus:ring-amber-400"
                />
                Asymptomatique (aucun symptôme)
              </label>
            </div>

            {/* Symptômes codés */}
            {!asymptomatique && (
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

                {/* Add new symptom */}
                <div className="mt-3 p-3 rounded-lg border border-dashed border-gray-300 bg-gray-50/50">
                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Ajouter un nouveau symptôme</p>
                  <div className="grid gap-2" style={{ gridTemplateColumns: "1fr 130px auto" }}>
                    <input
                      type="text"
                      value={newSymptomNom}
                      onChange={e => setNewSymptomNom(e.target.value)}
                      placeholder="Nom du symptôme..."
                      className="input text-sm"
                    />
                    <select
                      value={newSymptomCategorie}
                      onChange={e => setNewSymptomCategorie(e.target.value)}
                      className="input text-sm"
                    >
                      <option value="">Catégorie...</option>
                      {SYMPTOM_CATEGORIES.map(c => (
                        <option key={c.key} value={c.key}>{c.label}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={addNewSymptom}
                      disabled={newSymptomLoading || newSymptomNom.trim().length < 2}
                      className="btn btn-secondary btn-sm disabled:opacity-50 whitespace-nowrap"
                    >
                      {newSymptomLoading ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                      Ajouter
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Observation — drives statut */}
            <div className="col-span-2">
              <label className="label">
                Observation <span className="text-red-500">*</span>
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
                          : errors.observation
                            ? "border-red-300 text-gray-600 hover:border-red-400"
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
              <FieldError msg={errors.observation?.message} />
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
              {selectedAtcds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {selectedAtcds.map(a => (
                    <span key={a} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                      {a}
                      <button type="button" onClick={() => toggleAtcd(a)} className="hover:text-purple-900"><X size={11} /></button>
                    </span>
                  ))}
                </div>
              )}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setShowAtcdDropdown(v => !v); setAtcdSearch("") }}
                  className="input w-full text-left flex items-center justify-between text-sm"
                >
                  <span className="text-gray-400">{selectedAtcds.length === 0 ? "Sélectionner ou ajouter des antécédents..." : `${selectedAtcds.length} sélectionné(s)`}</span>
                  <ChevronDown size={14} className="text-gray-400 shrink-0" />
                </button>
                {showAtcdDropdown && (
                  <div className="absolute z-50 bottom-full mb-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden flex flex-col">
                    <div className="p-2 border-b border-gray-100">
                      <div className="relative">
                        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={atcdSearch}
                          onChange={e => setAtcdSearch(e.target.value)}
                          placeholder="Rechercher ou ajouter..."
                          className="input w-full pl-8 text-sm"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="overflow-y-auto max-h-48">
                      {atcdList.filter(a => a.toLowerCase().includes(atcdSearch.toLowerCase())).map(a => (
                        <button
                          key={a}
                          type="button"
                          onClick={() => toggleAtcd(a)}
                          className={cn(
                            "w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 transition-colors",
                            selectedAtcds.includes(a) && "bg-purple-50 text-purple-700 font-medium"
                          )}
                        >
                          <span className={cn(
                            "w-4 h-4 rounded border flex items-center justify-center shrink-0 text-[10px]",
                            selectedAtcds.includes(a) ? "bg-purple-600 border-purple-600 text-white" : "border-gray-300"
                          )}>
                            {selectedAtcds.includes(a) && "✓"}
                          </span>
                          {a}
                        </button>
                      ))}
                      {atcdSearch.trim().length >= 2 && !atcdList.some(a => a.toLowerCase() === atcdSearch.toLowerCase()) && (
                        <button
                          type="button"
                          onClick={() => { addNewAtcd(); setShowAtcdDropdown(false) }}
                          className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2 border-t border-gray-100"
                        >
                          <Plus size={13} />
                          Ajouter &quot;{atcdSearch.trim()}&quot;
                        </button>
                      )}
                    </div>
                  </div>
                )}
                {showAtcdDropdown && (
                  <div className="fixed inset-0 z-40" onClick={() => setShowAtcdDropdown(false)} />
                )}
              </div>
            </div>

            {/* Cas similaire */}
            <div className="col-span-2">
              <label className="label">Cas similaire dans l&apos;entourage</label>
              <ToggleGroup value={casSimilaire} onChange={val => {
                setValue("casSimilaire", val)
                if (!val) setValue("nombreCasSimilaires", undefined)
              }} />
            </div>

            {casSimilaire && (
              <div className="col-span-2">
                <label className="label">Nombre de cas similaires dans l&apos;entourage</label>
                <input
                  type="number"
                  min={1}
                  {...register("nombreCasSimilaires", { valueAsNumber: true })}
                  className={inputCls(false)}
                  placeholder="Ex: 2"
                />
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
                    <DateInput value={lieu.dateDebut} onChange={v => updateLieu(idx, "dateDebut", v)} className={inputCls(false)} />
                  </div>
                  <div>
                    <label className="label">Date fin fréquentation</label>
                    <DateInput value={lieu.dateFin} onChange={v => updateLieu(idx, "dateFin", v)} className={inputCls(false)} />
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
            <p className="text-xs text-gray-500">
              Renseignez les prélèvements et germes identifiés. Utilisez le bouton ci-dessous pour ajouter des entrées supplémentaires.
            </p>

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
                    <DateInput value={r.datePrelevement} onChange={v => updateResultatLabo(idx, "datePrelevement", v)} className={inputCls(false)} />
                  </div>
                  <div>
                    <label className="label">Germe identifié</label>
                    <SearchableSelect
                      options={germes.map(g => ({ value: g.id, label: g.code ? `${g.code} — ${g.nom}` : g.nom }))}
                      value={r.germeId}
                      onChange={val => updateResultatLabo(idx, "germeId", val)}
                      placeholder={germes.length === 0 ? "Chargement des germes..." : "Rechercher par nom ou code CIM-10..."}
                    />
                    {germes.length === 0 && (
                      <p className="text-[11px] text-amber-600 mt-1">La liste des germes est vide. Veuillez exécuter le seeder : <code>npm run db:seed</code></p>
                    )}
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
                  <div className="col-span-2 pt-1 border-t border-gray-100">
                    <FileUpload
                      label="Documents du résultat (PDF ou image)"
                      files={r.files}
                      onChange={newFiles => setResultatsLabo(prev =>
                        prev.map((item, i) => i === idx ? { ...item, files: newFiles } : item)
                      )}
                      maxFiles={3}
                      compact
                    />
                  </div>
                </div>
              </div>
            ))}

            {/* Add new germe */}
            <div className="p-3 rounded-lg border border-dashed border-gray-300 bg-gray-50/50">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Ajouter un nouveau germe à la liste</p>
              <div className="grid gap-2" style={{ gridTemplateColumns: "1fr 120px auto" }}>
                <input
                  type="text"
                  value={newGermeNom}
                  onChange={e => setNewGermeNom(e.target.value)}
                  placeholder="Nom du germe (ex: Klebsiella oxytoca)..."
                  className="input text-sm"
                />
                <input
                  type="text"
                  value={newGermeCode}
                  onChange={e => setNewGermeCode(e.target.value)}
                  placeholder="Code CIM-10..."
                  className="input text-sm"
                />
                <button
                  type="button"
                  onClick={addNewGerme}
                  disabled={newGermeLoading || newGermeNom.trim().length < 2}
                  className="btn btn-secondary btn-sm disabled:opacity-50 whitespace-nowrap"
                >
                  {newGermeLoading ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                  Ajouter
                </button>
              </div>
            </div>

            <button type="button" onClick={addResultatLabo} className="btn btn-secondary btn-sm">
              <Plus size={14} />
              Ajouter un prélèvement
            </button>
          </div>
        </div>

        {/* ── Section 6 — Pièces jointes (preuve de déclaration) ───── */}
        <div className="card">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100">
            <div className="w-7 h-7 rounded-full bg-[#1B4F8A] flex items-center justify-center shrink-0">
              <Paperclip size={13} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-800">Pièces jointes</h3>
              <p className="text-[11px] text-gray-500">Joignez le formulaire papier scanné ou toute preuve de déclaration</p>
            </div>
          </div>
          <div className="p-5">
            <FileUpload
              files={declarationFiles}
              onChange={setDeclarationFiles}
              maxFiles={5}
            />
          </div>
        </div>

        {/* ── Section 7 — Fiche spécifique (conditionnelle) ─────────── */}
        {ficheSpecifiqueSlug && (
          <FicheDynamiqueRenderer
            key={ficheInitData ? `${ficheSpecifiqueSlug}-ready` : ficheSpecifiqueSlug ?? ""}
            slug={ficheSpecifiqueSlug}
            register={register}
            watch={watch}
            setValue={setValue}
            getValues={getValues}
            reset={reset}
            errors={errors}
            control={control}
            ficheData={ficheInitData}
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
