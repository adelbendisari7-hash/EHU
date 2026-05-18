export interface FicheDiphterieData {
  dateApparitionSymptomes?: string
  hospitalise: boolean
  dateHospitalisation?: string
  hopital?: string; service?: string
  signesClinicaux: {
    fievre: boolean; angine: boolean; fausseMembrane: boolean; dyspnee: boolean
    asthenie: boolean; paleur: boolean; tachycardie: boolean; etatGeneralAltere: boolean; ulcerationCutanee: boolean
  }
  formesCliniques: { angineDiphteriqueCommune: boolean; angineDiphtheriqueMaligne: boolean; angineBenigne: boolean; formePseudomembraneuse: boolean; diphterieCalanee: boolean }
  complications: { croup: boolean; myocardite: boolean; myocarditeDetails?: string; paralysie: boolean; atteineRenale: boolean; autreLocalisation?: string }
  totalDosesVaccin?: number
  datesDoses?: string
  contactVoyageur: boolean; destinationVoyage?: string
  antibioAvantPrelevement: boolean; dureeAntibio?: string
  prelevements: Array<{ site: "pharynx" | "nez" | "lesions"; date?: string; envoiLabo?: string }>
  culture?: "positive" | "negative" | "non_fait"
  testElek?: "positif" | "negatif" | "non_fait"
  pcrTox?: "positive" | "negative" | "non_fait"
  serotherapie: boolean; doseSero?: string; dateSero?: string
  antibiotherapie: boolean; typeAntibio?: string; dateAntibio?: string
  vaccinationPrise: boolean
  evolution: "guerison" | "complication" | "deces" | ""
  evolutionDetails?: string
  dateDeces?: string
  sourceExposition: boolean
  sourceNom?: string; sourcePrenom?: string; sourceAdresse?: string
  contacts: Array<{ num: number; nomPrenom: string; age: string; sexe: string; qualite: "F" | "E" | "C" | "CB"; prelevement: boolean; statutVaccinal: "complet" | "incomplet" | "non_vaccine" }>
  mesuresContacts: { prelevements: boolean; chimio: boolean; vaccination: boolean }
}
