"use client"

import {
  UseFormRegister, UseFormWatch, UseFormSetValue,
  UseFormGetValues, UseFormReset, FieldErrors, Control,
} from "react-hook-form"
import FicheTiac from "@/components/declarations/fiches-specifiques/fiche-tiac"
import FicheMeningite from "@/components/declarations/fiches-specifiques/fiche-meningite"
import FicheDiphterie from "@/components/declarations/fiches-specifiques/fiche-diphterie"
import FichePfa from "@/components/declarations/fiches-specifiques/fiche-pfa"

interface Props {
  slug: string | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: UseFormRegister<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  watch: UseFormWatch<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setValue: UseFormSetValue<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getValues: UseFormGetValues<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reset: UseFormReset<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errors: FieldErrors
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control?: Control<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ficheData?: Record<string, any> | null
}

const FICHE_LABELS: Record<string, string> = {
  tiac: "TIAC — Toxi-Infection Alimentaire Collective",
  meningite: "Méningite bactérienne",
  diphterie: "Diphtérie",
  pfa: "PFA — Paralysie Flasque Aiguë",
}

export default function FicheDynamiqueRenderer({
  slug, register, watch, setValue, errors, control, ficheData,
}: Props) {
  if (!slug) return null

  const label = FICHE_LABELS[slug]
  if (!label) return null

  return (
    <div className="bg-white rounded-xl border-2 border-[#1B4F8A]/20 shadow-sm overflow-hidden">
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

      <div className="p-5">
        {slug === "tiac" && (
          <FicheTiac register={register} watch={watch} setValue={setValue} errors={errors} initialData={ficheData} />
        )}
        {slug === "meningite" && (
          <FicheMeningite register={register} watch={watch} setValue={setValue} errors={errors} control={control} initialData={ficheData} />
        )}
        {slug === "diphterie" && (
          <FicheDiphterie register={register} watch={watch} setValue={setValue} errors={errors} control={control} initialData={ficheData} />
        )}
        {slug === "pfa" && (
          <FichePfa register={register} watch={watch} setValue={setValue} errors={errors} initialData={ficheData} />
        )}
      </div>
    </div>
  )
}
