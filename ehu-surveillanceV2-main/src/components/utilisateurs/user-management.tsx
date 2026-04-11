"use client"

import { useState } from "react"
import { UserPlus, Power, X, Eye, EyeOff } from "lucide-react"
import { cn } from "@/utils/cn"
import { formatDate } from "@/utils/format-date"
import { toast } from "sonner"

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  isActive: boolean
  createdAt: string
  etablissement: { nom: string } | null
  wilaya: { nom: string } | null
}

interface Etablissement { id: string; nom: string }
interface Wilaya { id: string; nom: string; code: string }

const ROLE_LABELS: Record<string, string> = {
  medecin: "Médecin Déclarant",
  epidemiologiste: "Épidémiologiste",
  admin: "Administrateur",
}

const ROLE_COLORS: Record<string, { color: string; bg: string }> = {
  medecin: { color: "#1B4F8A", bg: "#EEF4FF" },
  epidemiologiste: { color: "#7C3AED", bg: "#F5F3FF" },
  admin: { color: "#B91C1C", bg: "#FEF2F2" },
}

interface Props {
  initialUsers: User[]
  etablissements: Etablissement[]
  wilayas: Wilaya[]
}

export default function UserManagement({ initialUsers, etablissements, wilayas }: Props) {
  const [users, setUsers] = useState(initialUsers)
  const [showForm, setShowForm] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("")
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "", role: "medecin", etablissementId: "", wilayadId: "" })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  // wilayas is available for future use
  void wilayas

  const filtered = users.filter(u => {
    const matchSearch = !search || `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase())
    const matchRole = !roleFilter || u.role === roleFilter
    return matchSearch && matchRole
  })

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError("")
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    if (!res.ok) {
      const err = await res.json() as { error?: string }
      const msg = err.error ?? "Erreur création"
      setError(msg)
      toast.error(msg)
    } else {
      const newUser = await res.json() as User
      setUsers(prev => [newUser, ...prev])
      setForm({ firstName: "", lastName: "", email: "", password: "", role: "medecin", etablissementId: "", wilayadId: "" })
      setShowForm(false)
      toast.success(`Utilisateur ${newUser.firstName} ${newUser.lastName} créé`)
    }
    setSubmitting(false)
  }

  const toggleActive = async (id: string, current: boolean) => {
    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
    })
    if (res.ok) {
      setUsers(prev => prev.map(u => u.id === id ? { ...u, isActive: !current } : u))
      toast.success(current ? "Utilisateur désactivé" : "Utilisateur activé")
    } else {
      toast.error("Erreur lors de la mise à jour")
    }
  }

  const input = "w-full h-9 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#1B4F8A]"

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Gestion des Utilisateurs</h1>
          <p className="text-sm text-gray-500 mt-1">{users.length} utilisateur(s) enregistré(s)</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: "#1B4F8A" }}>
          <UserPlus size={15} /> Ajouter Utilisateur
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-800">Nouvel Utilisateur</p>
            <button onClick={() => setShowForm(false)}><X size={16} className="text-gray-400" /></button>
          </div>
          <form onSubmit={createUser} className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Prénom *</label>
              <input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} className={input} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nom *</label>
              <input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} className={input} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={input} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Mot de passe *</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className={cn(input, "pr-9")} required minLength={8} />
                <button type="button" onClick={() => setShowPassword(v => !v)} tabIndex={-1} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Rôle *</label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className={input}>
                <option value="medecin">Médecin Déclarant</option>
                <option value="epidemiologiste">Épidémiologiste</option>
                <option value="admin">Administrateur</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Établissement</label>
              <select value={form.etablissementId} onChange={e => setForm(f => ({ ...f, etablissementId: e.target.value }))} className={input}>
                <option value="">Sélectionner...</option>
                {etablissements.map(e => <option key={e.id} value={e.id}>{e.nom}</option>)}
              </select>
            </div>
            {error && <p className="col-span-3 text-xs text-red-500">{error}</p>}
            <div className="col-span-3 flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600">Annuler</button>
              <button type="submit" disabled={submitting} className="px-4 py-2 rounded-lg text-sm text-white font-medium disabled:opacity-60" style={{ backgroundColor: "#27AE60" }}>
                {submitting ? "Création..." : "Créer l'Utilisateur"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="h-9 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#1B4F8A] flex-1 max-w-xs" />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="h-9 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#1B4F8A]">
          <option value="">Tous les rôles</option>
          <option value="medecin">Médecin</option>
          <option value="epidemiologiste">Épidémiologiste</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: "#F5F6F7" }}>
              {["Utilisateur", "Rôle", "Établissement", "Statut", "Créé le", "Actions"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!filtered.length ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">Aucun utilisateur</td></tr>
            ) : filtered.map((u, i) => {
              const rc = ROLE_COLORS[u.role] ?? ROLE_COLORS.medecin
              return (
                <tr key={u.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"} style={{ borderBottom: "1px solid #EBEDEF" }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium" style={{ backgroundColor: "#1B4F8A" }}>
                        {u.firstName[0]}{u.lastName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{u.firstName} {u.lastName}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ color: rc.color, backgroundColor: rc.bg }}>
                      {ROLE_LABELS[u.role] ?? u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{u.etablissement?.nom ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium" style={{ color: u.isActive ? "#047857" : "#B91C1C" }}>
                      {u.isActive ? "● Actif" : "● Inactif"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => toggleActive(u.id, u.isActive)} title={u.isActive ? "Désactiver" : "Activer"} className="p-1.5 rounded hover:bg-gray-100 transition-colors">
                        <Power size={14} style={{ color: u.isActive ? "#E74C3C" : "#27AE60" }} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
