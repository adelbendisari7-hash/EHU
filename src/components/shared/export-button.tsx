"use client"

import { useState } from "react"
import { Download, FileSpreadsheet, Loader2 } from "lucide-react"
import { exportCasExcel } from "@/utils/export-excel"

interface Props {
  format?: "csv" | "excel"
  type?: string
  days?: number
  label?: string
}

export default function ExportButton({ format = "csv", type = "cas", days = 30, label }: Props) {
  const [loading, setLoading] = useState(false)

  const defaultLabel = format === "excel" ? "Excel" : "CSV"

  const handleExport = async () => {
    setLoading(true)
    try {
      if (format === "excel") {
        const res = await fetch(`/api/export?format=json&type=${type}&days=${days}`)
        const rows = await res.json()
        await exportCasExcel(rows)
      } else {
        const res = await fetch(`/api/export?format=csv&type=${type}&days=${days}`)
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `export-${type}-${new Date().toISOString().slice(0, 10)}.csv`
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } finally {
      setLoading(false)
    }
  }

  const Icon = loading ? Loader2 : format === "excel" ? FileSpreadsheet : Download

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="btn btn-secondary btn-sm"
    >
      <Icon size={13} className={loading ? "animate-spin" : format === "excel" ? "text-green-600" : ""} />
      {label ?? defaultLabel}
    </button>
  )
}
