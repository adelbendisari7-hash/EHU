import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function EtablissementsPage() {
  const session = await auth()
  if (session?.user.role !== "admin") redirect("/dashboard")

  const etablissements = await prisma.etablissement.findMany({
    orderBy: { nom: "asc" },
    include: { wilaya: { select: { nom: true } }, commune: { select: { nom: true } } },
  })

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/parametres" className="text-sm text-gray-400 hover:text-gray-600">← Paramètres</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-semibold text-gray-800">Établissements de Santé</h1>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: "#F5F6F7" }}>
              {["Nom", "Type", "Commune", "Wilaya"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!etablissements.length ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-400">Aucun établissement</td></tr>
            ) : etablissements.map((e, i) => (
              <tr key={e.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"} style={{ borderBottom: "1px solid #EBEDEF" }}>
                <td className="px-4 py-3 text-sm font-medium text-gray-800">{e.nom}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{e.type}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{e.commune?.nom ?? "—"}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{e.wilaya?.nom ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
