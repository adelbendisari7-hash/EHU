"use client"

import { useState } from "react"

export type ConfidenceLevel = "high" | "medium" | "low" | "none"

export interface OcrField {
  value: string | null
  confidence: ConfidenceLevel
  raw?: string | null
  source?: string | null
}

export interface OcrResult {
  patient: {
    nom: OcrField
    prenom: OcrField
    date_naissance: OcrField
    sexe: OcrField
    adresse: OcrField
    commune: OcrField
    commune_id: OcrField
    wilaya: OcrField
    telephone: OcrField
  }
  maladie: {
    nom_maladie: OcrField
    maladie_id: OcrField
    date_debut_symptomes: OcrField
    date_diagnostic: OcrField
    mode_confirmation: OcrField
  }
  medical: {
    etablissement: OcrField
    etablissement_id: OcrField
    service: OcrField
    medecin: OcrField
  }
}

export interface OcrMeta {
  overall_quality: "good" | "medium" | "poor"
  fields_extracted: number
  fields_total: number
  fields_uncertain: number
  processing_time_ms: number
  engines_used: {
    primary: string
    fallback_used: boolean
    fallback_replacements: number
  }
}

export interface OcrScanResult {
  success: boolean
  data: OcrResult
  meta: OcrMeta
}

async function compressImage(file: File, maxPx = 2048, quality = 0.85): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const { naturalWidth: w, naturalHeight: h } = img
      const scale = Math.min(1, maxPx / Math.max(w, h))
      const canvas = document.createElement("canvas")
      canvas.width = Math.round(w * scale)
      canvas.height = Math.round(h * scale)
      const ctx = canvas.getContext("2d")!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" }))
          } else {
            resolve(file)
          }
        },
        "image/jpeg",
        quality
      )
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
    img.src = url
  })
}

export function useOcrScan() {
  const [isScanning, setIsScanning] = useState(false)
  const [progress, setProgress] = useState("")
  const [result, setResult] = useState<OcrScanResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  async function scanImage(file: File): Promise<OcrScanResult | null> {
    setIsScanning(true)
    setError(null)
    setResult(null)

    // Créer une URL de preview
    const preview = URL.createObjectURL(file)
    setPreviewUrl(preview)

    try {
      setProgress("Compression de l'image...")
      const compressed = await compressImage(file, 2048, 0.85)

      setProgress("Envoi au service OCR...")
      const formData = new FormData()
      formData.append("image", compressed)
      formData.append("language_hint", "fr")

      setProgress("Extraction du texte en cours...")
      const res = await fetch("/api/ocr/extract", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error ?? "Erreur OCR")
      }

      const data: OcrScanResult = await res.json()
      setResult(data)
      return data
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue"
      setError(msg)
      return null
    } finally {
      setIsScanning(false)
      setProgress("")
    }
  }

  function reset() {
    setResult(null)
    setError(null)
    setProgress("")
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }

  return { scanImage, isScanning, progress, result, error, previewUrl, reset }
}
