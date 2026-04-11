export interface FicheMeningiteData {
  collectivite: boolean
  typeCollectivite?: "creche" | "internat" | "caserne" | "ecole" | "autres"
  signesClinicaux: { cephalees: boolean; vomissements: boolean; fievre: boolean; autres?: string }
  antecedentsPersonnels?: string
  antecedentsFamiliaux?: string
  suspicionGerme: boolean
  germe?: "meningocoque" | "pneumocoque" | "hemophilus" | "autres"
  contactMeningite: boolean
  contactNom?: string; contactPrenom?: string; contactAdresse?: string
  vaccineAntiMeningocoque: boolean
  dateVaccin?: string
  evolution: "guerison" | "sous_traitement" | "deces" | "sequelles" | ""
  sequellesDetails?: string
  chimioprophylaxie: boolean
  raisonChimio?: string
  contacts: Array<{ num: number; nomPrenom: string; age: string; adresse: string }>
}
