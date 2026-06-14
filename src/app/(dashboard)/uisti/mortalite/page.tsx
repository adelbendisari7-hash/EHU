"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { AlertTriangle, Skull, TrendingDown, Plus, RefreshCw, ChevronDown, ChevronUp, Send, Search } from "lucide-react"
import { toast } from "sonner"
import { SERVICES_EHU } from "@/constants/services"

const WILAYAS = [
  { code: "01", nom: "Adrar" }, { code: "02", nom: "Chlef" }, { code: "03", nom: "Laghouat" },
  { code: "04", nom: "Oum El Bouaghi" }, { code: "05", nom: "Batna" }, { code: "06", nom: "Béjaïa" },
  { code: "07", nom: "Biskra" }, { code: "08", nom: "Béchar" }, { code: "09", nom: "Blida" },
  { code: "10", nom: "Bouira" }, { code: "11", nom: "Tamanrasset" }, { code: "12", nom: "Tébessa" },
  { code: "13", nom: "Tlemcen" }, { code: "14", nom: "Tiaret" }, { code: "15", nom: "Tizi Ouzou" },
  { code: "16", nom: "Alger" }, { code: "17", nom: "Djelfa" }, { code: "18", nom: "Jijel" },
  { code: "19", nom: "Sétif" }, { code: "20", nom: "Saïda" }, { code: "21", nom: "Skikda" },
  { code: "22", nom: "Sidi Bel Abbès" }, { code: "23", nom: "Annaba" }, { code: "24", nom: "Guelma" },
  { code: "25", nom: "Constantine" }, { code: "26", nom: "Médéa" }, { code: "27", nom: "Mostaganem" },
  { code: "28", nom: "M'Sila" }, { code: "29", nom: "Mascara" }, { code: "30", nom: "Ouargla" },
  { code: "31", nom: "Oran" }, { code: "32", nom: "El Bayadh" }, { code: "33", nom: "Illizi" },
  { code: "34", nom: "Bordj Bou Arréridj" }, { code: "35", nom: "Boumerdès" }, { code: "36", nom: "El Tarf" },
  { code: "37", nom: "Tindouf" }, { code: "38", nom: "Tissemsilt" }, { code: "39", nom: "El Oued" },
  { code: "40", nom: "Khenchela" }, { code: "41", nom: "Souk Ahras" }, { code: "42", nom: "Tipaza" },
  { code: "43", nom: "Mila" }, { code: "44", nom: "Aïn Defla" }, { code: "45", nom: "Naâma" },
  { code: "46", nom: "Aïn Témouchent" }, { code: "47", nom: "Ghardaïa" }, { code: "48", nom: "Relizane" },
  { code: "49", nom: "Timimoun" }, { code: "50", nom: "Bordj Badji Mokhtar" },
  { code: "51", nom: "Ouled Djellal" }, { code: "52", nom: "Béni Abbès" },
  { code: "53", nom: "In Salah" }, { code: "54", nom: "In Guezzam" },
  { code: "55", nom: "Touggourt" }, { code: "56", nom: "Djanet" },
  { code: "57", nom: "El M'Ghair" }, { code: "58", nom: "El Menia" },
]

