"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Plus, Edit, Trash2, FileText } from "lucide-react"

interface Protocole {
  id: string
  titre: string
  version: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  maladie: { nom: string; codeCim10: string }
}

export default function ProtocoesPage() {
  const [protocoles, setProtocoles] = useState<Protocole[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/protocoles")
      .then(r => r.json())
      .then(setProtocoles)
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce protocole ?")) return
    await fetch(`/api/protocoles/${id}`, { method: "DELETE" })
    setProtocoles(p => p.filter(x => x.id !== id))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Protocoles de Prise en Charge</h1>
          <p className="text-sm text-gray-500 mt-1">Protocoles médicaux par maladie MDO</p>
        </div>
        <Link
          href="/parametres/protocoles/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ backgroundColor: "#1B4F8A" }}
        >
          <Plus size={16} />
          Nouveau Protocole
        </Link>
      </div>

      {loading ? (
        <div className="text-sm text-gray-400 text-center py-12">Chargement...</div>
      ) : protocoles.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <FileText size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">Aucun protocole configuré</p>
          <p className="text-gray-400 text-sm mt-1">Créez des protocoles pour chaque maladie MDO</p>
          <Link
            href="/parametres/protocoles/new"
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-white"
            style={{ backgroundColor: "#1B4F8A" }}
          >
            <Plus size={15} /> Créer le premier protocole
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Maladie</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Titre du Protocole</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Code MDO</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Version</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Mis à jour</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {protocoles.map(p => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 text-sm font-medium text-gray-800">{p.maladie.nom}</td>
                  <td className="px-5 py-3 text-sm text-gray-600 max-w-xs truncate">{p.titre}</td>
                  <td className="px-5 py-3">
                    <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{p.maladie.codeCim10}</span>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-500">v{p.version}</td>
                  <td className="px-5 py-3 text-xs text-gray-400">{new Date(p.updatedAt).toLocaleDateString("fr-FR")}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <Link
                        href={`/parametres/protocoles/${p.id}`}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-[#1B4F8A] hover:bg-blue-50 transition-colors"
                      >
                        <Edit size={15} />
                      </Link>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
