"use client"

import { useState } from "react"
import { Phone, User } from "lucide-react"

interface Contact {
  id: string
  nom: string
  telephone: string
  relation: string | null
  statutSuivi: string
  notes: string | null
}

const STATUT_CONFIG: Record<string, { label: string; color: string; bg: string; next: string[] }> = {
  a_contacter: { label: "À contacter", color: "#B45309", bg: "#FFFBEB", next: ["contacte"] },
  contacte: { label: "Contacté", color: "#1B4F8A", bg: "#EEF4FF", next: ["sous_surveillance"] },
  sous_surveillance: { label: "Sous surveillance", color: "#7C3AED", bg: "#F5F3FF", next: ["libere"] },
  libere: { label: "Libéré", color: "#047857", bg: "#ECFDF5", next: [] },
}

interface Props {
  contacts: Contact[]
  investigationId: string
  onUpdated: () => void
}

export default function ContactList({ contacts, investigationId, onUpdated }: Props) {
  const [updating, setUpdating] = useState<string | null>(null)

  const updateStatut = async (contactId: string, statutSuivi: string) => {
    setUpdating(contactId)
    await fetch(`/api/investigations/${investigationId}/contacts`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactId, statutSuivi }),
    })
    setUpdating(null)
    onUpdated()
  }

  if (!contacts.length) {
    return <p className="text-sm text-gray-400 py-4 text-center">Aucun contact tracé</p>
  }

  return (
    <div className="space-y-2">
      {contacts.map(c => {
        const config = STATUT_CONFIG[c.statutSuivi] ?? STATUT_CONFIG.a_contacter
        const nextStatuts = config.next
        return (
          <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <User size={14} className="text-gray-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">{c.nom}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Phone size={11} />
                  <span>{c.telephone}</span>
                  {c.relation && <span>• {c.relation}</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ color: config.color, backgroundColor: config.bg }}>
                {config.label}
              </span>
              {nextStatuts.map(next => (
                <button
                  key={next}
                  onClick={() => updateStatut(c.id, next)}
                  disabled={updating === c.id}
                  className="text-xs px-2 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-white transition-colors disabled:opacity-50"
                >
                  → {STATUT_CONFIG[next]?.label}
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
