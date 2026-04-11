"use client"

import { useRef, useState } from "react"
import { Camera, Upload, X, CheckCircle, AlertCircle, Clock, Scan, ChevronRight } from "lucide-react"
import { useOcrScan, OcrField, OcrScanResult } from "@/hooks/use-ocr-scan"
import { toast } from "sonner"

interface OcrScannerProps {
  onApply: (data: OcrScanResult["data"]) => void
  onClose: () => void
}

function ConfidenceDot({ level }: { level: OcrField["confidence"] }) {
  if (level === "high") return <span className="w-2 h-2 rounded-full bg-green-500 inline-block shrink-0" title="Haute confiance" />
  if (level === "medium") return <span className="w-2 h-2 rounded-full bg-amber-400 inline-block shrink-0" title="Confiance moyenne" />
  if (level === "low") return <span className="w-2 h-2 rounded-full bg-red-400 inline-block shrink-0" title="Faible confiance — vérifier" />
  return null
}

function FieldRow({ label, field }: { label: string; field: OcrField }) {
  if (!field.value) return null
  const bg = field.confidence === "high" ? "#F0FDF4" : field.confidence === "medium" ? "#FFFBEB" : "#FEF2F2"
  const border = field.confidence === "high" ? "#BBF7D0" : field.confidence === "medium" ? "#FDE68A" : "#FECACA"
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs" style={{ backgroundColor: bg, border: `1px solid ${border}` }}>
      <ConfidenceDot level={field.confidence} />
      <span className="text-gray-500 shrink-0">{label} :</span>
      <span className="font-medium text-gray-800 truncate">{field.value}</span>
    </div>
  )
}

