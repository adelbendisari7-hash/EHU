"use client"

import { useState, useEffect } from "react"
import { Plus, Pencil, X, Check, ToggleLeft, ToggleRight, Loader2, Search } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/utils/cn"
import { SYMPTOM_CATEGORIES } from "@/constants/symptoms"
import { ANTECEDENTS_PREDEFINED } from "@/constants/antecedents"

interface Symptome { id: string; nom: string; code: string; categorie: string | null; isActive: boolean }
interface Germe { id: string; nom: string; code: string; type: string | null; isActive: boolean }

type Tab = "symptomes" | "germes" | "antecedents"

export default function ReferentielsPage() {
  const [tab, setTab] = useState<Tab>("symptomes")
  const [symptomes, setSymptomes] = useState<Symptome[]>([])
  const [germes, setGermes] = useState<Germe[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  // Symptome add form
  const [newSymNom, setNewSymNom] = useState("")
  const [newSymCat, setNewSymCat] = useState("")
  const [symAdding, setSymAdding] = useState(false)

  // Germe add form
  const [newGerNom, setNewGerNom] = useState("")
  const [newGerCode, setNewGerCode] = useState("")
  const [gerAdding, setGerAdding] = useState(false)

  // Inline edit state
  const [editing, setEditing] = useState<{ id: string; nom: string; extra: string } | null>(null)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch("/api/symptomes?all=true&take=500").then(r => r.json()),
      fetch("/api/germes?all=true").then(r => r.json()),
    ]).then(([syms, gers]) => {
      setSymptomes(syms)
      setGermes(gers)
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  // ── Symptome actions ────────────────────────────────────────────────────────
  const addSymptome = async () => {
    if (!newSymNom.trim() || newSymNom.trim().length < 2) return
    setSymAdding(true)
    try {
      const res = await fetch("/api/symptomes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom: newSymNom.trim(), categorie: newSymCat || null }),
      })
      if (!res.ok) { toast.error((await res.json()).error ?? "Erreur"); return }
      const s: Symptome = await res.json()
      setSymptomes(prev => [...prev, s].sort((a, b) => a.nom.localeCompare(b.nom)))
      setNewSymNom(""); setNewSymCat("")
      toast.success(`Symptôme "${s.nom}" ajouté`)
    } catch { toast.error("Erreur serveur") } finally { setSymAdding(false) }
  }

  const toggleSymptome = async (s: Symptome) => {
    const res = await fetch(`/api/symptomes/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !s.isActive }),
    })
    if (res.ok) {
      setSymptomes(prev => prev.map(x => x.id === s.id ? { ...x, isActive: !s.isActive } : x))
      toast.success(s.isActive ? "Désactivé" : "Activé")
    }
  }

  const saveSymptome = async () => {
    if (!editing) return
    const res = await fetch(`/api/symptomes/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nom: editing.nom, categorie: editing.extra || null }),
    })
    if (res.ok) {
      const updated: Symptome = await res.json()
      setSymptomes(prev => prev.map(x => x.id === updated.id ? updated : x))
      setEditing(null)
      toast.success("Modifié")
    }
  }

  // ── Germe actions ───────────────────────────────────────────────────────────
  const addGerme = async () => {
    if (!newGerNom.trim() || newGerNom.trim().length < 2) return
    setGerAdding(true)
    try {
      const res = await fetch("/api/germes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom: newGerNom.trim(), code: newGerCode.trim() || "U82.8" }),
      })
      if (!res.ok) { toast.error((await res.json()).error ?? "Erreur"); return }
      const g: Germe = await res.json()
      setGermes(prev => [...prev, g].sort((a, b) => a.code.localeCompare(b.code)))
      setNewGerNom(""); setNewGerCode("")
      toast.success(`Germe "${g.nom}" ajouté`)
    } catch { toast.error("Erreur serveur") } finally { setGerAdding(false) }
  }

  const toggleGerme = async (g: Germe) => {
    const res = await fetch(`/api/germes/${g.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !g.isActive }),
    })
    if (res.ok) {
      setGermes(prev => prev.map(x => x.id === g.id ? { ...x, isActive: !g.isActive } : x))
      toast.success(g.isActive ? "Désactivé" : "Activé")
    }
  }

  const saveGerme = async () => {
    if (!editing) return
    const res = await fetch(`/api/germes/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nom: editing.nom, code: editing.extra }),
    })
    if (res.ok) {
      const updated: Germe = await res.json()
      setGermes(prev => prev.map(x => x.id === updated.id ? updated : x))
      setEditing(null)
      toast.success("Modifié")
    }
  }

  const q = search.toLowerCase()

  const filteredSymp = symptomes.filter(s =>
    s.nom.toLowerCase().includes(q) || (s.categorie ?? "").toLowerCase().includes(q)
  )
  const filteredGer = germes.filter(g =>
    g.nom.toLowerCase().includes(q) || g.code.toLowerCase().includes(q)
  )
  const filteredAtcd = ANTECEDENTS_PREDEFINED.filter(a => a.toLowerCase().includes(q))

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: "symptomes", label: "Symptômes", count: symptomes.length },
    { key: "germes", label: "Germes BMR", count: germes.length },
    { key: "antecedents", label: "Antécédents", count: ANTECEDENTS_PREDEFINED.length },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Référentiels</h1>
        <p className="text-sm text-gray-500 mt-1">Gérer les listes de symptômes, germes et antécédents utilisées dans les formulaires</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-lg w-fit">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setSearch(""); setEditing(null) }}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-all",
              tab === t.key ? "bg-white text-[#1B4F8A] shadow-sm" : "text-gray-600 hover:text-gray-800"
            )}
          >
            {t.label}
            <span className={cn(
              "ml-2 text-[11px] px-1.5 py-0.5 rounded-full",
              tab === t.key ? "bg-[#EBF1FA] text-[#1B4F8A]" : "bg-gray-200 text-gray-500"
            )}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher..."
          className="input pl-9 text-sm"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
          <Loader2 size={18} className="animate-spin mr-2" /> Chargement...
        </div>
      ) : (
        <>
          {/* ── SYMPTÔMES ────────────────────────────────────────── */}
          {tab === "symptomes" && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              {/* Add row */}
              <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Ajouter un symptôme</p>
                <div className="grid gap-2" style={{ gridTemplateColumns: "1fr 160px auto" }}>
                  <input
                    value={newSymNom} onChange={e => setNewSymNom(e.target.value)}
                    placeholder="Nom du symptôme..." className="input text-sm"
                    onKeyDown={e => e.key === "Enter" && addSymptome()}
                  />
                  <select value={newSymCat} onChange={e => setNewSymCat(e.target.value)} className="input text-sm">
                    <option value="">Catégorie...</option>
                    {SYMPTOM_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                  </select>
                  <button onClick={addSymptome} disabled={symAdding || newSymNom.trim().length < 2}
                    className="btn btn-primary btn-sm disabled:opacity-50 whitespace-nowrap">
                    {symAdding ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Ajouter
                  </button>
                </div>
              </div>

              {/* List */}
              <div className="divide-y divide-gray-100">
                {filteredSymp.length === 0 && (
                  <p className="p-4 text-sm text-gray-400 text-center">Aucun symptôme trouvé</p>
                )}
                {filteredSymp.map(s => (
                  <div key={s.id} className={cn("flex items-center gap-3 px-4 py-3 group", !s.isActive && "opacity-50")}>
                    {editing?.id === s.id ? (
                      <>
                        <input value={editing.nom} onChange={e => setEditing({ ...editing, nom: e.target.value })}
                          className="input text-sm flex-1" autoFocus />
                        <select value={editing.extra} onChange={e => setEditing({ ...editing, extra: e.target.value })}
                          className="input text-sm w-40">
                          <option value="">Sans catégorie</option>
                          {SYMPTOM_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                        </select>
                        <button onClick={saveSymptome} className="text-green-600 hover:text-green-700 p-1"><Check size={15} /></button>
                        <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600 p-1"><X size={15} /></button>
                      </>
                    ) : (
                      <>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800 truncate">{s.nom}</p>
                          {s.categorie && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              {SYMPTOM_CATEGORIES.find(c => c.key === s.categorie)?.label ?? s.categorie}
                            </p>
                          )}
                        </div>
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full font-medium",
                          s.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                        )}>{s.isActive ? "Actif" : "Inactif"}</span>
                        <button onClick={() => setEditing({ id: s.id, nom: s.nom, extra: s.categorie ?? "" })}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-[#1B4F8A] p-1 transition-opacity">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => toggleSymptome(s)}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-amber-600 p-1 transition-opacity">
                          {s.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── GERMES ───────────────────────────────────────────── */}
          {tab === "germes" && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              {/* Add row */}
              <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Ajouter un germe</p>
                <div className="grid gap-2" style={{ gridTemplateColumns: "1fr 130px auto" }}>
                  <input
                    value={newGerNom} onChange={e => setNewGerNom(e.target.value)}
                    placeholder="Nom du germe..." className="input text-sm"
                    onKeyDown={e => e.key === "Enter" && addGerme()}
                  />
                  <input
                    value={newGerCode} onChange={e => setNewGerCode(e.target.value)}
                    placeholder="Code CIM-10..." className="input text-sm"
                  />
                  <button onClick={addGerme} disabled={gerAdding || newGerNom.trim().length < 2}
                    className="btn btn-primary btn-sm disabled:opacity-50 whitespace-nowrap">
                    {gerAdding ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Ajouter
                  </button>
                </div>
              </div>

              {/* List */}
              <div className="divide-y divide-gray-100">
                {filteredGer.length === 0 && (
                  <p className="p-4 text-sm text-gray-400 text-center">Aucun germe trouvé</p>
                )}
                {filteredGer.map(g => (
                  <div key={g.id} className={cn("flex items-center gap-3 px-4 py-3 group", !g.isActive && "opacity-50")}>
                    {editing?.id === g.id ? (
                      <>
                        <input value={editing.nom} onChange={e => setEditing({ ...editing, nom: e.target.value })}
                          className="input text-sm flex-1" autoFocus />
                        <input value={editing.extra} onChange={e => setEditing({ ...editing, extra: e.target.value })}
                          placeholder="Code CIM-10" className="input text-sm w-28" />
                        <button onClick={saveGerme} className="text-green-600 hover:text-green-700 p-1"><Check size={15} /></button>
                        <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600 p-1"><X size={15} /></button>
                      </>
                    ) : (
                      <>
                        <span className="text-xs font-mono font-bold text-[#1B4F8A] bg-[#EBF1FA] px-2 py-1 rounded shrink-0">
                          {g.code}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800 truncate">{g.nom}</p>
                          {g.type && <p className="text-xs text-gray-400 mt-0.5 capitalize">{g.type}</p>}
                        </div>
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full font-medium",
                          g.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                        )}>{g.isActive ? "Actif" : "Inactif"}</span>
                        <button onClick={() => setEditing({ id: g.id, nom: g.nom, extra: g.code })}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-[#1B4F8A] p-1 transition-opacity">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => toggleGerme(g)}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-amber-600 p-1 transition-opacity">
                          {g.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── ANTÉCÉDENTS ──────────────────────────────────────── */}
          {tab === "antecedents" && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="p-4 border-b border-gray-100 bg-amber-50/50">
                <p className="text-xs text-amber-700 font-medium">
                  La liste des antécédents est définie dans le fichier de configuration. Modifiez{" "}
                  <code className="font-mono bg-amber-100 px-1 rounded">src/constants/antecedents.ts</code>{" "}
                  pour ajouter ou supprimer des entrées permanentes.
                </p>
              </div>
              <div className="divide-y divide-gray-100">
                {filteredAtcd.map((a, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0" />
                    <p className="text-sm text-gray-800 flex-1">{a}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">Actif</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
