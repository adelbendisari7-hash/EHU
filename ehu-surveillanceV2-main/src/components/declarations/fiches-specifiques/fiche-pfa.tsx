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

export default function FichePfa({ register, watch, errors }: Props) {
  const hospitalise = watch("fiche.hospitalise")
  const confirmationPfa = watch("fiche.confirmationPfa")

  return (
    <div className="space-y-6">
      {/* Identification */}
      <div>
        <h4 className="font-semibold text-gray-700 mb-3">Identification</h4>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">N° EPID</label>
            <input type="text" {...register("fiche.numeroEpid")} className="input w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pays</label>
            <input type="text" {...register("fiche.pays")} className="input w-full" defaultValue="Algérie" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">EPSP</label>
            <input type="text" {...register("fiche.epsp")} className="input w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Année de début</label>
            <input type="text" {...register("fiche.anneeDebut")} className="input w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">N° du cas</label>
            <input type="text" {...register("fiche.numeroCas")} className="input w-full" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Coordonnées GPS (Lat.)</label>
            <input type="text" {...register("fiche.coordGpsLat")} className="input w-full" placeholder="ex: 35.6976" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Coordonnées GPS (Lng.)</label>
            <input type="text" {...register("fiche.coordGpsLng")} className="input w-full" placeholder="ex: -0.6337" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom du père</label>
            <input type="text" {...register("fiche.nomPere")} className="input w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la mère</label>
            <input type="text" {...register("fiche.nomMere")} className="input w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone parents</label>
            <input type="tel" {...register("fiche.telParents")} className="input w-full" />
          </div>
        </div>
      </div>

      {/* Notification */}
      <div>
        <h4 className="font-semibold text-gray-700 mb-3">Notification</h4>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cas notifié par</label>
            <input type="text" {...register("fiche.casNotifiePar")} className="input w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date de notification</label>
            <input type="date" {...register("fiche.dateNotification")} className="input w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date d&apos;investigation</label>
            <input type="date" {...register("fiche.dateInvestigation")} className="input w-full" />
          </div>
        </div>
      </div>

      {/* Hospitalisation */}
      <div>
        <h4 className="font-semibold text-gray-700 mb-3">Hospitalisation</h4>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("fiche.hospitalise")} className="w-4 h-4" />
            Hospitalisé
          </label>
          {hospitalise && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date d&apos;hospitalisation</label>
                <input type="date" {...register("fiche.dateHospitalisation")} className="input w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">N° dossier</label>
                <input type="text" {...register("fiche.numeroDossier")} className="input w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l&apos;hôpital</label>
                <input type="text" {...register("fiche.nomHopital")} className="input w-full" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Antécédents cliniques */}
      <div>
        <h4 className="font-semibold text-gray-700 mb-3">Antécédents cliniques</h4>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fièvre à l&apos;apparition</label>
              <select {...register("fiche.fievreApparition")} className="input w-full">
                <option value="">-- Sélectionner --</option>
                <option value="oui">Oui</option>
                <option value="non">Non</option>
                <option value="inconnu">Inconnu</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Paralysie progressive</label>
              <select {...register("fiche.paralysiePropressive")} className="input w-full">
                <option value="">-- Sélectionner --</option>
                <option value="oui">Oui</option>
                <option value="non">Non</option>
                <option value="inconnu">Inconnu</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date d&apos;apparition de la paralysie</label>
              <input type="date" {...register("fiche.dateApparitionParalysie")} className="input w-full" />
            </div>
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register("fiche.inferieur3Jours")} className="w-4 h-4" />
              Durée de progression inférieure à 3 jours
            </label>
          </div>
        </div>
      </div>

      {/* Site de la paralysie */}
      <div>
        <h4 className="font-semibold text-gray-700 mb-3">Site de la paralysie</h4>
        <div className="grid grid-cols-4 gap-3">
          {[
            { key: "msg", label: "MS Gauche" },
            { key: "msd", label: "MS Droit" },
            { key: "mig", label: "MI Gauche" },
            { key: "mid", label: "MI Droit" },
          ].map((s) => (
            <label key={s.key} className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register(`fiche.siteParalysie.${s.key}`)} className="w-4 h-4" />
              {s.label}
            </label>
          ))}
        </div>
      </div>

      {/* Examen des membres */}
      <div>
        <h4 className="font-semibold text-gray-700 mb-3">Examen des membres</h4>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("fiche.vraiePfa")} className="w-4 h-4" />
            Vraie PFA (flaccide, aiguë)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("fiche.asymetrique")} className="w-4 h-4" />
            Asymétrique
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("fiche.membresSensibles")} className="w-4 h-4" />
            Membres sensibles
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("fiche.injectionAvantParalysie")} className="w-4 h-4" />
            Injection avant paralysie
          </label>
        </div>
      </div>

      {/* Diagnostic provisoire */}
      <div>
        <h4 className="font-semibold text-gray-700 mb-3">Diagnostic provisoire</h4>
        <input type="text" {...register("fiche.diagnosticProvisoire")} className="input w-full" />
      </div>

      {/* Confirmation PFA */}
      <div>
        <h4 className="font-semibold text-gray-700 mb-3">Confirmation PFA</h4>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register("fiche.confirmationPfa")} className="w-4 h-4" />
          Confirmation PFA
        </label>
      </div>

      {/* Antécédents vaccinaux */}
      <div>
        <h4 className="font-semibold text-gray-700 mb-3">Antécédents vaccinaux</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Doses VPO reçues</label>
            <input type="number" {...register("fiche.dosesVpo", { valueAsNumber: true })} className="input w-full" min={0} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Doses VPI reçues</label>
            <input type="number" {...register("fiche.dosesVpi", { valueAsNumber: true })} className="input w-full" min={0} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dates des doses</label>
            <input type="text" {...register("fiche.datesDoses")} className="input w-full" placeholder="ex: 2022, 2022, 2023" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Source de l&apos;information</label>
            <select {...register("fiche.sourceInfo")} className="input w-full">
              <option value="">-- Sélectionner --</option>
              <option value="carte">Carte de vaccination</option>
              <option value="rappel">Rappel verbal</option>
            </select>
          </div>
        </div>
      </div>

      {/* Prélèvements selles */}
      <div>
        <h4 className="font-semibold text-gray-700 mb-3">Prélèvements de selles</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date prélèvement 1</label>
            <input type="date" {...register("fiche.datePrelevement1")} className="input w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date prélèvement 2</label>
            <input type="date" {...register("fiche.datePrelevement2")} className="input w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date envoi PEV</label>
            <input type="date" {...register("fiche.dateEnvoiPev")} className="input w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date envoi labo</label>
            <input type="date" {...register("fiche.dateEnvoiLabo")} className="input w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">État à la réception</label>
            <select {...register("fiche.etatReception")} className="input w-full">
              <option value="">-- Sélectionner --</option>
              <option value="approprie">Approprié</option>
              <option value="pas_approprie">Pas approprié</option>
            </select>
          </div>
        </div>
      </div>

      {/* Résultats labo */}
      <div>
        <h4 className="font-semibold text-gray-700 mb-3">Résultats laboratoire</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Culture cellulaire</label>
            <input type="text" {...register("fiche.cultureCellulaire")} className="input w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Résultats</label>
            <input type="text" {...register("fiche.resultats")} className="input w-full" />
          </div>
        </div>
        <div className="mt-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("fiche.paralysieResiduelle")} className="w-4 h-4" />
            Paralysie résiduelle à 60 jours
          </label>
        </div>
      </div>

      {/* Classement final */}
      <div>
        <h4 className="font-semibold text-gray-700 mb-3">Classement final</h4>
        <select {...register("fiche.classementFinal")} className="input w-full">
          <option value="">-- Sélectionner --</option>
          <option value="confirmee">Confirmée (poliovirus sauvage)</option>
          <option value="compatible">Compatible</option>
          <option value="rejete">Rejeté</option>
          <option value="pas_pfa">Pas une PFA</option>
        </select>
      </div>
    </div>
  )
}
