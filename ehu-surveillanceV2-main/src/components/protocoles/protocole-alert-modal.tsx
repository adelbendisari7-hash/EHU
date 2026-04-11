"use client"

import { useState } from "react"
import { AlertTriangle, Download, CheckSquare, Square, X } from "lucide-react"

interface Action {
  action: string
  detail?: string
  obligatoire?: boolean
}

interface Section {
  titre: string
  priorite?: string
  actions: Action[]
}

interface JsonContent {
  sections?: Section[]
}

interface Protocole {
  id: string
  titre: string
  conduiteMedicale: JsonContent
  actionsAdministratives: JsonContent
  investigationSteps: JsonContent
  maladie?: { nom: string }
}

interface Declenchement {
  id: string
  nombreCasActuel: number
  seuil: { seuilNombre: number; gravite: string; periodejours: number }
  commune?: { nom: string }
  protocole: Protocole
}

interface Props {
  declenchement: Declenchement
  maladieName: string
  onClose: () => void
}

const GRAVITE_COLORS: Record<string, string> = {
  critique: "#E74C3C",
  urgent: "#E67E22",
  attention: "#F39C12",
}

function ActionList({ content, label, icon }: { content: JsonContent; label: string; icon: string }) {
  const [checked, setChecked] = useState<Record<number, boolean>>({})
  const allActions = content?.sections?.flatMap(s => s.actions) ?? []

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2 px-3 py-1.5 rounded-full w-fit" style={{ backgroundColor: "#E8F0FE" }}>
        <span className="text-sm">{icon}</span>
        <span className="text-xs font-bold" style={{ color: "#1B4F8A" }}>{label}</span>
      </div>
      <ul className="space-y-1.5 pl-1">
        {allActions.map((a, i) => (
          <li key={i} className="flex items-start gap-2 cursor-pointer group" onClick={() => setChecked(p => ({ ...p, [i]: !p[i] }))}>
            <span className="mt-0.5 shrink-0" style={{ color: checked[i] ? "#27AE60" : "#9CA3AF" }}>
              {checked[i] ? <CheckSquare size={15} /> : <Square size={15} />}
            </span>
            <div className={`text-sm transition-colors ${checked[i] ? "line-through text-gray-400" : "text-gray-700"}`}>
              <span className="font-medium">{a.action}</span>
              {a.detail && <span className="text-gray-500 text-xs block">{a.detail}</span>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function ProtocoleAlertModal({ declenchement, maladieName, onClose }: Props) {
  const [downloadLoading, setDownloadLoading] = useState(false)
  const graviteColor = GRAVITE_COLORS[declenchement.seuil.gravite] ?? "#E74C3C"
  const { protocole } = declenchement

  const handleDownloadPdf = async () => {
    setDownloadLoading(true)
    try {
      // Mark PDF as downloaded
      await fetch(`/api/declenchements/${declenchement.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfTelecharge: true }),
      })

      // Generate protocol PDF
      const { default: jsPDF } = await import("jspdf")
      const { default: autoTable } = await import("jspdf-autotable")
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
      const EHU_BLUE: [number, number, number] = [27, 79, 138]

      doc.setFillColor(...EHU_BLUE)
      doc.rect(0, 0, 210, 30, "F")
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(255, 255, 255)
      doc.text(protocole.titre, 105, 14, { align: "center" })
      doc.setFontSize(9)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(200, 215, 235)
      doc.text(`EHU Oran — Surveillance Épidémiologique`, 105, 22, { align: "center" })

      let y = 38
      const sections: { label: string; content: JsonContent }[] = [
        { label: "Conduite Médicale", content: protocole.conduiteMedicale },
        { label: "Actions Administratives", content: protocole.actionsAdministratives },
        { label: "Investigation Épidémiologique", content: protocole.investigationSteps },
      ]

      for (const sec of sections) {
        if (y > 250) { doc.addPage(); y = 20 }
        doc.setFontSize(10)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(...EHU_BLUE)
        doc.text(sec.label.toUpperCase(), 10, y)
        y += 5
        const actions = sec.content?.sections?.flatMap(s => s.actions) ?? []
        autoTable(doc, {
          startY: y,
          body: actions.map(a => [a.action, a.detail ?? ""]),
          columnStyles: {
            0: { cellWidth: 80, fontStyle: "bold", fontSize: 8 },
            1: { cellWidth: 110, fontSize: 8, textColor: [80, 80, 80] as [number, number, number] },
          },
          styles: { cellPadding: 3, lineColor: [230, 230, 230] as [number, number, number], lineWidth: 0.3 },
          alternateRowStyles: { fillColor: [248, 249, 250] as [number, number, number] },
          margin: { left: 10, right: 10 },
        })
        y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8
      }

      doc.save(`protocole-${maladieName.replace(/\s/g, "-").toLowerCase()}.pdf`)
    } finally {
      setDownloadLoading(false)
    }
  }

  const handleClose = async () => {
    await fetch(`/api/declenchements/${declenchement.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vuParMedecin: true }),
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.55)" }}>
      <div className="w-full max-w-[680px] max-h-[85vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-5 shrink-0" style={{ backgroundColor: graviteColor }}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle size={24} color="white" />
              <div>
                <h2 className="text-white font-bold text-lg">Seuil d&apos;Alerte Dépassé</h2>
                <p className="text-white/80 text-sm mt-0.5">
                  {declenchement.nombreCasActuel} cas de {maladieName}
                  {declenchement.commune ? ` à ${declenchement.commune.nom}` : ""} en {declenchement.seuil.periodejours} jours (seuil: {declenchement.seuil.seuilNombre})
                </p>
              </div>
            </div>
            <span className="text-white/60 text-xs uppercase font-semibold px-2 py-1 rounded border border-white/30">
              {declenchement.seuil.gravite}
            </span>
          </div>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto bg-white p-6">
          <ActionList content={protocole.conduiteMedicale} label="Conduite Médicale" icon="🏥" />
          <ActionList content={protocole.actionsAdministratives} label="Actions Administratives" icon="📋" />
          <ActionList content={protocole.investigationSteps} label="Investigation Épidémiologique" icon="🔍" />
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-gray-100 p-4 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-gray-400">
              Notification envoyée aux épidémiologistes
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDownloadPdf}
                disabled={downloadLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-60 transition-colors"
                style={{ backgroundColor: "#1B4F8A" }}
              >
                <Download size={15} />
                {downloadLoading ? "Génération..." : `Télécharger Protocole PDF`}
              </button>
              <button
                onClick={handleClose}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <X size={15} />
                J&apos;ai pris connaissance
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
