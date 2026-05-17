"use client"

import { useState } from "react"
import { FileText, Printer } from "lucide-react"
import { exportCasPdf, printCasPdf, type CasPdfData } from "@/utils/export-pdf"

export default function CasExportPdfButton({ cas }: { cas: CasPdfData }) {
  const [loading, setLoading] = useState<"export" | "print" | null>(null)

  const handleExport = async () => {
    setLoading("export")
    try { await exportCasPdf(cas) } finally { setLoading(null) }
  }

  const handlePrint = async () => {
    setLoading("print")
    try { await printCasPdf(cas) } finally { setLoading(null) }
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handleExport}
        disabled={loading !== null}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-60"
      >
        <FileText size={15} className="text-red-500" />
        {loading === "export" ? "Génération..." : "Exporter PDF"}
      </button>
      <button
        onClick={handlePrint}
        disabled={loading !== null}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-60"
      >
        <Printer size={15} className="text-blue-500" />
        {loading === "print" ? "Préparation..." : "Imprimer"}
      </button>
    </div>
  )
}
