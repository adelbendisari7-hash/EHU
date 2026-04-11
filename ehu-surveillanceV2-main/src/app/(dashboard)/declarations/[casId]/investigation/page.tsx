"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import dynamic from "next/dynamic"
import ContactTracingForm from "@/components/investigations/contact-tracing-form"
import ContactList from "@/components/investigations/contact-list"
import MesuresControle from "@/components/investigations/mesures-controle"
import InvestigationConclusion from "@/components/investigations/investigation-conclusion"
import { formatDate } from "@/utils/format-date"

const EpidemicMap = dynamic(() => import("@/components/maps/epidemic-map"), { ssr: false, loading: () => <div className="h-full flex items-center justify-center bg-gray-50 rounded-xl text-sm text-gray-400">Chargement...</div> })

interface Investigation {
  id: string
  statut: string
  dateDebut: string
  dateFin: string | null
  conclusion: string | null
  mesuresControle: string[] | null
  contacts: Array<{ id: string; nom: string; telephone: string; relation: string | null; statutSuivi: string; notes: string | null }>
  cas: {
    id: string
    codeCas: string
    statut: string
    patient: { firstName: string; lastName: string }
    maladie: { nom: string }
    commune: { nom: string; latitude: string | null; longitude: string | null } | null
  }
  epidemiologiste: { firstName: string; lastName: string } | null
}

export default function InvestigationPage() {
  const params = useParams()
  const casId = params.casId as string
  const [investigation, setInvestigation] = useState<Investigation | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  const fetchInvestigation = useCallback(async () => {
    // First check if investigation exists for this case
    const casRes = await fetch(`/api/cas/${casId}`)
    const cas = await casRes.json()
    if (cas.investigation) {
      const res = await fetch(`/api/investigations/${cas.investigation.id}`)
      const data = await res.json()
      setInvestigation(data)
    } else {
      setInvestigation(null)
    }
    setLoading(false)
  }, [casId])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void fetchInvestigation() }, [fetchInvestigation])

  const startInvestigation = async () => {
    setCreating(true)
    await fetch("/api/investigations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ casId }),
    })
    setCreating(false)
    fetchInvestigation()
  }

  const closeInvestigation = async () => {
    if (!investigation) return
    await fetch(`/api/investigations/${investigation.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut: "terminee" }),
    })
    fetchInvestigation()
  }

  const mapMarkers = investigation?.cas.commune?.latitude && investigation.cas.commune.longitude
    ? [{
        id: investigation.cas.id,
        lat: Number(investigation.cas.commune.latitude),
        lng: Number(investigation.cas.commune.longitude),
        statut: investigation.cas.statut,
        maladie: investigation.cas.maladie.nom,
        commune: investigation.cas.commune.nom,
        date: investigation.dateDebut,
      }]
    : []

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Chargement...</div>

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/declarations/${casId}`} className="text-sm text-gray-400 hover:text-gray-600">← Retour au cas</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-semibold text-gray-800">Investigation Épidémiologique</h1>
      </div>

      {!investigation ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <p className="text-gray-500 mb-2">Aucune investigation lancée pour ce cas.</p>
          <p className="text-sm text-gray-400 mb-6">Vous devez être épidémiologiste pour lancer une investigation.</p>
          <button onClick={startInvestigation} disabled={creating} className="px-6 py-3 rounded-lg text-white font-medium transition-colors disabled:opacity-60" style={{ backgroundColor: "#1B4F8A" }}>
            {creating ? "Lancement..." : "Lancer l'Investigation"}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Header info */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Cas</p>
                <p className="text-sm font-semibold text-gray-800">{investigation.cas.codeCas} — {investigation.cas.patient.firstName} {investigation.cas.patient.lastName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Maladie</p>
                <p className="text-sm font-semibold text-gray-800">{investigation.cas.maladie.nom}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Début</p>
                <p className="text-sm font-semibold text-gray-800">{formatDate(investigation.dateDebut)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Statut</p>
                <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ backgroundColor: investigation.statut === "terminee" ? "#ECFDF5" : "#FFFBEB", color: investigation.statut === "terminee" ? "#047857" : "#B45309" }}>
                  {investigation.statut === "en_cours" ? "En cours" : investigation.statut === "terminee" ? "Terminée" : "En attente"}
                </span>
              </div>
            </div>
            {investigation.statut === "en_cours" && (
              <button onClick={closeInvestigation} className="px-3 py-2 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: "#27AE60" }}>
                Clôturer l&apos;Investigation
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Map */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">Localisation du Cas</p>
              <div style={{ height: "280px" }}>
                <EpidemicMap markers={mapMarkers} />
              </div>
            </div>

            {/* Mesures de contrôle */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">Mesures de Contrôle</p>
              <MesuresControle
                investigationId={investigation.id}
                initialMesures={investigation.mesuresControle ?? []}
              />
            </div>
          </div>

          {/* Contact tracing */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-gray-700">
                Traçage des Contacts ({investigation.contacts.length})
              </p>
              <ContactTracingForm
                investigationId={investigation.id}
                onAdded={fetchInvestigation}
              />
            </div>
            <ContactList
              contacts={investigation.contacts}
              investigationId={investigation.id}
              onUpdated={fetchInvestigation}
            />
          </div>

          {/* Conclusion */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">Conclusion de l&apos;Investigation</p>
            <InvestigationConclusion
              investigationId={investigation.id}
              initialConclusion={investigation.conclusion ?? ""}
              statut={investigation.statut}
            />
          </div>
        </div>
      )}
    </div>
  )
}
