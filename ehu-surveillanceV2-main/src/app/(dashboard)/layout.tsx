import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Sidebar from "@/components/layout/sidebar"
import Topbar from "@/components/layout/topbar"
import { Toaster } from "sonner"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect("/login")

  const userName = session.user.name ?? session.user.email ?? ""
  const userRole = session.user.role ?? ""
  const permissions: string[] = session.user.permissions ?? []

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--gray-50)" }}>
      <Sidebar userName={userName} userRole={userRole} permissions={permissions} />
      <Topbar userName={userName} />
      <main className="pt-14 min-h-screen lg:ml-64">
        <div className="p-4 lg:p-6 animate-fade-in-up">{children}</div>
      </main>
      <Toaster
        position="bottom-right"
        expand={false}
        richColors
        toastOptions={{
          style: { fontFamily: "system-ui, -apple-system, sans-serif", fontSize: "14px" },
          duration: 4000,
        }}
      />
    </div>
  )
}
