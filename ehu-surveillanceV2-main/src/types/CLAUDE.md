# src/types/

TypeScript type definitions for all domain entities and API interfaces. These types mirror the Prisma schema but are decoupled from it to allow use in Client Components (which cannot import Prisma types directly).

## Files

### `index.ts`
Re-exports all types from the domain files for convenience:
```ts
export type { User, UserRole } from './user'
export type { Patient } from './patient'
export type { Cas, CasStatut } from './cas'
export type { Investigation, InvestigationStatut, Contact, ContactStatut } from './investigation'
export type { Alerte, AlerteType, AlerteStatut } from './alerte'
export type { Maladie } from './maladie'
export type { Etablissement, EtablissementType } from './etablissement'
export type { Wilaya, Commune } from './geo'
```
Import with: `import type { Cas, Patient } from '@/types'`

### `user.ts`
`User` type, `UserRole` enum (`medecin | epidemiologiste | admin`).

### `patient.ts`
`Patient` type with all demographic fields. `PatientWithCas` extends Patient with `cas: Cas[]`.

### `cas.ts`
`Cas` type (cas_declares table). `CasStatut` enum. `CasWithRelations` includes nested patient, maladie, établissement.

### `investigation.ts`
`Investigation` type. `InvestigationStatut` enum. `Contact` type with `ContactStatut` enum.

### `alerte.ts`
`Alerte` type. `AlerteType` enum (`epidemique | seuil | information`). `AlerteStatut` enum.

### `maladie.ts`
`Maladie` type. `MaladieCategorie` enum.

### `api.ts`
API request/response types:
- `ApiResponse<T>` — `{ data: T, message?: string }`
- `ApiError` — `{ error: string, details?: ZodIssue[] }`
- `PaginatedResponse<T>` — `{ data: T[], pagination: { page, limit, total, totalPages } }`
- Filter types for each resource: `CasFilters`, `AlerteFilters`, `UserFilters`, `StatsFilters`
