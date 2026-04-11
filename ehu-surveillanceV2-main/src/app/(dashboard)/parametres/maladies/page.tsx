import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function MaladiesPage() {
  const session = await auth()
  if (session?.user.role !== "admin") redirect("/dashboard")

  const maladies = await prisma.maladie.findMany({ orderBy: { codeCim10: "asc" } })

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/parametres" className="text-sm text-gray-400 hover:text-gray-600">← Paramètres</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-semibold text-gray-800">Maladies à Déclaration Obligatoire</h1>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: "#F5F6F7" }}>
              {["Code CIM-10", "Nom", "Catégorie", "Seuil Alerte", "Statut"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {maladies.map((m, i) => (
              <tr key={m.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"} style={{ borderBottom: "1px solid #EBEDEF" }}>
                <td className="px-4 py-3 text-sm font-mono text-gray-600">{m.codeCim10}</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-800">{m.nom}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{m.categorie}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{m.seuilDefaut ?? 5} cas / 30j</td>
                <td className="px-4 py-3">
                  <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ color: m.isActive ? "#047857" : "#B91C1C", backgroundColor: m.isActive ? "#ECFDF5" : "#FEF2F2" }}>
                    {m.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
