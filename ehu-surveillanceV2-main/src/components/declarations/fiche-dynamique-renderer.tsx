"use client"

import dynamic from "next/dynamic"
import { UseFormRegister, UseFormWatch, UseFormSetValue, FieldErrors, Control } from "react-hook-form"

// Lazy-load each fiche to keep initial bundle small
const FicheTiac = dynamic(
  () => import("@/components/declarations/fiches-specifiques/fiche-tiac"),
  { ssr: false }
)
const FicheMeningite = dynamic(
  () => import("@/components/declarations/fiches-specifiques/fiche-meningite"),
  { ssr: false }
)
const FicheDiphterie = dynamic(
  () => import("@/components/declarations/fiches-specifiques/fiche-diphterie"),
  { ssr: false }
)
const FichePfa = dynamic(
  () => import("@/components/declarations/fiches-specifiques/fiche-pfa"),
  { ssr: false }
)

interface Props {
  slug: string | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: UseFormRegister<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  watch: UseFormWatch<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setValue: UseFormSetValue<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errors: FieldErrors
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control?: Control<any>
}

const FICHE_LABELS: Record<string, string> = {
  tiac: "TIAC — Toxi-Infection Alimentaire Collective",
  meningite: "Méningite bactérienne",
  diphterie: "Diphtérie",
  pfa: "PFA — Paralysie Flasque Aiguë",
}

export default function FicheDynamiqueRenderer({ slug, register, watch, setValue, errors, control }: Props) {
  if (!slug) return null

  const label = FICHE_LABELS[slug]
  if (!label) return null

  return (
    <div className="bg-white rounded-xl border-2 border-[#1B4F8A]/20 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 bg-[#1B4F8A]/5 border-b border-[#1B4F8A]/20">
        <div
          className="flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-bold"
          style={{ backgroundColor: "#1B4F8A" }}
        >
          4
        </div>
        <div>
          <p className="text-xs text-[#1B4F8A]/70 font-medium uppercase tracking-wide">Fiche spécifique</p>
          <h3 className="text-sm font-semibold text-[#1B4F8A]">{label}</h3>
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        {slug === "tiac" && (
          <FicheTiac register={register} watch={watch} errors={errors} />
        )}
        {slug === "meningite" && (
          <FicheMeningite register={register} watch={watch} errors={errors} />
        )}
        {slug === "diphterie" && (
          <FicheDiphterie register={register} watch={watch} setValue={setValue} errors={errors} control={control} />
        )}
        {slug === "pfa" && (
          <FichePfa register={register} watch={watch} errors={errors} />
        )}
      </div>
    </div>
  )
}
