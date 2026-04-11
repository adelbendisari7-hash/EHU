"use client"

import { useState } from "react"
import { FileText } from "lucide-react"
import { exportCasPdf, type CasPdfData } from "@/utils/export-pdf"

export default function CasExportPdfButton({ cas }: { cas: CasPdfData }) {
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    setLoading(true)
    try {
      await exportCasPdf(cas)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-60"
    >
      <FileText size={15} className="text-red-500" />
      {loading ? "Génération..." : "Exporter PDF"}
    </button>
  )
}
