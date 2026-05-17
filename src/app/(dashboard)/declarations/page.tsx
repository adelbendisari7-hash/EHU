import { auth } from "@/lib/auth"
import Link from "next/link"
import { Plus } from "lucide-react"
import CasListTable from "@/components/declarations/cas-list-table"
import ExportButton from "@/components/shared/export-button"

export default async function DeclarationsPage() {
  const session = await auth()
  const userRole = session?.user.role ?? "medecin"
  const canExport = ["epidemiologiste", "admin"].includes(userRole)

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title">Cas Déclarés</h1>
          <p className="page-subtitle">Gestion des déclarations de cas épidémiologiques</p>
        </div>
        <div className="flex items-center gap-2">
          {canExport && (
            <>
              <ExportButton format="excel" type="cas" days={90} label="Excel" />
              <ExportButton format="csv" type="cas" days={90} label="CSV" />
            </>
          )}
          {["medecin", "epidemiologiste", "admin"].includes(userRole) && (
            <Link href="/declarations/new" className="btn btn-primary">
              <Plus size={15} />
              Nouvelle Déclaration
            </Link>
          )}
        </div>
      </div>
      <CasListTable userRole={userRole} />
    </div>
  )
}
