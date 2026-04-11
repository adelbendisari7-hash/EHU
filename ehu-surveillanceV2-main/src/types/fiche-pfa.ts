export interface FichePfaData {
  numeroEpid?: string; pays?: string; epsp?: string; anneeDebut?: string; numeroCas?: string
  coordGpsLat?: string; coordGpsLng?: string
  nomPatient?: string; nomPere?: string; nomMere?: string; telParents?: string
  casNotifiePar?: string; dateNotification?: string; dateInvestigation?: string
  hospitalise: boolean; dateHospitalisation?: string; numeroDossier?: string; nomHopital?: string
  fievreApparition?: "oui" | "non" | "inconnu"
  paralysiePropressive?: "oui" | "non" | "inconnu"
  inferieur3Jours?: boolean
  siteParalysie: { msg: boolean; msd: boolean; mig: boolean; mid: boolean }
  dateApparitionParalysie?: string
  vraiePfa?: boolean; asymetrique?: boolean
  membresSensibles?: boolean; injectionAvantParalysie?: boolean
  diagnosticProvisoire?: string
  confirmationPfa?: boolean
  dosesVpo?: number; dosesVpi?: number
  datesDoses?: string; sourceInfo?: "carte" | "rappel"
  datePrelevement1?: string; datePrelevement2?: string
  dateEnvoiPev?: string; dateEnvoiLabo?: string
  etatReception?: "approprie" | "pas_approprie"
  cultureCellulaire?: string; resultats?: string
  paralysieResiduelle?: boolean
  classementFinal?: "confirmee" | "compatible" | "rejete" | "pas_pfa" | ""
}
