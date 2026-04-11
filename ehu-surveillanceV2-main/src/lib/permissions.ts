import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

/**
 * Get the current session's permissions and roles.
 * Call this in API route handlers.
 */
export async function getUserPermissions() {
  const session = await auth()
  if (!session) return null
  return {
    userId: session.user.id,
    role: session.user.role,
    roles: session.user.roles ?? [],
    permissions: session.user.permissions ?? [],
    etablissementId: session.user.etablissementId,
    wilayadId: session.user.wilayadId,
  }
}

/**
 * Require a specific permission. Returns a 401/403 NextResponse if denied,
 * or null if the user has the permission (meaning you can proceed).
 */
export async function requirePermission(slug: string) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }
  const perms: string[] = session.user.permissions ?? []
  if (!perms.includes(slug)) {
    return NextResponse.json({ error: "Permission refusée" }, { status: 403 })
  }
  return null // authorized
}

/**
 * Require one of the given roles (backward-compatible helper).
 */
export async function requireRole(...roles: string[]) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }
  const userRoles: string[] = session.user.roles ?? [session.user.role]
  const hasRole = roles.some((r) => userRoles.includes(r))
  if (!hasRole) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }
  return null // authorized
}
