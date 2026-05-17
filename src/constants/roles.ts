import { Role } from "@/types"

export const ROLES: Record<Role, { label: string; description: string }> = {
  medecin: {
    label: "Médecin Déclarant",
    description: "Déclare les cas depuis l'hôpital ou cabinet",
  },
  epidemiologiste: {
    label: "Épidémiologiste DSP",
    description: "Investigue, analyse, gère les alertes",
  },
  admin: {
    label: "Administrateur",
    description: "Gère les utilisateurs et les paramètres système",
  },
}

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  medecin: ["cas:read", "cas:create", "cas:update:own", "dashboard:read"],
  epidemiologiste: [
    "cas:read", "cas:create", "cas:update", "cas:status",
    "investigation:read", "investigation:create", "investigation:update",
    "alerte:read", "alerte:create", "alerte:update",
    "analyses:read", "dashboard:read",
  ],
  admin: ["*"],
}
