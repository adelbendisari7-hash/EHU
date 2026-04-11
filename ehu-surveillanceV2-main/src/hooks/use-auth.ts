"use client"
import { useSession } from "next-auth/react"

export function useAuth() {
  const { data: session, status } = useSession()
  return {
    user: session?.user ?? null,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    role: session?.user?.role ?? null,
    roles: session?.user?.roles ?? [],
    permissions: session?.user?.permissions ?? [],
    hasPermission: (slug: string) => (session?.user?.permissions ?? []).includes(slug),
    hasRole: (slug: string) => (session?.user?.roles ?? []).includes(slug),
  }
}