export default function OcrScanner({ onApply, onClose }: OcrScannerProps) {
  const { scanImage, isScanning, progress, result, error, previewUrl, reset } = useOcrScan()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<"upload" | "review">("upload")

  const handleFile = async (file: File) => {
    const scanResult = await scanImage(file)
    if (scanResult) {
      setStep("review")
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleApply = () => {
    if (!result) return
    onApply(result.data)
    const extracted = result.meta.fields_extracted
    toast.success(`${extracted} champ(s) pré-rempli(s) depuis le scan`)
    onClose()
  }

  const handleReset = () => {
    reset()
    setStep("upload")
  }

  const qualityColor = result?.meta.overall_quality === "good"
    ? "#059669" : result?.meta.overall_quality === "medium"
    ? "#D97706" : "#DC2626"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100" style={{ backgroundColor: "#1B4F8A" }}>
          <div className="flex items-center gap-2">
            <Scan size={18} className="text-white" />
            <h2 className="text-white font-semibold text-sm">Scanner un Formulaire MDO</h2>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          {/* ÉTAPE 1 — Upload */}
          {step === "upload" && (
            <div>
              {!isScanning && !previewUrl && (
                <div>
                  <p className="text-sm text-gray-500 mb-4 text-center">
                    Prenez une photo ou importez le formulaire papier MDO.<br />
                    Les champs seront pré-remplis automatiquement.
                  </p>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {/* Caméra */}
                    <button
                      onClick={() => cameraInputRef.current?.click()}
                      className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-dashed border-gray-200 hover:border-[#1B4F8A] hover:bg-blue-50 transition-all"
                    >
                      <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: "#EEF4FF" }}>
                        <Camera size={22} style={{ color: "#1B4F8A" }} />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-700">Prendre une photo</p>
                        <p className="text-xs text-gray-400 mt-0.5">Caméra du téléphone</p>
                      </div>
                    </button>

                    {/* Galerie / fichier */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-dashed border-gray-200 hover:border-[#1B4F8A] hover:bg-blue-50 transition-all"
                    >
                      <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: "#EEF4FF" }}>
                        <Upload size={22} style={{ color: "#1B4F8A" }} />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-700">Importer un fichier</p>
                        <p className="text-xs text-gray-400 mt-0.5">JPEG, PNG, WebP</p>
                      </div>
                    </button>
                  </div>

                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleInputChange} />
                  <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleInputChange} />

                  <div className="flex items-center gap-2 mt-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                    <AlertCircle size={14} className="text-gray-400 shrink-0" />
                    <p className="text-xs text-gray-400">
                      Assurez-vous que le formulaire est bien éclairé et que le texte est lisible.
                      L&apos;option &quot;Remplir manuellement&quot; reste toujours disponible.
                    </p>
                  </div>
                </div>
              )}

              {/* Loading */}
              {isScanning && (
                <div className="py-10 text-center">
                  {previewUrl && (
                    <div className="w-40 h-40 mx-auto mb-4 rounded-xl overflow-hidden border border-gray-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={previewUrl} alt="Scan" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <div className="w-5 h-5 border-2 border-[#1B4F8A] border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm font-medium text-gray-700">Analyse en cours...</span>
                  </div>
                  <p className="text-xs text-gray-400">{progress}</p>
                </div>
              )}

              {/* Erreur */}
              {error && !isScanning && (
                <div className="py-6 text-center">
                  <AlertCircle size={36} className="text-red-400 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-700 mb-1">Extraction échouée</p>
                  <p className="text-xs text-red-500 mb-4">{error}</p>
                  <button onClick={handleReset} className="px-4 py-2 rounded-lg text-sm border border-gray-200 hover:bg-gray-50 text-gray-600">
                    Réessayer
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ÉTAPE 2 — Review */}
          {step === "review" && result && (
            <div>
              {/* Qualité globale */}
              <div className="flex items-center justify-between mb-4 p-3 rounded-xl border" style={{ borderColor: qualityColor + "40", backgroundColor: qualityColor + "08" }}>
                <div className="flex items-center gap-2">
                  {result.meta.overall_quality === "good"
                    ? <CheckCircle size={16} style={{ color: qualityColor }} />
                    : result.meta.overall_quality === "medium"
                    ? <Clock size={16} style={{ color: qualityColor }} />
                    : <AlertCircle size={16} style={{ color: qualityColor }} />
                  }
                  <span className="text-sm font-medium" style={{ color: qualityColor }}>
                    {result.meta.overall_quality === "good" ? "Bonne extraction"
                      : result.meta.overall_quality === "medium" ? "Extraction partielle"
                      : "Extraction faible"}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>{result.meta.fields_extracted}/{result.meta.fields_total} champs</span>
                  <span>{result.meta.processing_time_ms}ms</span>
                  {previewUrl && (
                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={previewUrl} alt="Scan" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              {/* Légende */}
              <div className="flex items-center gap-3 mb-3 text-xs text-gray-400">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Confiance haute</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Confiance moyenne</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> À vérifier</span>
              </div>

              {/* Champs extraits */}
              <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Patient</p>
                <FieldRow label="Nom" field={result.data.patient.nom} />
                <FieldRow label="Prénom" field={result.data.patient.prenom} />
                <FieldRow label="Date naissance" field={result.data.patient.date_naissance} />
                <FieldRow label="Sexe" field={result.data.patient.sexe} />
                <FieldRow label="Adresse" field={result.data.patient.adresse} />
                <FieldRow label="Commune" field={result.data.patient.commune} />
                <FieldRow label="Téléphone" field={result.data.patient.telephone} />

                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-3 mb-2">Maladie</p>
                <FieldRow label="Maladie" field={result.data.maladie.nom_maladie} />
                <FieldRow label="Début symptômes" field={result.data.maladie.date_debut_symptomes} />
                <FieldRow label="Date diagnostic" field={result.data.maladie.date_diagnostic} />
                <FieldRow label="Mode confirmation" field={result.data.maladie.mode_confirmation} />

                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-3 mb-2">Médical</p>
                <FieldRow label="Établissement" field={result.data.medical.etablissement} />
                <FieldRow label="Service" field={result.data.medical.service} />
                <FieldRow label="Médecin" field={result.data.medical.medecin} />
              </div>

              {result.meta.fields_uncertain > 0 && (
                <p className="text-xs text-amber-600 mt-3 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {result.meta.fields_uncertain} champ(s) à vérifier manuellement après import
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
          <button onClick={step === "review" ? handleReset : onClose} className="px-4 py-2 rounded-lg text-sm border border-gray-200 bg-white hover:bg-gray-50 text-gray-600">
            {step === "review" ? "Recommencer" : "Remplir manuellement"}
          </button>
          {step === "review" && result && (
            <button
              onClick={handleApply}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium text-white transition-colors"
              style={{ backgroundColor: "#1B4F8A" }}
            >
              Appliquer les champs
              <ChevronRight size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
