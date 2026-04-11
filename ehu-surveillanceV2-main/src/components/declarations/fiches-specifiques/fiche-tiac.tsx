"use client"
import { UseFormRegister, UseFormWatch, FieldErrors } from "react-hook-form"

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: UseFormRegister<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  watch: UseFormWatch<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errors: FieldErrors
}

const SYMPTOMES = [
  { key: "diarrheeAqueuse", label: "Diarrhée aqueuse" },
  { key: "diarrheeeSanglante", label: "Diarrhée sanglante" },
  { key: "diarrheeGlaireuse", label: "Diarrhée glaireuse" },
  { key: "nausee", label: "Nausée" },
  { key: "vomissement", label: "Vomissement" },
  { key: "douleursAbdominales", label: "Douleurs abdominales" },
  { key: "fievre", label: "Fièvre" },
  { key: "asthenie", label: "Asthénie" },
  { key: "urticaire", label: "Urticaire" },
]

export default function FicheTiac({ register, watch, errors }: Props) {
  const devenir = watch("fiche.devenir")
  const germeIdentifie = watch("fiche.germeIdentifie")
  const complication = watch("fiche.complication")

  return (
    <div className="space-y-6">
      {/* Signes cliniques */}
      <div>
        <h4 className="font-semibold text-gray-700 mb-3">Signes cliniques</h4>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {SYMPTOMES.map((s) => (
            <label key={s.key} className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register(`fiche.symptomes.${s.key}`)} className="w-4 h-4" />
              {s.label}
            </label>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date 1er signe clinique</label>
            <input type="date" {...register("fiche.datePremierSigne")} className="input w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Délai d&apos;incubation (heures)</label>
            <input type="text" {...register("fiche.delaiIncubation")} className="input w-full" />
          </div>
        </div>
      </div>

      {/* Évolution */}
      <div>
        <h4 className="font-semibold text-gray-700 mb-3">Évolution clinique</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Devenir</label>
            <select {...register("fiche.devenir")} className="input w-full">
              <option value="">-- Sélectionner --</option>
              <option value="guerison">Guérison</option>
              <option value="deces">Décès</option>
            </select>
          </div>
          {devenir === "deces" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date du décès</label>
              <input type="date" {...register("fiche.dateDeces")} className="input w-full" />
            </div>
          )}
        </div>
        <div className="mt-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("fiche.complication")} className="w-4 h-4" />
            Complication
          </label>
          {complication && (
            <input type="text" {...register("fiche.complicationDetails")} className="input w-full mt-2" placeholder="Préciser la complication" />
          )}
        </div>
      </div>

      {/* Germe */}
      <div>
        <h4 className="font-semibold text-gray-700 mb-3">Germe causal</h4>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("fiche.germeIdentifie")} className="w-4 h-4" />
            Germe identifié
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("fiche.germeSuspecte")} className="w-4 h-4" />
            Germe suspecté épidémiologiquement
          </label>
          {germeIdentifie && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nature du prélèvement</label>
              <select {...register("fiche.germeIsoleCas")} className="input w-full">
                <option value="">-- Sélectionner --</option>
                <option value="serum">Sérum</option>
                <option value="selles">Selles</option>
                <option value="vomissement">Vomissement</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Source */}
      <div>
        <h4 className="font-semibold text-gray-700 mb-3">Source d&apos;intoxication</h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Aliment(s) incriminé(s)</label>
            <input type="text" {...register("fiche.alimentsIncrimines")} className="input w-full" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date de consommation</label>
              <input type="date" {...register("fiche.dateConsommation")} className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Heure</label>
              <input type="time" {...register("fiche.heureConsommation")} className="input w-full" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lieu du repas</label>
            <select {...register("fiche.lieuRepas")} className="input w-full">
              <option value="">-- Sélectionner --</option>
              <option value="familial">Familial</option>
              <option value="collectif_ceremonie">Collectif / Cérémonie</option>
              <option value="restaurant">Restaurant</option>
              <option value="gargote">Gargote</option>
              <option value="scolaire">Scolaire</option>
              <option value="caserne">Caserne</option>
              <option value="entreprise">Entreprise</option>
              <option value="centre_vacances">Centre de vacances</option>
              <option value="hopital">Hôpital</option>
              <option value="traiteur">Traiteur</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de personnes malades</label>
            <input type="number" {...register("fiche.nombreMalades", { valueAsNumber: true })} className="input w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Commentaires</label>
            <textarea {...register("fiche.commentaires")} className="input w-full" rows={2} />
          </div>
        </div>
      </div>
    </div>
  )
}