function SearchableSelect({
  value, onChange, options, placeholder, label, required,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  placeholder: string
  label: string
  required?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
  const selected = options.find(o => o.value === value)

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs font-medium mb-1.5" style={{ color: "#374151" }}>
        {label} {required && <span style={{ color: "#DC2626" }}>*</span>}
      </label>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none text-left flex items-center justify-between"
        style={{ borderColor: value ? "#D97706" : "#E5E7EB", backgroundColor: "#fff" }}
      >
        <span style={{ color: selected ? "#374151" : "#9CA3AF" }}>{selected?.label ?? placeholder}</span>
        <ChevronDown size={14} style={{ color: "#9CA3AF" }} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden" style={{ maxHeight: "220px" }}>
          <div className="p-2 border-b border-gray-100 sticky top-0 bg-white">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "#9CA3AF" }} />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-amber-400"
                style={{ borderColor: "#E5E7EB" }}
                autoFocus
              />
            </div>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: "160px" }}>
            <button
              type="button"
              onClick={() => { onChange(""); setOpen(false); setSearch("") }}
              className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50"
              style={{ color: "#9CA3AF" }}
            >
              — Aucun —
            </button>
            {filtered.map(o => (
              <button
                key={o.value}
                type="button"
                onClick={() => { onChange(o.value); setOpen(false); setSearch("") }}
                className="w-full text-left px-3 py-2 text-xs hover:bg-amber-50 border-b border-gray-50 last:border-0"
                style={{ color: value === o.value ? "#D97706" : "#374151", fontWeight: value === o.value ? 600 : 400 }}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface DecesCase {
  codeCas: string
  patient: { identifiant: string; nom: string; prenom: string; age: number; sexe: string }
  mdo: { maladie: string; codeCim10: string; statut: string }
  hospitalisation: { dateAdmission: string | null; service: string }
  dateDeces: string | null
  commune: string
}

interface LetaliteRow {
  maladieId: string | null
  maladie: string
  codeCim10: string
  casConfirmes: number
  casDeces: number
  tauxLetalite: number
}

interface ApiResponse {
  cas1_decesDurantHospitalisation: DecesCase[]
  cas3_tauxLetaliteParPathologie: LetaliteRow[]
  meta: { totalDeces: number; periode: { dateDebut: string | null; dateFin: string | null }; genereLe: string }
}

interface MaladieOption { id: string; nom: string; codeCim10: string }

export default function UistiMortalitePage() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateDebut, setDateDebut] = useState("")
  const [dateFin, setDateFin] = useState("")
  const [expandedCas1, setExpandedCas1] = useState(true)
  const [expandedCas3, setExpandedCas3] = useState(true)
  const [showCas2Form, setShowCas2Form] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [maladies, setMaladies] = useState<MaladieOption[]>([])

  // Cas 2 form
  const [form, setForm] = useState({
    nomPatient: "", prenomPatient: "", dateDeces: "",
    maladieId: "", service: "", wilaya: "", dateAdmission: "", details: "",
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (dateDebut) params.set("dateDebut", dateDebut)
    if (dateFin) params.set("dateFin", dateFin)
    const res = await fetch(`/api/uisti/mortalite?${params}`)
    if (res.ok) setData(await res.json())
    setLoading(false)
  }, [dateDebut, dateFin])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    fetch("/api/maladies")
      .then(r => r.json())
      .then(d => setMaladies((d.maladies ?? []) as MaladieOption[]))
      .catch(() => {})
  }, [])

  const submitCas2 = async () => {
    if (!form.nomPatient || !form.dateDeces || !form.maladieId) {
      toast.error("Veuillez remplir les champs obligatoires (nom, date du décès, pathologie MDO)")
      return
    }
    const selectedMaladie = maladies.find(m => m.id === form.maladieId)
    setSubmitting(true)
    const res = await fetch("/api/uisti/mortalite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        maladieId: form.maladieId,
        maladieSuspectee: selectedMaladie?.nom ?? "",
      }),
    })
    setSubmitting(false)
    if (res.ok) {
      toast.success("Déclaration pré-remplie créée et alerte générée vers le service épidémiologique")
      setShowCas2Form(false)
      setForm({ nomPatient: "", prenomPatient: "", dateDeces: "", maladieId: "", service: "", wilaya: "", dateAdmission: "", details: "" })
    } else {
      const err = await res.json()
      toast.error(err.error ?? "Erreur lors de l'envoi")
    }
  }

  const STATUT_BADGE: Record<string, { label: string; bg: string; text: string }> = {
    confirme: { label: "Confirmé", bg: "#D1FAE5", text: "#065F46" },
    suspect: { label: "Suspect", bg: "#FEF3C7", text: "#92400E" },
  }

  const getTauxColor = (taux: number) => {
    if (taux >= 10) return { bg: "#FEE2E2", text: "#991B1B" }
    if (taux >= 5) return { bg: "#FEF3C7", text: "#92400E" }
    if (taux >= 1) return { bg: "#FEF9C3", text: "#713F12" }
    return { bg: "#F0FDF4", text: "#166534" }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#FEF2F2" }}>
              <AlertTriangle size={16} style={{ color: "#DC2626" }} />
            </div>
            <h1 className="text-xl font-semibold" style={{ color: "#111827" }}>Croisement MDO → Mortalité Hospitalière</h1>
          </div>
          <p className="text-sm" style={{ color: "#6B7280" }}>Section 2 — Lien fonctionnel entre les déclarations MDO et la mortalité UISTI</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)} className="px-3 py-2 text-sm border rounded-lg focus:outline-none" style={{ borderColor: "#E5E7EB", color: "#374151" }} />
          <span className="text-sm" style={{ color: "#6B7280" }}>→</span>
          <input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)} className="px-3 py-2 text-sm border rounded-lg focus:outline-none" style={{ borderColor: "#E5E7EB", color: "#374151" }} />
          <button onClick={fetchData} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition-colors hover:bg-gray-50" style={{ color: "#374151", borderColor: "#E5E7EB" }}>
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* ── CAS 1 ─────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
        <button
          onClick={() => setExpandedCas1(v => !v)}
          className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors hover:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "#FEE2E2" }}>
              <Skull size={15} style={{ color: "#DC2626" }} />
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: "#111827" }}>Cas 1 — Patient MDO décédé durant l&apos;hospitalisation</p>
              <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>Lien fonctionnel : MDO comme cause du décès · Comptabilisé dans la mortalité UISTI avec MDO en cause</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {data && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: "#FEE2E2", color: "#991B1B" }}>
                {data.cas1_decesDurantHospitalisation.length} décès
              </span>
            )}
            {expandedCas1 ? <ChevronUp size={16} style={{ color: "#9CA3AF" }} /> : <ChevronDown size={16} style={{ color: "#9CA3AF" }} />}
          </div>
        </button>

        {expandedCas1 && (
          loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-5 h-5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !data || data.cas1_decesDurantHospitalisation.length === 0 ? (
            <div className="text-center py-10 border-t" style={{ borderColor: "#F3F4F6", color: "#9CA3AF" }}>
              <Skull size={28} className="mx-auto mb-2 opacity-20" />
              <p className="text-sm">Aucun décès MDO enregistré sur la période</p>
            </div>
          ) : (
            <div className="border-t overflow-x-auto" style={{ borderColor: "#F3F4F6" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: "#FFF7F7", borderBottom: "1px solid #FEE2E2" }}>
                    {["Code Cas", "Patient", "Âge / Sexe", "MDO / CIM-10", "Statut", "Service", "Date Admission", "Date Décès", "Commune"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap" style={{ color: "#991B1B" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "#FEF2F2" }}>
                  {data.cas1_decesDurantHospitalisation.map(c => {
                    const badge = STATUT_BADGE[c.mdo.statut] ?? { label: c.mdo.statut, bg: "#F3F4F6", text: "#374151" }
                    return (
                      <tr key={c.codeCas} className="hover:bg-red-50/30 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs font-medium" style={{ color: "#DC2626" }}>{c.codeCas}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="font-medium text-sm" style={{ color: "#111827" }}>{c.patient.nom} {c.patient.prenom}</p>
                          <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>{c.patient.identifiant}</p>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs" style={{ color: "#374151" }}>
                          {c.patient.age} ans / {c.patient.sexe === "homme" ? "M" : "F"}
                        </td>
                        <td className="px-4 py-3 max-w-[180px]">
                          <p className="text-xs line-clamp-2" style={{ color: "#374151" }}>{c.mdo.maladie}</p>
                          <p className="font-mono text-xs mt-0.5" style={{ color: "#9CA3AF" }}>{c.mdo.codeCim10}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: badge.bg, color: badge.text }}>{badge.label}</span>
                        </td>
                        <td className="px-4 py-3 text-xs max-w-[130px]" style={{ color: "#374151" }}>
                          <span className="line-clamp-1">{c.hospitalisation.service}</span>
                        </td>
                        <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: "#374151" }}>{c.hospitalisation.dateAdmission ?? "—"}</td>
                        <td className="px-4 py-3 text-xs whitespace-nowrap font-semibold" style={{ color: "#DC2626" }}>{c.dateDeces ?? "—"}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: "#374151" }}>{c.commune}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* ── CAS 2 ─────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "#FEF3C7" }}>
              <AlertTriangle size={15} style={{ color: "#D97706" }} />
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: "#111827" }}>Cas 2 — Décès lié à une MDO non encore déclarée</p>
              <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>Lien fonctionnel : Déclaration rétrospective · Alerte générée vers l&apos;unité de surveillance épidémiologique</p>
            </div>
          </div>
          <button
            onClick={() => setShowCas2Form(v => !v)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ backgroundColor: "#D97706", color: "#fff" }}
          >
            <Plus size={14} />
            Signaler un décès MDO
          </button>
        </div>

        {showCas2Form && (
          <div className="border-t px-5 py-5 space-y-4" style={{ borderColor: "#FEF3C7", backgroundColor: "#FFFBEB" }}>
            <p className="text-sm font-medium" style={{ color: "#92400E" }}>
              Signalement d&apos;un décès lié à une MDO non encore déclarée — une alerte sera automatiquement envoyée à l&apos;unité de surveillance épidémiologique.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#374151" }}>Nom du patient <span style={{ color: "#DC2626" }}>*</span></label>
                <input type="text" value={form.nomPatient} onChange={e => setForm(f => ({ ...f, nomPatient: e.target.value }))} className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" style={{ borderColor: "#E5E7EB" }} placeholder="Nom de famille" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#374151" }}>Prénom</label>
                <input type="text" value={form.prenomPatient} onChange={e => setForm(f => ({ ...f, prenomPatient: e.target.value }))} className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" style={{ borderColor: "#E5E7EB" }} placeholder="Prénom" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#374151" }}>Date du décès <span style={{ color: "#DC2626" }}>*</span></label>
                <input type="date" value={form.dateDeces} onChange={e => setForm(f => ({ ...f, dateDeces: e.target.value }))} className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" style={{ borderColor: "#E5E7EB" }} />
              </div>
              <SearchableSelect
                label="Pathologie MDO suspectée"
                placeholder="Sélectionner une maladie MDO..."
                value={form.maladieId}
                onChange={v => setForm(f => ({ ...f, maladieId: v }))}
                options={maladies.map(m => ({ value: m.id, label: `${m.nom}${m.codeCim10 ? ` (${m.codeCim10})` : ""}` }))}
                required
              />
              <SearchableSelect
                label="Service hospitalier"
                placeholder="Sélectionner un service..."
                value={form.service}
                onChange={v => setForm(f => ({ ...f, service: v }))}
                options={SERVICES_EHU.map(s => ({ value: s.nom, label: s.nom }))}
              />
              <SearchableSelect
                label="Wilaya de résidence"
                placeholder="Sélectionner une wilaya..."
                value={form.wilaya}
                onChange={v => setForm(f => ({ ...f, wilaya: v }))}
                options={WILAYAS.map(w => ({ value: w.nom, label: `${w.code} — ${w.nom}` }))}
              />
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#374151" }}>Date d&apos;admission</label>
                <input type="date" value={form.dateAdmission} onChange={e => setForm(f => ({ ...f, dateAdmission: e.target.value }))} className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" style={{ borderColor: "#E5E7EB" }} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#374151" }}>Détails complémentaires</label>
                <textarea value={form.details} onChange={e => setForm(f => ({ ...f, details: e.target.value }))} rows={3} className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none" style={{ borderColor: "#E5E7EB" }} placeholder="Contexte clinique, informations utiles pour la déclaration rétrospective..." />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <button onClick={submitCas2} disabled={submitting} className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-60" style={{ backgroundColor: "#D97706", color: "#fff" }}>
                <Send size={14} />
                {submitting ? "Envoi en cours…" : "Générer l'alerte épidémiologique"}
              </button>
              <button onClick={() => setShowCas2Form(false)} className="px-4 py-2.5 rounded-lg text-sm border transition-colors hover:bg-gray-50" style={{ borderColor: "#E5E7EB", color: "#6B7280" }}>
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── CAS 3 ─────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
        <button
          onClick={() => setExpandedCas3(v => !v)}
          className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors hover:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "#F0FDF4" }}>
              <TrendingDown size={15} style={{ color: "#16A34A" }} />
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: "#111827" }}>Cas 3 — MDO confirmée avec issue fatale</p>
              <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>Lien fonctionnel : Calcul de létalité par MDO · Alimentation automatique du taux de létalité par pathologie</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {data && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: "#DCFCE7", color: "#166534" }}>
                {data.cas3_tauxLetaliteParPathologie.length} pathologies
              </span>
            )}
            {expandedCas3 ? <ChevronUp size={16} style={{ color: "#9CA3AF" }} /> : <ChevronDown size={16} style={{ color: "#9CA3AF" }} />}
          </div>
        </button>

        {expandedCas3 && (
          loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-5 h-5 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !data || data.cas3_tauxLetaliteParPathologie.length === 0 ? (
            <div className="text-center py-10 border-t" style={{ borderColor: "#F3F4F6", color: "#9CA3AF" }}>
              <TrendingDown size={28} className="mx-auto mb-2 opacity-20" />
              <p className="text-sm">Aucune donnée de létalité disponible sur la période</p>
            </div>
          ) : (
            <div className="border-t overflow-x-auto" style={{ borderColor: "#F3F4F6" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: "#F0FDF4", borderBottom: "1px solid #BBF7D0" }}>
                    {["Pathologie MDO", "CIM-10", "Cas Confirmés", "Décès", "Taux de Létalité"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap" style={{ color: "#166534" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "#F0FDF4" }}>
                  {data.cas3_tauxLetaliteParPathologie.map(r => {
                    const tauxStyle = getTauxColor(r.tauxLetalite)
                    const barWidth = Math.min(100, r.tauxLetalite * 5)
                    return (
                      <tr key={r.maladieId ?? r.maladie} className="hover:bg-green-50/30 transition-colors">
                        <td className="px-4 py-3 max-w-[220px]">
                          <span className="text-sm line-clamp-2" style={{ color: "#374151" }}>{r.maladie}</span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs" style={{ color: "#6B7280" }}>{r.codeCim10}</td>
                        <td className="px-4 py-3 text-sm font-medium text-center" style={{ color: "#374151" }}>{r.casConfirmes}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-center" style={{ color: "#DC2626" }}>{r.casDeces}</td>
                        <td className="px-4 py-4 min-w-[180px]">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                              <div className="h-full rounded-full transition-all" style={{ width: `${barWidth}%`, backgroundColor: r.tauxLetalite >= 10 ? "#DC2626" : r.tauxLetalite >= 5 ? "#D97706" : r.tauxLetalite >= 1 ? "#CA8A04" : "#16A34A" }} />
                            </div>
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold min-w-[60px] justify-center" style={{ backgroundColor: tauxStyle.bg, color: tauxStyle.text }}>
                              {r.tauxLetalite.toFixed(1)} %
                            </span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <div className="px-5 py-3 border-t flex flex-wrap gap-4 text-xs" style={{ borderColor: "#F3F4F6", color: "#6B7280", backgroundColor: "#FAFAFA" }}>
                <span>Légende taux de létalité :</span>
                {[{ label: "< 1 %", color: "#16A34A", bg: "#DCFCE7" }, { label: "1–5 %", color: "#CA8A04", bg: "#FEF9C3" }, { label: "5–10 %", color: "#D97706", bg: "#FEF3C7" }, { label: "> 10 %", color: "#DC2626", bg: "#FEE2E2" }].map(l => (
                  <span key={l.label} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: l.bg, color: l.color }}>{l.label}</span>
                ))}
              </div>
            </div>
          )
        )}
      </div>

      {data && (
        <p className="text-xs text-right" style={{ color: "#9CA3AF" }}>
          Données générées le {new Date(data.meta.genereLe).toLocaleString("fr-DZ", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
        </p>
      )}
    </div>
  )
}
