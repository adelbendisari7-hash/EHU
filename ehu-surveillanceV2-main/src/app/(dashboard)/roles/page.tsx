"use client"
import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Shield, Plus, Edit2, Trash2, Users, Check } from "lucide-react"
import { toast } from "sonner"

interface Permission {
  id: string
  name: string
  slug: string
  module: string
}

interface Role {
  id: string
  name: string
  slug: string
  description?: string
  color: string
  isSystem: boolean
  userCount: number
  permissions: Permission[]
}

interface GroupedPermissions {
  [module: string]: Permission[]
}

export default function RolesPage() {
  const { hasPermission } = useAuth()
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [grouped, setGrouped] = useState<GroupedPermissions>({})
  const [loading, setLoading] = useState(true)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [editingPermissions, setEditingPermissions] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch("/api/roles").then((r) => r.json()),
      fetch("/api/permissions").then((r) => r.json()),
    ]).then(([rolesData, permsData]) => {
      setRoles(rolesData)
      setPermissions(permsData.permissions)
      setGrouped(permsData.grouped)
    }).catch(() => toast.error("Erreur de chargement")).finally(() => setLoading(false))
  }, [])

  const selectRole = (role: Role) => {
    setSelectedRole(role)
    setEditingPermissions(new Set(role.permissions.map((p) => p.id)))
  }

  const togglePermission = (permId: string) => {
    setEditingPermissions((prev) => {
      const next = new Set(prev)
      next.has(permId) ? next.delete(permId) : next.add(permId)
      return next
    })
  }

  const savePermissions = async () => {
    if (!selectedRole) return
    setSaving(true)
    try {
      await fetch(`/api/roles/${selectedRole.id}/permissions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissionIds: [...editingPermissions] }),
      })
      toast.success("Permissions mises à jour")
      // Refresh
      const updated = await fetch("/api/roles").then((r) => r.json())
      setRoles(updated)
      const updatedRole = updated.find((r: Role) => r.id === selectedRole.id)
      if (updatedRole) setSelectedRole(updatedRole)
    } catch {
      toast.error("Erreur lors de la sauvegarde")
    } finally {
      setSaving(false)
    }
  }

  if (!hasPermission("roles.manage")) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p>Vous n&apos;avez pas accès à cette page.</p>
      </div>
    )
  }

  if (loading) return <div className="p-6 text-gray-500">Chargement...</div>

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" /> Gestion des Rôles
          </h1>
          <p className="text-gray-500 text-sm mt-1">Gérez les rôles et leurs permissions</p>
        </div>
        <button className="btn btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nouveau rôle
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roles list */}
        <div className="space-y-3">
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Rôles ({roles.length})</h2>
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => selectRole(role)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                selectedRole?.id === role.id
                  ? "border-blue-300 bg-blue-50 shadow-sm"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: role.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 truncate">{role.name}</p>
                    {role.isSystem && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">système</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    <Users className="w-3 h-3 inline mr-1" />{role.userCount} utilisateurs · {role.permissions.length} permissions
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Permission matrix */}
        <div className="lg:col-span-2">
          {selectedRole ? (
            <div className="card">
              <div className="card-header flex items-center justify-between">
                <div>
                  <h2 className="card-title">Permissions — {selectedRole.name}</h2>
                  <p className="text-sm text-gray-500">{editingPermissions.size} permissions sélectionnées</p>
                </div>
                <button
                  onClick={savePermissions}
                  disabled={saving}
                  className="btn btn-primary flex items-center gap-2 text-sm"
                >
                  <Check className="w-4 h-4" />
                  {saving ? "Sauvegarde..." : "Sauvegarder"}
                </button>
              </div>
              <div className="card-body space-y-4 max-h-[60vh] overflow-y-auto">
                {Object.entries(grouped).map(([module, perms]) => (
                  <div key={module}>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 capitalize">
                      {module}
                    </h3>
                    <div className="space-y-1">
                      {perms.map((perm) => (
                        <label key={perm.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editingPermissions.has(perm.id)}
                            onChange={() => togglePermission(perm.id)}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <div className="flex-1">
                            <span className="text-sm text-gray-800">{perm.name}</span>
                            <span className="text-xs text-gray-400 ml-2 font-mono">{perm.slug}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
              <div className="text-center">
                <Shield className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Sélectionnez un rôle pour gérer ses permissions</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
