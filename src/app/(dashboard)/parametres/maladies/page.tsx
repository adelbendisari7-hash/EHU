"use client"

import { useState, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { Shield, Search, X, Check, Pencil, Trash2, Plus } from "lucide-react"

interface Maladie {
  id: string
  nom: string
  codeCim10: string
  categorie: string
  isActive: boolean
}

interface Seuil {
  id: string
  maladieId: string
  perimetre: string
  seuilNombre: number
  periodejours: number
  gravite: string
  autoAlerte: boolean
  autoNotification: boolean
  isActive: boolean
  wilayadId: string | null
  communeId: string | null
  wilaya: { nom: string } | null
  commune: { nom: string } | null
}

interface Wilaya {
  id: string
  nom: string
  code: string
}

const GRAVITE_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  attention: { label: "Attention", bg: "#FEF9C3", color: "#B45309" },
  urgent:    { label: "Urgent",    bg: "#FFEDD5", color: "#C2410C" },
  critique:  { label: "Critique",  bg: "#FEE2E2", color: "#B91C1C" },
}

const PERIMETRE_LABELS: Record<string, string> = {
  national: "National",
  wilaya: "Wilaya",
  commune: "Commune",
}

// Seuils officiels algériens (décret 03-476) extraits du référentiel MDO
// Valeurs officielles selon le référentiel MDO algérien (tableau PDF fourni)
// periodejours = délai de déclaration converti en jours de fenêtre de comptage :
//   Immédiat / urgence → 1 jour   |   24h (quotidien) → 1 jour
//   Hebdomadaire       → 7 jours  |   Mensuel         → 30 jours
//   Exception PAVM     → 7 jours  (PDF : « même service / 7j »)
//   Exception ISO      → 7 jours  (regroupement pratique sur le même service)
type SeuilDefault = { seuilNombre: number; periodejours: number; gravite: "attention" | "urgent" | "critique" }
const SEUILS_MDO: Array<{ keywords: string[]; seuil: SeuilDefault }> = [
  // ── Immédiat (urgence) ──────────────────────────────────────────────────
  { keywords: ["haemophilus"],                                    seuil: { seuilNombre: 1, periodejours: 1,  gravite: "critique" } },
  { keywords: ["méningocoque", "meningocoque"],                   seuil: { seuilNombre: 1, periodejours: 1,  gravite: "critique" } },
  { keywords: ["pneumocoque"],                                    seuil: { seuilNombre: 2, periodejours: 1,  gravite: "critique" } },
  { keywords: ["méningite virale", "meningite virale"],           seuil: { seuilNombre: 2, periodejours: 1,  gravite: "critique" } },
  { keywords: ["méningo-encéphalite", "meningo-encephalite"],     seuil: { seuilNombre: 1, periodejours: 1,  gravite: "critique" } },
  { keywords: ["multirésistante", "multiresistante", "bmr"],      seuil: { seuilNombre: 1, periodejours: 1,  gravite: "critique" } },
  { keywords: ["site opératoire", "site operatoire"],             seuil: { seuilNombre: 2, periodejours: 7,  gravite: "critique" } }, // ISO : même service
  { keywords: ["pneumopathie", "ventilation mécanique"],          seuil: { seuilNombre: 2, periodejours: 7,  gravite: "critique" } }, // PAVM : PDF « / 7j »
  { keywords: ["paludisme"],                                      seuil: { seuilNombre: 1, periodejours: 1,  gravite: "critique" } },
  { keywords: ["paralysie flasque"],                              seuil: { seuilNombre: 1, periodejours: 1,  gravite: "critique" } },
  { keywords: ["poliomyélite", "poliomyelite"],                   seuil: { seuilNombre: 1, periodejours: 1,  gravite: "critique" } },
  // ── Quotidien (24h) ─────────────────────────────────────────────────────
  { keywords: ["botulisme"],                                      seuil: { seuilNombre: 1, periodejours: 1,  gravite: "urgent"   } },
  { keywords: ["brucellose"],                                     seuil: { seuilNombre: 2, periodejours: 1,  gravite: "urgent"   } },
  { keywords: ["charbon"],                                        seuil: { seuilNombre: 1, periodejours: 1,  gravite: "critique" } },
  { keywords: ["coqueluche"],                                     seuil: { seuilNombre: 2, periodejours: 1,  gravite: "urgent"   } },
  { keywords: ["diphtérie", "diphterie"],                         seuil: { seuilNombre: 1, periodejours: 1,  gravite: "critique" } },
  { keywords: ["dysenterie"],                                     seuil: { seuilNombre: 3, periodejours: 1,  gravite: "urgent"   } },
  { keywords: ["échinococcose", "echinococcose", "hydatique"],    seuil: { seuilNombre: 2, periodejours: 1,  gravite: "attention" } },
  { keywords: ["typhoïde", "typhoide", "paratyphoïde"],           seuil: { seuilNombre: 2, periodejours: 1,  gravite: "urgent"   } },
  { keywords: ["hépatite virale a", "hepatite virale a"],         seuil: { seuilNombre: 2, periodejours: 1,  gravite: "urgent"   } },
  { keywords: ["légionellose", "legionellose"],                   seuil: { seuilNombre: 2, periodejours: 1,  gravite: "urgent"   } },
  { keywords: ["leischmaniose cutanée", "leishmaniose cutanée"],  seuil: { seuilNombre: 3, periodejours: 1,  gravite: "attention" } },
  { keywords: ["leischmaniose viscérale", "leishmaniose viscérale"], seuil: { seuilNombre: 1, periodejours: 1, gravite: "urgent" } },
  { keywords: ["lèpre", "lepre"],                                 seuil: { seuilNombre: 1, periodejours: 1,  gravite: "attention" } },
  { keywords: ["leptospirose"],                                   seuil: { seuilNombre: 1, periodejours: 1,  gravite: "urgent"   } },
  { keywords: ["listériose", "listeriose"],                       seuil: { seuilNombre: 1, periodejours: 1,  gravite: "urgent"   } },
  { keywords: ["peste"],                                          seuil: { seuilNombre: 1, periodejours: 1,  gravite: "critique" } },
  { keywords: ["rage"],                                           seuil: { seuilNombre: 1, periodejours: 1,  gravite: "critique" } },
  { keywords: ["rickettsiose", "fièvre boutonneuse"],             seuil: { seuilNombre: 1, periodejours: 1,  gravite: "urgent"   } },
  { keywords: ["rougeole"],                                       seuil: { seuilNombre: 1, periodejours: 1,  gravite: "critique" } },
  { keywords: ["rubéole", "rubeole"],                             seuil: { seuilNombre: 2, periodejours: 1,  gravite: "urgent"   } },
  { keywords: ["schistosomiase", "bilharziose"],                  seuil: { seuilNombre: 1, periodejours: 1,  gravite: "attention" } },
  { keywords: ["tétanos néonatal", "tetanos neonatal"],           seuil: { seuilNombre: 1, periodejours: 1,  gravite: "critique" } },
  { keywords: ["tétanos non néonatal", "tetanos non neonatal"],   seuil: { seuilNombre: 1, periodejours: 1,  gravite: "urgent"   } },
  { keywords: ["toxi-infection", "tiac"],                         seuil: { seuilNombre: 2, periodejours: 1,  gravite: "critique" } },
  { keywords: ["trachome"],                                       seuil: { seuilNombre: 1, periodejours: 1,  gravite: "attention" } },
  { keywords: ["typhus"],                                         seuil: { seuilNombre: 1, periodejours: 1,  gravite: "urgent"   } },
  { keywords: ["chikungunya"],                                    seuil: { seuilNombre: 1, periodejours: 1,  gravite: "critique" } },
  { keywords: ["choléra", "cholera"],                             seuil: { seuilNombre: 1, periodejours: 1,  gravite: "critique" } },
  { keywords: ["dengue"],                                         seuil: { seuilNombre: 1, periodejours: 1,  gravite: "critique" } },
  { keywords: ["ebola"],                                          seuil: { seuilNombre: 1, periodejours: 1,  gravite: "critique" } },
  { keywords: ["fièvre jaune", "fievre jaune"],                   seuil: { seuilNombre: 1, periodejours: 1,  gravite: "critique" } },
  { keywords: ["west nile"],                                      seuil: { seuilNombre: 1, periodejours: 1,  gravite: "critique" } },
  { keywords: ["vallée du rift", "vallee du rift", "rift"],       seuil: { seuilNombre: 1, periodejours: 1,  gravite: "critique" } },
  { keywords: ["hémorragique", "hemorragique"],                   seuil: { seuilNombre: 1, periodejours: 1,  gravite: "critique" } },
  { keywords: ["nouveau sous-type", "grippe causée"],             seuil: { seuilNombre: 1, periodejours: 1,  gravite: "critique" } },
  { keywords: ["sars-cov-2", "sars-cov", "covid"],                seuil: { seuilNombre: 1, periodejours: 1,  gravite: "critique" } },
  { keywords: ["sras", "sars"],                                   seuil: { seuilNombre: 1, periodejours: 1,  gravite: "critique" } },
  { keywords: ["mers"],                                           seuil: { seuilNombre: 1, periodejours: 1,  gravite: "critique" } },
  { keywords: ["variole"],                                        seuil: { seuilNombre: 1, periodejours: 1,  gravite: "critique" } },
  // ── Hebdomadaire (7 jours) ───────────────────────────────────────────────
  { keywords: ["hépatite virale b", "hepatite b"],                seuil: { seuilNombre: 3, periodejours: 7,  gravite: "attention" } },
  { keywords: ["hépatite virale c", "hepatite c"],                seuil: { seuilNombre: 3, periodejours: 7,  gravite: "attention" } },
  { keywords: ["chlamydia"],                                      seuil: { seuilNombre: 3, periodejours: 7,  gravite: "attention" } },
  { keywords: ["vih", "sida"],                                    seuil: { seuilNombre: 1, periodejours: 7,  gravite: "urgent"   } },
  { keywords: ["syphilis"],                                       seuil: { seuilNombre: 3, periodejours: 7,  gravite: "attention" } },
  { keywords: ["urétrite gonococcique", "uretrite gonococcique"], seuil: { seuilNombre: 3, periodejours: 7,  gravite: "attention" } },
  // ── Mensuel (30 jours) ──────────────────────────────────────────────────
  { keywords: ["tuberculose pulmonaire"],                         seuil: { seuilNombre: 5, periodejours: 30, gravite: "attention" } },
  { keywords: ["tuberculose extra", "tuberculose extrapulmonaire"], seuil: { seuilNombre: 5, periodejours: 30, gravite: "attention" } },
]

