export interface FicheTiacData {
  // Signes cliniques
  datePremierSigne?: string
  delaiIncubation?: string
  symptomes: {
    diarrheeAqueuse: boolean; diarrheeeSanglante: boolean; diarrheeGlaireuse: boolean
    nausee: boolean; vomissement: boolean; douleursAbdominales: boolean
    fievre: boolean; asthenie: boolean; urticaire: boolean; autres: boolean
    autresPreciser?: string
  }
  // Evolution
  dateHospitalisation?: string
  lieuHospitalisation?: string
  dureeHospitalisation?: string
  complication: boolean
  complicationDetails?: string
  devenir: "guerison" | "deces" | ""
  dateSortie?: string
  dateDeces?: string
  // Germe
  germeIdentifie: boolean
  germeSuspecte: boolean
  germeSuspectDetails?: string
  germeIsoleCas?: "serum" | "selles" | "vomissement" | ""
  germeIsoleAliment: boolean
  commentaires?: string
  // Source
  alimentsIncrimines?: string
  dateConsommation?: string
  heureConsommation?: string
  lieuRepas: "familial" | "collectif_ceremonie" | "restaurant" | "gargote" | "scolaire" | "caserne" | "entreprise" | "centre_vacances" | "hopital" | "traiteur" | ""
  adresseRepas?: string
  origineAliment: "commerciale" | "industrielle" | "artisanale" | ""
  nombreMalades?: number
}
