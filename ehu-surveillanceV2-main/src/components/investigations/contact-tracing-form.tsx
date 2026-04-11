"use client"

import { useState } from "react"
import { UserPlus } from "lucide-react"

interface Props {
  investigationId: string
  onAdded: () => void
}

export default function ContactTracingForm({ investigationId, onAdded }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ nom: "", telephone: "", relation: "", notes: "" })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nom || !form.telephone) return
    setLoading(true)
    await fetch(`/api/investigations/${investigationId}/contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    setForm({ nom: "", telephone: "", relation: "", notes: "" })
    setLoading(false)
    setOpen(false)
    onAdded()
  }

  const input = "w-full h-9 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#1B4F8A]"

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white transition-colors"
        style={{ backgroundColor: "#1B4F8A" }}
      >
        <UserPlus size={15} /> Ajouter un Contact
      </button>

      {open && (
        <form onSubmit={submit} className="mt-3 p-4 bg-gray-50 rounded-xl border border-gray-100 grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nom complet *</label>
            <input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} className={input} placeholder="Nom du contact" required />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Téléphone *</label>
            <input value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} className={input} placeholder="0555 xx xx xx" required />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Relation</label>
            <input value={form.relation} onChange={e => setForm(f => ({ ...f, relation: e.target.value }))} className={input} placeholder="Famille, collègue..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className={input} placeholder="Observations..." />
          </div>
          <div className="col-span-2 flex gap-2 justify-end">
            <button type="button" onClick={() => setOpen(false)} className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-100">Annuler</button>
            <button type="submit" disabled={loading} className="px-3 py-1.5 rounded-lg text-sm text-white font-medium disabled:opacity-60" style={{ backgroundColor: "#27AE60" }}>
              {loading ? "Ajout..." : "Ajouter"}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
