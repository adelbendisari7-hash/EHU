"use client"
import { useEffect } from "react"
import type { UseFormSetValue } from "react-hook-form"

/**
 * Auto-remplit les champs d'une fiche spécifique au montage du composant.
 * S'exécute une seule fois après que tous les champs sont dans le DOM.
 * Gère : selects, checkboxes, inputs texte, DateInput (watch-based), et objets imbriqués.
 */
export function useFicheInit(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData: Record<string, any> | null | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setValue: UseFormSetValue<any> | undefined
) {
  useEffect(() => {
    if (!initialData || !setValue) return

    const setAll = (obj: Record<string, unknown>, prefix: string) => {
      for (const [k, v] of Object.entries(obj)) {
        const path = `${prefix}.${k}`
        if (v !== null && v !== undefined && typeof v === "object" && !Array.isArray(v)) {
          // Objet imbriqué (ex: signesClinicaux, formesCliniques) : descendre récursivement
          setAll(v as Record<string, unknown>, path)
        } else {
          // Valeur primitive ou array : setValue direct
          setValue(path, v, { shouldDirty: false, shouldValidate: false })
        }
      }
    }

    setAll(initialData, "fiche")
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // [] = une seule fois au montage, quand tous les champs sont dans le DOM
}
