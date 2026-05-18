"use client"
import { UseFormRegister, UseFormWatch, UseFormSetValue, FieldErrors, useFieldArray, Control } from "react-hook-form"
import { Plus, Trash2 } from "lucide-react"

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: UseFormRegister<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  watch: UseFormWatch<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setValue?: UseFormSetValue<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errors: FieldErrors
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control?: Control<any>
}

const SIGNES_CLINIQUES = [
  { key: "fievre", label: "Fièvre" },
  { key: "angine", label: "Angine" },
  { key: "fausseMembrane", label: "Fausse membrane" },
  { key: "dyspnee", label: "Dyspnée" },
  { key: "asthenie", label: "Asthénie" },
  { key: "paleur", label: "Pâleur" },
  { key: "tachycardie", label: "Tachycardie" },
  { key: "etatGeneralAltere", label: "État général altéré" },
  { key: "ulcerationCutanee", label: "Ulcération cutanée" },
]

const FORMES_CLINIQUES = [
  { key: "angineDiphteriqueCommune", label: "Angine diphtérique commune" },
  { key: "angineDiphtheriqueMaligne", label: "Angine diphtérique maligne" },
  { key: "angineBenigne", label: "Angine bénigne" },
  { key: "formePseudomembraneuse", label: "Forme pseudo-membraneuse" },
  { key: "diphterieCalanee", label: "Diphtérie cutanée" },
]

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function FicheDiphterie({ register, watch, setValue, errors, control }: Props) {
  const hospitalise = watch("fiche.hospitalise")
  const contactVoyageur = watch("fiche.contactVoyageur")
  const antibioAvantPrelevement = watch("fiche.antibioAvantPrelevement")
  const serotherapie = watch("fiche.serotherapie")
  const antibiotherapie = watch("fiche.antibiotherapie")
  const evolution = watch("fiche.evolution")
  const sourceExposition = watch("fiche.sourceExposition")

  const { fields: prelevementFields, append: appendPrelevement, remove: removePrelevement } = useFieldArray({
    control,
    name: "fiche.prelevements",
  })

  const { fields: contactFields, append: appendContact, remove: removeContact } = useFieldArray({
    control,
    name: "fiche.contacts",
  })

  return (
    <div className="space-y-6">
      {/* Histoire de la maladie */}
      <div>
        <h4 className="font-semibold text-gray-700 mb-3">Histoire de la maladie</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date d&apos;apparition des symptômes</label>
            <input type="date" {...register("fiche.dateApparitionSymptomes")} className="input w-full" />
          </div>
        </div>
        <div className="mt-3 space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("fiche.hospitalise")} className="w-4 h-4" />
            Hospitalisé
          </label>
          {hospitalise && (
            <div className="grid grid-cols-3 gap-3 mt-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date d&apos;hospitalisation</label>
                <input type="date" {...register("fiche.dateHospitalisation")} className="input w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hôpital</label>
                <input type="text" {...register("fiche.hopital")} className="input w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
                <input type="text" {...register("fiche.service")} className="input w-full" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Signes cliniques */}
      <div>
        <h4 className="font-semibold text-gray-700 mb-3">Signes cliniques</h4>
        <div className="grid grid-cols-3 gap-2">
          {SIGNES_CLINIQUES.map((s) => (
            <label key={s.key} className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register(`fiche.signesClinicaux.${s.key}`)} className="w-4 h-4" />
              {s.label}
            </label>
          ))}
        </div>
      </div>

      {/* Formes cliniques */}
      <div>
        <h4 className="font-semibold text-gray-700 mb-3">Formes cliniques</h4>
        <div className="grid grid-cols-2 gap-2">
          {FORMES_CLINIQUES.map((f) => (
            <label key={f.key} className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register(`fiche.formesCliniques.${f.key}`)} className="w-4 h-4" />
              {f.label}
            </label>
          ))}
        </div>
      </div>

      {/* Complications */}
      <div>
        <h4 className="font-semibold text-gray-700 mb-3">Complications</h4>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {[
            { key: "croup", label: "Croup" },
            { key: "myocardite", label: "Myocardite" },
            { key: "paralysie", label: "Paralysie" },
            { key: "atteineRenale", label: "Atteinte rénale" },
          ].map((c) => (
            <label key={c.key} className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register(`fiche.complications.${c.key}`)} className="w-4 h-4" />
              {c.label}
            </label>
          ))}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Autre localisation</label>
          <input type="text" {...register("fiche.complications.autreLocalisation")} className="input w-full" />
        </div>
      </div>

      {/* Statut vaccinal */}
      <div>
        <h4 className="font-semibold text-gray-700 mb-3">Statut vaccinal</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre total de doses</label>
            <input type="number" {...register("fiche.totalDosesVaccin", { valueAsNumber: true })} className="input w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dates des doses</label>
            <input type="text" {...register("fiche.datesDoses")} className="input w-full" placeholder="ex: 2019, 2020, 2022" />
          </div>
        </div>
      </div>

      {/* Notion de voyage / contact */}
      <div>
        <h4 className="font-semibold text-gray-700 mb-3">Notion de contact / voyage</h4>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("fiche.contactVoyageur")} className="w-4 h-4" />
            Contact avec un voyageur / retour de voyage
          </label>
          {contactVoyageur && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
              <input type="text" {...register("fiche.destinationVoyage")} className="input w-full" />
            </div>
          )}
        </div>
      </div>

      {/* Diagnostic bactériologique */}
      <div>
        <h4 className="font-semibold text-gray-700 mb-3">Diagnostic bactériologique</h4>
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register("fiche.antibioAvantPrelevement")} className="w-4 h-4" />
              Antibiothérapie avant prélèvement
            </label>
            {antibioAvantPrelevement && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Durée (jours)</label>
                <input type="text" {...register("fiche.dureeAntibio")} className="input w-full max-w-xs" />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Prélèvements</span>
              <button
                type="button"
                onClick={() => appendPrelevement({ site: "", date: "", envoiLabo: "" })}
                className="btn btn-sm btn-outline flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Ajouter
              </button>
            </div>
            {prelevementFields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-3 gap-3 mb-2 items-end">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Site</label>
                  <select {...register(`fiche.prelevements.${index}.site`)} className="input w-full text-sm">
                    <option value="">-- Site --</option>
                    <option value="pharynx">Pharynx</option>
                    <option value="nez">Nez</option>
                    <option value="lesions">Lésions</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Date prélèvement</label>
                  <input type="date" {...register(`fiche.prelevements.${index}.date`)} className="input w-full text-sm" />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-600 mb-1">Envoi labo</label>
                    <input type="text" {...register(`fiche.prelevements.${index}.envoiLabo`)} className="input w-full text-sm" />
                  </div>
                  <button type="button" onClick={() => removePrelevement(index)} className="text-red-500 hover:text-red-700 mb-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Méthodes laboratoire */}
      <div>
        <h4 className="font-semibold text-gray-700 mb-3">Résultats laboratoire</h4>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Culture</label>
            <select {...register("fiche.culture")} className="input w-full">
              <option value="">-- Résultat --</option>
              <option value="positive">Positive</option>
              <option value="negative">Négative</option>
              <option value="non_fait">Non fait</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Test ELEK</label>
            <select {...register("fiche.testElek")} className="input w-full">
              <option value="">-- Résultat --</option>
              <option value="positif">Positif</option>
              <option value="negatif">Négatif</option>
              <option value="non_fait">Non fait</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">PCR Tox</label>
            <select {...register("fiche.pcrTox")} className="input w-full">
              <option value="">-- Résultat --</option>
              <option value="positive">Positive</option>
              <option value="negative">Négative</option>
              <option value="non_fait">Non fait</option>
            </select>
          </div>
        </div>
      </div>

      {/* Mesures prises */}
      <div>
        <h4 className="font-semibold text-gray-700 mb-3">Mesures thérapeutiques</h4>
        <div className="space-y-3">
          <div>
            <label className="flex items-center gap-2 text-sm mb-2">
              <input type="checkbox" {...register("fiche.serotherapie")} className="w-4 h-4" />
              Sérothérapie administrée
            </label>
            {serotherapie && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dose</label>
                  <input type="text" {...register("fiche.doseSero")} className="input w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" {...register("fiche.dateSero")} className="input w-full" />
                </div>
              </div>
            )}
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm mb-2">
              <input type="checkbox" {...register("fiche.antibiotherapie")} className="w-4 h-4" />
              Antibiothérapie administrée
            </label>
            {antibiotherapie && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type d&apos;antibiotique</label>
                  <input type="text" {...register("fiche.typeAntibio")} className="input w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
                  <input type="date" {...register("fiche.dateAntibio")} className="input w-full" />
                </div>
              </div>
            )}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("fiche.vaccinationPrise")} className="w-4 h-4" />
            Vaccination réalisée
          </label>
        </div>
      </div>

      {/* Évolution */}
      <div>
        <h4 className="font-semibold text-gray-700 mb-3">Évolution</h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Évolution du cas</label>
            <select {...register("fiche.evolution")} className="input w-full">
              <option value="">-- Sélectionner --</option>
              <option value="guerison">Guérison</option>
              <option value="complication">Complication</option>
              <option value="deces">Décès</option>
            </select>
          </div>
          {(evolution === "complication" || evolution === "deces") && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Détails</label>
                <input type="text" {...register("fiche.evolutionDetails")} className="input w-full" />
              </div>
              {evolution === "deces" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date du décès</label>
                  <input type="date" {...register("fiche.dateDeces")} className="input w-full" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Source d'infection */}
      <div>
        <h4 className="font-semibold text-gray-700 mb-3">Source d&apos;infection</h4>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("fiche.sourceExposition")} className="w-4 h-4" />
            Source d&apos;exposition identifiée
          </label>
          {sourceExposition && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input type="text" {...register("fiche.sourceNom")} className="input w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                <input type="text" {...register("fiche.sourcePrenom")} className="input w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                <input type="text" {...register("fiche.sourceAdresse")} className="input w-full" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contacts */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-gray-700">Liste des contacts</h4>
          <button
            type="button"
            onClick={() => appendContact({ num: contactFields.length + 1, nomPrenom: "", age: "", sexe: "", qualite: "F", prelevement: false, statutVaccinal: "non_vaccine" })}
            className="btn btn-sm btn-outline flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Ajouter
          </button>
        </div>
        {contactFields.length === 0 ? (
          <p className="text-sm text-gray-500 italic">Aucun contact enregistré.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-200 rounded">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-600">N°</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-600">Nom & Prénom</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-600">Âge</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-600">Sexe</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-600">Qualité</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-600">Prélèv.</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-600">Statut vaccinal</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {contactFields.map((field, index) => (
                  <tr key={field.id}>
                    <td className="px-2 py-2 text-gray-500">{index + 1}</td>
                    <td className="px-2 py-2">
                      <input type="text" {...register(`fiche.contacts.${index}.nomPrenom`)} className="input w-full text-xs" />
                    </td>
                    <td className="px-2 py-2">
                      <input type="text" {...register(`fiche.contacts.${index}.age`)} className="input w-16 text-xs" />
                    </td>
                    <td className="px-2 py-2">
                      <input type="text" {...register(`fiche.contacts.${index}.sexe`)} className="input w-12 text-xs" placeholder="M/F" />
                    </td>
                    <td className="px-2 py-2">
                      <select {...register(`fiche.contacts.${index}.qualite`)} className="input text-xs">
                        <option value="F">F</option>
                        <option value="E">E</option>
                        <option value="C">C</option>
                        <option value="CB">CB</option>
                      </select>
                    </td>
                    <td className="px-2 py-2">
                      <input type="checkbox" {...register(`fiche.contacts.${index}.prelevement`)} className="w-4 h-4" />
                    </td>
                    <td className="px-2 py-2">
                      <select {...register(`fiche.contacts.${index}.statutVaccinal`)} className="input text-xs">
                        <option value="complet">Complet</option>
                        <option value="incomplet">Incomplet</option>
                        <option value="non_vaccine">Non vacciné</option>
                      </select>
                    </td>
                    <td className="px-2 py-2">
                      <button type="button" onClick={() => removeContact(index)} className="text-red-500 hover:text-red-700">
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

      {/* Mesures contacts */}
      <div>
        <h4 className="font-semibold text-gray-700 mb-3">Mesures prises pour les contacts</h4>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("fiche.mesuresContacts.prelevements")} className="w-4 h-4" />
            Prélèvements
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("fiche.mesuresContacts.chimio")} className="w-4 h-4" />
            Chimioprophylaxie
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("fiche.mesuresContacts.vaccination")} className="w-4 h-4" />
            Vaccination
          </label>
        </div>
      </div>
    </div>
  )
}
