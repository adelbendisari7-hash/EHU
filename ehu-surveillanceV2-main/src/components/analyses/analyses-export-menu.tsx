"use client"

import { useState, useRef, useEffect } from "react"
import { Download, FileText, FileSpreadsheet, ChevronDown } from "lucide-react"
import { exportAnalysesPdf, type AnalyticsPdfData } from "@/utils/export-pdf"
import { exportAnalysesExcel, type AnalyticsExcelData } from "@/utils/export-excel"

interface AnalyticsData {
  summary: { total: number; confirmes: number; tauxConfirmation: number; maladiesActives: number }
  prevalence: { name: string; count: number }[]
  weeklyTrend: { date: string; count: number }[]
  ageDistribution: { name: string; count: number }[]
  sexDistribution: { name: string; count: number }[]
  statutDistribution: { name: string; count: number }[]
}

interface Props {
  data: AnalyticsData
  days: number
}

export default function AnalysesExportMenu({ data, days }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState<"pdf" | "excel" | "csv" | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const period = `${days} derniers jours`

  const handlePdf = async () => {
    setLoading("pdf")
    setOpen(false)
    try {
      await exportAnalysesPdf({ ...data, period } as AnalyticsPdfData)
    } finally {
      setLoading(null)
    }
  }

  const handleExcel = async () => {
    setLoading("excel")
    setOpen(false)
    try {
      await exportAnalysesExcel({ ...data, period } as AnalyticsExcelData)
    } finally {
      setLoading(null)
    }
  }

  const handleCsv = async () => {
    setLoading("csv")
    setOpen(false)
    try {
      const res = await fetch(`/api/export?format=csv&type=cas&days=${days}`)
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `cas-declares-ehu-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } finally {
      setLoading(null)
    }
  }

  const isLoading = loading !== null

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(v => !v)}
        disabled={isLoading}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-60"
      >
        <Download size={15} />
        {isLoading ? "Export..." : "Exporter"}
        <ChevronDown size={13} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl border border-gray-100 shadow-lg z-50 py-1 overflow-hidden">
          <button
            onClick={handlePdf}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <FileText size={15} className="text-red-500" />
            Rapport PDF
          </button>
          <button
            onClick={handleExcel}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <FileSpreadsheet size={15} className="text-green-600" />
            Excel (multi-feuilles)
          </button>
          <div className="h-px bg-gray-100 my-1" />
          <button
            onClick={handleCsv}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Download size={15} className="text-gray-400" />
            CSV brut
          </button>
        </div>
      )}
    </div>
  )
}
