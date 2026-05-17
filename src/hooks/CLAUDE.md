# src/hooks/

Custom React hooks for data fetching, authentication state, and shared stateful logic. All hooks are Client-side (`"use client"` context required at call site).

## Data-Fetching Strategy
All data-fetching hooks use **SWR** (preferred) or **React Query**. Never call `fetch` directly in components.

## Hooks

### `use-auth.ts`
Wraps NextAuth's `useSession()` hook.
Returns: `{ user, role, isLoading, isAuthenticated }`.
Helper methods: `isAdmin()`, `isEpidemiologiste()`, `isMedecin()`, `canEdit(cas)`.

### `use-cas.ts`
CRUD + fetching for cases.
- `useCasList(filters)` — paginated case list with SWR
- `useCas(casId)` — single case detail
- `useCreateCas()` — mutation hook for POST /api/cas
- `useUpdateCas(casId)` — mutation hook for PATCH /api/cas/:casId
- `useDeleteCas(casId)` — mutation hook for DELETE /api/cas/:casId

### `use-patients.ts`
- `usePatientSearch(query)` — debounced search for deduplication (SWR with `dedupingInterval`)

### `use-investigations.ts`
- `useInvestigations(filters)` — paginated list
- `useInvestigation(id)` — single investigation with contacts
- `useUpdateInvestigation(id)` — mutation for PATCH

### `use-alertes.ts`
- `useAlertes(filters)` — list with statut/type filters
- `useAlerte(id)` — single alert detail
- `useResolveAlerte(id)` — mutation hook

### `use-stats.ts`
- `useDashboardStats(filters)` — dashboard KPI data
- `useAnalysesStats(filters)` — advanced analytics data

### `use-notifications.ts`
- `useNotifications()` — polls every 30s for unread notifications
- `useMarkAsRead(id)` — mutation to mark notification read

### `use-debounce.ts`
Pure utility hook: `useDebounce<T>(value: T, delay: number): T`.
Used in search inputs to avoid excessive API calls.
