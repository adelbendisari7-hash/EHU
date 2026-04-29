export type Role = "medecin" | "epidemiologiste" | "admin"

export type CasStatut = "brouillon" | "nouveau" | "en_cours" | "confirme" | "suspect" | "infirme" | "cloture"

export type AlerteType = "epidemique" | "seuil" | "information"

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: Role
  etablissementId?: string
  wilayadId?: string
  phone?: string
  isActive: boolean
  createdAt: Date
  lastLogin?: Date
}

export interface Patient {
  id: string
  identifiant: string
  firstName: string
  lastName: string
  dateOfBirth: Date
  sex: "homme" | "femme"
  address: string
  communeId?: string
  phone?: string
  photoUrl?: string
  createdAt: Date
}

export interface Maladie {
  id: string
  nom: string
  codeCim10: string
  nomCourt?: string | null
  categorie: string
  seuilDefaut?: number | null
  hasFicheSpecifique: boolean
  ficheSpecifiqueSlug?: string | null
  isActive: boolean
}

export interface Wilaya {
  id: string
  nom: string
  code: string
}

export interface Commune {
  id: string
  nom: string
  wilayadId: string
  latitude?: number
  longitude?: number
}

export interface Etablissement {
  id: string
  nom: string
  type: string
  communeId?: string
  wilayadId?: string
  adresse?: string
}
