"use client"
import { UseFormRegister, UseFormWatch, FieldErrors, useFieldArray, Control } from "react-hook-form"
import { Plus, Trash2 } from "lucide-react"

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: UseFormRegister<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  watch: UseFormWatch<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errors: FieldErrors
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control?: Control<any>
}

export default function FicheMeningite({ register, watch, errors, control }: Props) {
  const collectivite = watch("fiche.collectivite")
  const contactMeningite = watch("fiche.contactMeningite")
  const vaccineAntiMeningocoque = watch("fiche.vaccineAntiMeningocoque")
  const evolution = watch("fiche.evolution")
  const chimioprophylaxie = watch("fiche.chimioprophylaxie")
  const suspicionGerme = watch("fiche.suspicionGerme")

  const { fields, append, remove } = useFieldArray({
    control,
    name: "fiche.contacts",
  })

  return (
    <div className="space-y-6">
      {/* Collectivité */}
      <div>
        <h4 className="font-semibold text-gray-700 mb-3">Collectivité</h4>
        <label className="flex items-center gap-2 text-sm mb-2">
          <input type="checkbox" {...register("fiche.collectivite")} className="w-4 h-4" />
          Cas survenu en collectivité
        </label>
        {collectivite && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type de collectivité</label>
            <select {...register("fiche.typeCollectivite")} className="input w-full">
              <option value="">-- Sélectionner --</option>
              <option value="creche">Crèche</option>
              <option value="internat">Internat</option>
              <option value="caserne">Caserne</option>
              <option value="ecole">École</option>
              <option value="autres">Autres</option>
            </select>
          </div>
        )}
      </div>

      {/* Signes cliniques */}
      <div>
        <h4 className="font-semibold text-gray-700 mb-3">Signes cliniques</h4>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("fiche.signesClinicaux.cephalees")} className="w-4 h-4" />
            Céphalées
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("fiche.signesClinicaux.vomissements")} className="w-4 h-4" />
            Vomissements
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("fiche.signesClinicaux.fievre")} className="w-4 h-4" />
            Fièvre
          </label>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Autres signes</label>
          <input type="text" {...register("fiche.signesClinicaux.autres")} className="input w-full" placeholder="Préciser..." />
        </div>
      </div>

      {/* Antécédents */}
      <div>
        <h4 className="font-semibold text-gray-700 mb-3">Antécédents</h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Antécédents personnels</label>
            <textarea {...register("fiche.antecedentsPersonnels")} className="input w-full" rows={2} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Antécédents familiaux</label>
            <textarea {...register("fiche.antecedentsFamiliaux")} className="input w-full" rows={2} />
          </div>
        </div>
      </div>

      {/* Confirmation germe */}
      <div>
        <h4 className="font-semibold text-gray-700 mb-3">Confirmation du germe</h4>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("fiche.suspicionGerme")} className="w-4 h-4" />
            Suspicion de germe
          </label>
          {suspicionGerme && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Germe suspecté</label>
              <select {...register("fiche.germe")} className="input w-full">
                <option value="">-- Sélectionner --</option>
                <option value="meningocoque">Méningocoque</option>
                <option value="pneumocoque">Pneumocoque</option>
                <option value="hemophilus">Hémophilus</option>
                <option value="autres">Autres</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Contage */}
      <div>
        <h4 className="font-semibold text-gray-700 mb-3">Notion de contage</h4>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("fiche.contactMeningite")} className="w-4 h-4" />
            Contact avec un cas de méningite
          </label>
          {contactMeningite && (
            <div className="grid grid-cols-3 gap-3 mt-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input type="text" {...register("fiche.contactNom")} className="input w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                <input type="text" {...register("fiche.contactPrenom")} className="input w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                <input type="text" {...register("fiche.contactAdresse")} className="input w-full" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Vaccination */}
      <div>
        <h4 className="font-semibold text-gray-700 mb-3">Vaccination anti-méningocoque</h4>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("fiche.vaccineAntiMeningocoque")} className="w-4 h-4" />
            Vacciné anti-méningocoque
          </label>
          {vaccineAntiMeningocoque && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date de vaccination</label>
              <input type="date" {...register("fiche.dateVaccin")} className="input w-full max-w-xs" />
            </div>
          )}
        </div>
      </div>

      {/* Évolution */}
      <div>
        <h4 className="font-semibold text-gray-700 mb-3">Évolution</h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Évolution</label>
            <select {...register("fiche.evolution")} className="input w-full">
              <option value="">-- Sélectionner --</option>
              <option value="guerison">Guérison</option>
              <option value="sous_traitement">Sous traitement</option>
              <option value="deces">Décès</option>
              <option value="sequelles">Séquelles</option>
            </select>
          </div>
          {evolution === "sequelles" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Détails des séquelles</label>
              <textarea {...register("fiche.sequellesDetails")} className="input w-full" rows={2} />
            </div>
          )}
        </div>
      </div>

      {/* Chimioprophylaxie */}
      <div>
        <h4 className="font-semibold text-gray-700 mb-3">Chimioprophylaxie</h4>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("fiche.chimioprophylaxie")} className="w-4 h-4" />
            Chimioprophylaxie réalisée
          </label>
          {chimioprophylaxie && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Raison / Détails</label>
              <input type="text" {...register("fiche.raisonChimio")} className="input w-full" />
            </div>
          )}
        </div>
      </div>

      {/* Liste contacts */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-gray-700">Liste des contacts</h4>
          <button
            type="button"
            onClick={() => append({ num: fields.length + 1, nomPrenom: "", age: "", adresse: "" })}
            className="btn btn-sm btn-outline flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Ajouter
          </button>
        </div>
        {fields.length === 0 ? (
          <p className="text-sm text-gray-500 italic">Aucun contact enregistré.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-200 rounded">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">N°</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Nom & Prénom</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Âge</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Adresse</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {fields.map((field, index) => (
                  <tr key={field.id}>
                    <td className="px-3 py-2 text-gray-500">{index + 1}</td>
                    <td className="px-3 py-2">
                      <input type="text" {...register(`fiche.contacts.${index}.nomPrenom`)} className="input w-full text-sm" />
                    </td>
                    <td className="px-3 py-2">
                      <input type="text" {...register(`fiche.contacts.${index}.age`)} className="input w-24 text-sm" />
                    </td>
                    <td className="px-3 py-2">
                      <input type="text" {...register(`fiche.contacts.${index}.adresse`)} className="input w-full text-sm" />
                    </td>
                    <td className="px-3 py-2">
                      <button type="button" onClick={() => remove(index)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