function normalize(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
}

function getSeuilDefaut(nomMaladie: string): { seuilNombre: string; periodejours: string; gravite: string } {
  const nom = normalize(nomMaladie)
  for (const entry of SEUILS_MDO) {
    if (entry.keywords.some(kw => nom.includes(normalize(kw)))) {
      return {
        seuilNombre: String(entry.seuil.seuilNombre),
        periodejours: String(entry.seuil.periodejours),
        gravite: entry.seuil.gravite,
      }
    }
  }
  return { seuilNombre: "2", periodejours: "30", gravite: "urgent" }
}

const DEFAULT_FORM = {
  maladieId: "",
  perimetre: "national",
  wilayadId: "",
  communeId: "",
  seuilNombre: "2",
  periodejours: "30",
  gravite: "urgent",
  autoAlerte: true,
  autoNotification: true,
}

const inputCls = "w-full h-9 px-3 rounded-lg border border-gray-200 text-[13px] outline-none focus:border-[#1B4F8A] focus:ring-1 focus:ring-[#1B4F8A]/20 bg-white"

export default function MaladiesPage() {
  const [maladies, setMaladies] = useState<Maladie[]>([])
  const [seuils, setSeuils] = useState<Seuil[]>([])
  const [wilayas, setWilayas] = useState<Wilaya[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [modal, setModal] = useState<{ open: boolean; editSeuil?: Seuil; maladieId?: string; maladieName?: string }>({ open: false })
  const [form, setForm] = useState({ ...DEFAULT_FORM })
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [mRes, sRes, wRes] = await Promise.all([
        fetch("/api/maladies?all=true"),
        fetch("/api/seuils"),
        fetch("/api/wilayas"),
      ])
      const mData = await mRes.json()
      const sData = await sRes.json()
      const wData = await wRes.json()
      setMaladies(mData.maladies ?? mData)
      setSeuils(Array.isArray(sData) ? sData : [])
      setWilayas(Array.isArray(wData) ? wData : (wData.wilayas ?? []))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const seuilByMaladieId = Object.fromEntries(seuils.map(s => [s.maladieId, s]))

  const filtered = maladies.filter(m =>
    m.categorie !== "categorie_3_bmr" &&
    (!search || m.nom.toLowerCase().includes(search.toLowerCase()) || m.codeCim10.toLowerCase().includes(search.toLowerCase()))
  )

  const stats = {
    total: maladies.length,
    actifs: seuils.filter(s => s.isActive).length,
    nonConfigures: maladies.filter(m => !seuilByMaladieId[m.id]).length,
  }

  const openAdd = (m: Maladie) => {
    const defaut = getSeuilDefaut(m.nom)
    setForm({ ...DEFAULT_FORM, maladieId: m.id, ...defaut })
    setModal({ open: true, maladieId: m.id, maladieName: m.nom })
  }

  const openEdit = (seuil: Seuil, maladieName: string) => {
    setForm({
      maladieId: seuil.maladieId,
      perimetre: seuil.perimetre,
      wilayadId: seuil.wilayadId ?? "",
      communeId: seuil.communeId ?? "",
      seuilNombre: String(seuil.seuilNombre),
      periodejours: String(seuil.periodejours),
      gravite: seuil.gravite,
      autoAlerte: seuil.autoAlerte,
      autoNotification: seuil.autoNotification,
    })
    setModal({ open: true, editSeuil: seuil, maladieName })
  }

  const closeModal = () => {
    setModal({ open: false })
    setForm({ ...DEFAULT_FORM })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        maladieId: form.maladieId,
        perimetre: form.perimetre,
        wilayadId: form.perimetre === "wilaya" ? (form.wilayadId || null) : null,
        communeId: form.perimetre === "commune" ? (form.communeId || null) : null,
        seuilNombre: Number(form.seuilNombre),
        periodejours: Number(form.periodejours),
        gravite: form.gravite,
        autoAlerte: form.autoAlerte,
        autoNotification: form.autoNotification,
      }
      if (modal.editSeuil) {
        const res = await fetch(`/api/seuils/${modal.editSeuil.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        const updated = await res.json()
        setSeuils(p => p.map(s => s.id === modal.editSeuil!.id ? { ...s, ...updated } : s))
      } else {
        const res = await fetch("/api/seuils", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        const created = await res.json()
        setSeuils(p => [created, ...p])
      }
      closeModal()
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (seuil: Seuil) => {
    await fetch(`/api/seuils/${seuil.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !seuil.isActive }),
    })
    setSeuils(p => p.map(s => s.id === seuil.id ? { ...s, isActive: !s.isActive } : s))
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/seuils/${id}`, { method: "DELETE" })
    setSeuils(p => p.filter(s => s.id !== id))
    setDeleteConfirm(null)
  }

  const modalContent = modal.open ? (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.35)" }}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <Shield size={16} className="text-[#1B4F8A]" />
            <div>
              <h3 className="text-[14px] font-semibold text-gray-800">
                {modal.editSeuil ? "Modifier le seuil" : "Configurer le seuil d'alerte"}
              </h3>
              {modal.maladieName && (
                <p className="text-[11px] text-gray-400 mt-0.5">{modal.maladieName}</p>
              )}
            </div>
          </div>
          <button onClick={closeModal} className="p-1 rounded hover:bg-gray-100 transition-colors">
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4">
          {/* Périmètre */}
          <div>
            <label className="text-[12px] font-medium text-gray-500 mb-1.5 block">Périmètre d&apos;application</label>
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              {(["national", "wilaya", "commune"] as const).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, perimetre: p }))}
                  className={`flex-1 py-2 text-[12px] font-medium transition-colors border-r border-gray-200 last:border-r-0 ${
                    form.perimetre === p ? "bg-[#1B4F8A] text-white" : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {PERIMETRE_LABELS[p]}
                </button>
              ))}
            </div>
          </div>

          {/* Wilaya */}
          {form.perimetre === "wilaya" && (
            <div>
              <label className="text-[12px] font-medium text-gray-500 mb-1.5 block">Wilaya</label>
              <select
                value={form.wilayadId}
                onChange={e => setForm(f => ({ ...f, wilayadId: e.target.value }))}
                className={inputCls}
              >
                <option value="">Toutes les wilayas</option>
                {wilayas.map(w => <option key={w.id} value={w.id}>{w.nom}</option>)}
              </select>
            </div>
          )}

          {/* Seuil nombre + Période */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-medium text-gray-500 mb-1.5 block">
                Nombre de déclarations *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  required
                  value={form.seuilNombre}
                  onChange={e => setForm(f => ({ ...f, seuilNombre: e.target.value }))}
                  className={inputCls}
                  placeholder="ex: 2"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">cas</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Pré-rempli selon le référentiel MDO algérien</p>
            </div>
            <div>
              <label className="text-[12px] font-medium text-gray-500 mb-1.5 block">
                Sur une période de *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  required
                  value={form.periodejours}
                  onChange={e => setForm(f => ({ ...f, periodejours: e.target.value }))}
                  className={inputCls}
                  placeholder="ex: 30"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">jours</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Fenêtre glissante de calcul</p>
            </div>
          </div>

          {/* Résumé de la règle */}
          {form.seuilNombre && form.periodejours && (
            <div className="rounded-lg bg-blue-50 border border-blue-100 px-3 py-2">
              <p className="text-[12px] text-blue-700">
                ⚡ Une alerte sera déclenchée si <strong>{form.seuilNombre} cas</strong> ou plus sont déclarés en <strong>{form.periodejours} jours</strong>
                {form.perimetre === "wilaya" && form.wilayadId ? " dans la wilaya sélectionnée" : form.perimetre === "national" ? " au niveau national" : ""}.
              </p>
            </div>
          )}

          {/* Gravité */}
          <div>
            <label className="text-[12px] font-medium text-gray-500 mb-1.5 block">Niveau de gravité de l&apos;alerte</label>
            <div className="flex gap-2">
              {(["attention", "urgent", "critique"] as const).map(g => {
                const cfg = GRAVITE_CONFIG[g]
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, gravite: g }))}
                    className="flex-1 py-2 rounded-lg text-[12px] font-medium border-2 transition-all"
                    style={
                      form.gravite === g
                        ? { backgroundColor: cfg.bg, color: cfg.color, borderColor: cfg.color }
                        : { backgroundColor: "white", color: "#9CA3AF", borderColor: "#E5E7EB" }
                    }
                  >
                    {cfg.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Options */}
          <div className="flex gap-4 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.autoAlerte}
                onChange={e => setForm(f => ({ ...f, autoAlerte: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300 accent-[#1B4F8A]"
              />
              <span className="text-[12px] text-gray-600">Créer une alerte automatiquement</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.autoNotification}
                onChange={e => setForm(f => ({ ...f, autoNotification: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300 accent-[#1B4F8A]"
              />
              <span className="text-[12px] text-gray-600">Notifier l&apos;équipe</span>
            </label>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 h-9 rounded-lg text-[13px] font-medium text-white transition-colors disabled:opacity-60"
              style={{ backgroundColor: "#1B4F8A" }}
            >
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
            <button
              type="button"
              onClick={closeModal}
              className="px-4 h-9 rounded-lg text-[13px] border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  ) : null

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/parametres" className="text-sm text-gray-400 hover:text-gray-600">← Paramètres</Link>
        <span className="text-gray-300">/</span>
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Maladies à Déclaration Obligatoire</h1>
          <p className="text-sm text-gray-400 mt-0.5">Gérez les maladies MDO et configurez leurs seuils d&apos;alerte automatiques</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "Maladies MDO", value: stats.total, color: "#1B4F8A", bg: "#EBF1FA" },
          { label: "Seuils actifs", value: stats.actifs, color: "#047857", bg: "#ECFDF5" },
          { label: "Non configurées", value: stats.nonConfigures, color: "#B45309", bg: "#FFFBEB" },
        ].map(s => (
          <div key={s.label} className="card p-4">
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[12px] text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-xs">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher une maladie..."
          className="input pl-9 h-[32px] text-[12px] w-full"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="card p-12 text-center text-sm text-gray-400">Chargement...</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                {["Code CIM-10", "Maladie", "Seuil d'alerte configuré", "Périmètre", "Gravité", "Seuil actif", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => {
                const s = seuilByMaladieId[m.id] ?? null
                const g = s ? GRAVITE_CONFIG[s.gravite] : null
                return (
                  <tr
                    key={m.id}
                    className={`border-b border-gray-50 transition-colors ${i % 2 === 1 ? "bg-gray-50/30" : ""}`}
                  >
                    <td className="px-4 py-3 text-[12px] font-mono text-gray-500">{m.codeCim10}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-medium text-gray-800">{m.nom}</p>
                        {!m.isActive && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-400">Inactive</span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">{m.categorie}</p>
                    </td>

                    <td className="px-4 py-3">
                      {s ? (
                        <span className="text-[13px] font-semibold text-gray-800">
                          {s.seuilNombre} cas / {s.periodejours} j
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                          Non configuré
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-[13px] text-gray-500">
                      {s ? (
                        <span>
                          {PERIMETRE_LABELS[s.perimetre] ?? s.perimetre}
                          {s.perimetre === "wilaya" && s.wilaya && <span className="text-gray-400"> — {s.wilaya.nom}</span>}
                          {s.perimetre === "commune" && s.commune && <span className="text-gray-400"> — {s.commune.nom}</span>}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {g ? (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: g.bg, color: g.color }}>
                          {g.label}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-[12px]">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {s ? (
                        <button
                          onClick={() => handleToggle(s)}
                          title={s.isActive ? "Désactiver" : "Activer"}
                          className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${s.isActive ? "bg-green-400" : "bg-gray-200"}`}
                        >
                          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${s.isActive ? "translate-x-4" : "translate-x-0.5"}`} />
                        </button>
                      ) : (
                        <span className="text-gray-300 text-[11px]">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {s ? (
                          <>
                            <button
                              onClick={() => openEdit(s, m.nom)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-[#1B4F8A] hover:bg-blue-50 transition-colors"
                              title="Modifier le seuil"
                            >
                              <Pencil size={13} />
                            </button>
                            {deleteConfirm === s.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleDelete(s.id)}
                                  className="p-1 rounded text-red-500 hover:bg-red-50"
                                  title="Confirmer"
                                >
                                  <Check size={12} />
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm(null)}
                                  className="p-1 rounded text-gray-400 hover:bg-gray-100"
                                  title="Annuler"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirm(s.id)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                title="Supprimer le seuil"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </>
                        ) : (
                          <button
                            onClick={() => openAdd(m)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-white transition-colors"
                            style={{ backgroundColor: "#1B4F8A" }}
                          >
                            <Plus size={11} /> Configurer
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/50">
            <p className="text-[11px] text-gray-400">{filtered.length} maladie{filtered.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
      )}

      {/* Modal via portal — contourne l'animation CSS du layout qui casse position:fixed */}
      {mounted && createPortal(modalContent, document.body)}
    </div>
  )
}
