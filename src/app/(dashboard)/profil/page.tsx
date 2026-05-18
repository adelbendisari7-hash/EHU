"use client"

import { useSession } from "next-auth/react"
import { useState } from "react"
import { cn } from "@/utils/cn"
import { Eye, EyeOff } from "lucide-react"

export default function ProfilPage() {
  const { data: session } = useSession()
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const user = session?.user

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.newPassword !== form.confirmPassword) {
      setMessage({ type: "error", text: "Les mots de passe ne correspondent pas" })
      return
    }
    if (form.newPassword.length < 8) {
      setMessage({ type: "error", text: "Le mot de passe doit contenir au moins 8 caractères" })
      return
    }
    setSaving(true)
    const res = await fetch(`/api/users/${user?.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: form.newPassword }),
    })
    setSaving(false)
    if (res.ok) {
      setMessage({ type: "success", text: "Mot de passe modifié avec succès" })
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
    } else {
      setMessage({ type: "error", text: "Erreur lors de la modification" })
    }
  }

  const ROLE_LABELS: Record<string, string> = {
    medecin: "Médecin Déclarant",
    epidemiologiste: "Épidémiologiste DSP",
    admin: "Administrateur",
  }

  const inputClass = "w-full h-10 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#1B4F8A] focus:ring-2 transition-all"

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Mon Profil</h1>
        <p className="text-sm text-gray-500 mt-1">Gérez vos informations personnelles</p>
      </div>

      <div className="grid grid-cols-3 gap-4 max-w-4xl">
        {/* Profile card */}
        <div className="col-span-1">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-center">
            <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-white text-2xl font-bold mb-3" style={{ backgroundColor: "#1B4F8A" }}>
              {user?.name?.charAt(0).toUpperCase() ?? "?"}
            </div>
            <p className="font-semibold text-gray-800">{user?.name}</p>
            <p className="text-xs text-gray-500 mt-1">{user?.email}</p>
            <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: "#EEF4FF", color: "#1B4F8A" }}>
              {ROLE_LABELS[user?.role ?? ""] ?? user?.role}
            </span>
          </div>
        </div>

        {/* Change password */}
        <div className="col-span-2">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">Changer le Mot de Passe</h2>
            <form onSubmit={changePassword} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nouveau mot de passe</label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={form.newPassword}
                    onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))}
                    className={cn(inputClass, "pr-10")}
                    placeholder="Minimum 8 caractères"
                    minLength={8}
                    required
                  />
                  <button type="button" onClick={() => setShowNew(v => !v)} tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Confirmer le mot de passe</label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                    className={cn(inputClass, "pr-10")}
                    placeholder="Répéter le mot de passe"
                    required
                  />
                  <button type="button" onClick={() => setShowConfirm(v => !v)} tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {message && (
                <div className={cn("p-3 rounded-lg text-sm border", message.type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700")}>
                  {message.text}
                </div>
              )}

              <button type="submit" disabled={saving} className="w-full py-2.5 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-60" style={{ backgroundColor: "#1B4F8A" }}>
                {saving ? "Modification..." : "Modifier le Mot de Passe"}
              </button>
            </form>
          </div>

          {/* Account info */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mt-4">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">Informations du Compte</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Identifiant", value: user?.id?.slice(0, 8) + "..." },
                { label: "Rôle", value: ROLE_LABELS[user?.role ?? ""] ?? "—" },
                { label: "Email", value: user?.email ?? "—" },
                { label: "Statut", value: "Actif" },
              ].map(item => (
                <div key={item.label} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{item.label}</p>
                  <p className="text-sm font-medium text-gray-800">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
