# src/components/

All React components for the EHU surveillance system, organized by feature domain.

## Directory Structure
- `ui/` — shadcn/ui base primitives (do not modify)
- `layout/` — App shell: sidebar, topbar, breadcrumb
- `auth/` — Login form, role selector
- `dashboard/` — Dashboard KPI cards, maps, charts
- `declarations/` — Case declaration forms, tables, detail tabs
- `investigations/` — Investigation map, contact tracing, control measures
- `alertes/` — Alert cards, list, detail
- `analyses/` — Analytics charts, advanced filters
- `utilisateurs/` — User management table and form
- `parametres/` — Settings CRUD tables
- `maps/` — Reusable Leaflet map components
- `charts/` — Reusable Recharts wrappers
- `notifications/` — Notification bell and list
- `shared/` — Generic reusable components (spinner, empty state, pagination, etc.)

## Key Rules
- Add `"use client"` directive to any component using hooks, event handlers, browser APIs, or Leaflet
- Import types from `@/types/`, never inline large type definitions in component files
- Use shadcn/ui primitives from `ui/` as building blocks — do not re-implement what shadcn provides
- Brand color throughout: `#1B4F8A` (EHU Blue) — mapped to `brand-700` in Tailwind config
- No barrel/index files — import components directly: `import { CasListTable } from '@/components/declarations/cas-list-table'`
- All forms use React Hook Form + Zod; never use uncontrolled inputs for validated forms
