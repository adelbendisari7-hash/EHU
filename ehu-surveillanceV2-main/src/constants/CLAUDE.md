# src/constants/

Application-wide constants and static configuration data. These are pure data files with no side effects.

## Files

### `roles.ts`
Role definitions and permissions matrix.
```ts
export const ROLES = ['medecin', 'epidemiologiste', 'admin'] as const
export type Role = typeof ROLES[number]

export const ROLE_LABELS: Record<Role, string> = {
  medecin: 'Médecin',
  epidemiologiste: 'Épidémiologiste',
  admin: 'Administrateur',
}

export const PERMISSIONS: Record<string, Role[]> = {
  'cas:read:own': ['medecin'],
  'cas:read:all': ['epidemiologiste', 'admin'],
  'cas:create': ['medecin', 'epidemiologiste'],
  'cas:delete': ['admin'],
  'users:manage': ['admin'],
  // ...
}
```

### `statuts.ts`
Case status enum with display labels and badge colors.
```ts
export const CAS_STATUTS = { nouveau: { label: 'Nouveau', color: 'gray' }, ... }
export const CONTACT_STATUTS = { a_contacter: { label: 'À contacter', color: 'gray' }, ... }
```

### `maladies-mdo.ts`
Initial seed list of Algeria MDO diseases (used in `prisma/seed.ts`).
Array of `{ nom, code_mdo, categorie, seuil_alerte }` objects.
Reference: Ministerial decree on notifiable diseases in Algeria.

### `wilayas.ts`
Static list of 48 Algerian wilayas with codes and names.
```ts
export const WILAYAS = [
  { code: '01', nom: 'Adrar' },
  { code: '02', nom: 'Chlef' },
  // ... all 48
]
```
Used in `prisma/seed.ts` and in forms where a full list is needed without an API call.

### `navigation.ts`
Sidebar navigation menu configuration.
```ts
export const NAVIGATION = [
  { label: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard, roles: ['medecin', 'epidemiologiste', 'admin'] },
  { label: 'Déclarations', href: '/declarations', icon: FileText, roles: ['medecin', 'epidemiologiste', 'admin'] },
  // ...
]
```
The sidebar renders only items where `session.user.role` is in the `roles` array.
