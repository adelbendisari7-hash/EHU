"use client"

import Link from "next/link"
import { useState } from "react"

interface Setting { label: string; description: string; key: string }

const SETTINGS: Setting[] = [
  { key: "email_alerte_epidemique", label: "Alertes épidémiques par email", description: "Envoyer un email lors d'une alerte de type épidémique" },
  { key: "email_seuil", label: "Seuil atteint par email", description: "Envoyer un email quand un seuil MDO est dépassé" },
  { key: "email_nouveau_cas", label: "Nouveau cas par email", description: "Envoyer un email à chaque nouvelle déclaration" },
  { key: "notif_inapp_alerte", label: "Notifications in-app — Alertes", description: "Afficher une notification dans l'application pour les alertes" },
  { key: "notif_inapp_cas", label: "Notifications in-app — Cas", description: "Afficher une notification pour les nouveaux cas" },
]

export default function NotificationsSettingsPage() {
  const [settings, setSettings] = useState<Record<string, boolean>>({
    email_alerte_epidemique: true,
    email_seuil: true,
    email_nouveau_cas: false,
    notif_inapp_alerte: true,
    notif_inapp_cas: false,
  })
  const [saved, setSaved] = useState(false)

  const toggle = (key: string) => {
    setSettings(s => ({ ...s, [key]: !s[key] }))
    setSaved(false)
  }

  const save = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/parametres" className="text-sm text-gray-400 hover:text-gray-600">← Paramètres</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-semibold text-gray-800">Paramètres de Notifications</h1>
      </div>

      <div className="max-w-2xl">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
          {SETTINGS.map(s => (
            <div key={s.key} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-sm font-medium text-gray-800">{s.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.description}</p>
              </div>
              <button
                onClick={() => toggle(s.key)}
                className="relative w-10 h-6 rounded-full transition-colors shrink-0"
                style={{ backgroundColor: settings[s.key] ? "#1B4F8A" : "#D5D8DC" }}
              >
                <span
                  className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform"
                  style={{ left: settings[s.key] ? "22px" : "2px" }}
                />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={save}
            className="px-6 py-2.5 rounded-lg text-sm font-medium text-white transition-colors"
            style={{ backgroundColor: saved ? "#27AE60" : "#1B4F8A" }}
          >
            {saved ? "✓ Enregistré" : "Sauvegarder"}
          </button>
        </div>
      </div>
    </div>
  )
}
