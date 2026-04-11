import Link from "next/link"

const SETTINGS_SECTIONS = [
  { href: "/parametres/protocoles", label: "Protocoles Médicaux", desc: "Conduites médicales, actions administratives et étapes d'investigation par maladie", badge: "Nouveau" },
  { href: "/parametres/seuils", label: "Seuils d'Alerte", desc: "Configurer les seuils de déclenchement automatique par maladie et périmètre", badge: "Nouveau" },
  { href: "/parametres/maladies", label: "Maladies MDO", desc: "Gérer la liste des maladies à déclaration obligatoire" },
  { href: "/parametres/etablissements", label: "Établissements", desc: "Gérer les établissements de santé" },
  { href: "/parametres/wilayas", label: "Wilayas & Communes", desc: "Référentiel géographique" },
  { href: "/parametres/notifications", label: "Notifications", desc: "Configurer les alertes et notifications" },
]

export default function ParametresPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Paramètres</h1>
      <div className="grid grid-cols-2 gap-4">
        {SETTINGS_SECTIONS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:border-[#1B4F8A] transition-colors"
          >
            <div className="flex items-center gap-2 mb-1">
              <p className="font-medium text-gray-800">{s.label}</p>
              {"badge" in s && s.badge && (
                <span className="text-xs font-medium px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: "#27AE60" }}>{s.badge}</span>
              )}
            </div>
            <p className="text-sm text-gray-500">{s.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
