import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { formatDate } from "@/utils/format-date"

export default async function InvestigationsPage() {
  const session = await auth()
  if (!["epidemiologiste", "admin"].includes(session?.user.role ?? "")) {
    redirect("/dashboard")
  }

  const investigations = await prisma.investigation.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      cas: { include: { patient: true, maladie: true, commune: true } },
      epidemiologiste: { select: { firstName: true, lastName: true } },
      contacts: true,
    },
  })

  const STATUT_STYLE: Record<string, { label: string; color: string; bg: string }> = {
    en_cours: { label: "En cours", color: "#B45309", bg: "#FFFBEB" },
    terminee: { label: "Terminée", color: "#047857", bg: "#ECFDF5" },
    en_attente: { label: "En attente", color: "#4A5164", bg: "#F5F6F7" },
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Investigations</h1>
        <p className="text-sm text-gray-500 mt-1">{investigations.length} investigation(s) enregistrée(s)</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: "#F5F6F7" }}>
              {["Cas / Patient", "Maladie", "Commune", "Contacts", "Début", "Statut", "Actions"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!investigations.length ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">Aucune investigation</td></tr>
            ) : investigations.map((inv, i) => {
              const s = STATUT_STYLE[inv.statut] ?? STATUT_STYLE.en_attente
              return (
                <tr key={inv.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"} style={{ borderBottom: "1px solid #EBEDEF" }}>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-800">{inv.cas.patient.firstName} {inv.cas.patient.lastName}</p>
                    <p className="text-xs text-gray-400">{inv.cas.codeCas}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{inv.cas.maladie.nom}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{inv.cas.commune?.nom ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{inv.contacts.length}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDate(inv.dateDebut)}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ color: s.color, backgroundColor: s.bg }}>{s.label}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/declarations/${inv.casId}/investigation`} className="text-xs text-blue-500 hover:underline">Voir →</Link>
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
