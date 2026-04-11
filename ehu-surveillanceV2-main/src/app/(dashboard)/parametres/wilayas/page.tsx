import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function WilayasPage() {
  const session = await auth()
  if (session?.user.role !== "admin") redirect("/dashboard")

  const wilayas = await prisma.wilaya.findMany({
    orderBy: { code: "asc" },
    include: { _count: { select: { communes: true, etablissements: true } } },
  })

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/parametres" className="text-sm text-gray-400 hover:text-gray-600">← Paramètres</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-semibold text-gray-800">Wilayas &amp; Communes</h1>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-500">{wilayas.length} wilayas d&apos;Algérie</p>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: "600px" }}>
          <table className="w-full">
            <thead className="sticky top-0" style={{ backgroundColor: "#F5F6F7" }}>
              <tr>
                {["Code", "Wilaya", "Communes", "Établissements"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {wilayas.map((w, i) => (
                <tr key={w.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"} style={{ borderBottom: "1px solid #EBEDEF" }}>
                  <td className="px-4 py-3 text-sm font-mono font-medium" style={{ color: "#1B4F8A" }}>{w.code}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">{w.nom}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{w._count.communes}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{w._count.etablissements}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
