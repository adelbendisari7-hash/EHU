# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Next.js (App Router) + TypeScript epidemiological disease surveillance system for EHU Oran, Algeria. Tracks mandatory disease declarations (MDO), patient cases, epidemiological investigations, alerts, and generates reports. The UI and all domain data are in French.

## Commands

```bash
# Development
npm run dev           # Start dev server (webpack mode)
npm run build         # prisma generate + Next.js build
npm run start         # Production server (requires build + .env)
npm run lint          # ESLint check

# Testing (Vitest)
npm run test          # Run all tests once
npm run test:watch    # Watch mode
npx vitest run __tests__/utils/format-date.test.ts  # Run a single test file

# Database
npm run db:migrate    # Apply pending Prisma migrations (production)
npm run db:seed       # Seed reference data (48 wilayas, 1541 communes, all MDO diseases)
npm run db:seed:uisti # Seed UISTI-specific reference data
npx prisma migrate dev --name <name>  # Create a new migration (development)
npx prisma generate   # Regenerate Prisma Client after schema changes
npx prisma studio     # Open Prisma Studio GUI
```

## Environment Variables

Required in `.env.local` (see `.env.example`):
- `DATABASE_URL` — PostgreSQL connection string
- `AUTH_SECRET` — 32-char random string (generate: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`)
- `NEXTAUTH_URL` — App URL
- `RESEND_API_KEY` — Email service (password reset)
- `FROM_EMAIL` — Sender address

Optional (file storage):
- `S3_BUCKET`, `S3_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` (or Cloudflare R2 equivalents)

## Architecture

### Request Flow

```
Request → middleware.ts (JWT auth check) → app/api/*/route.ts → Prisma → PostgreSQL
```

Business logic lives **directly in API route handlers** — there is no separate `src/services/` layer. Zod schemas are defined inline per route, not in a shared validators file.

### Routing Structure

- `src/app/(auth)/` — Public routes: login, forgot-password, reset-password
- `src/app/(dashboard)/` — Protected routes behind sidebar layout; one folder per feature:
  - `declarations/` — Case list, new declaration form, individual case detail + investigation page
  - `investigations/` — Epidemiological investigation management
  - `alertes/` — Health alert list and detail
  - `analyses/` — Advanced analytics and charts
  - `predictions/` — CUSUM and Holt-Winters epidemic forecasting
  - `rapports/` — Report generation and archive
  - `uisti/` — UISTI morbidity/mortality statistics (access restricted to `uisti` + `admin` roles)
  - `uhh/` — UHH (Unité d'Hygiène Hospitalière): IAS declaration (`ias/`) and dashboard (`dashboard/`)
  - `parametres/` — System settings: diseases, thresholds, protocols, users, establishments
  - `utilisateurs/` — User management (admin only)
  - `roles/` — RBAC role/permission management (admin only)
  - `dashboard/` — Main summary dashboard (stats cards, recent cases, active alerts)
  - `mes-stats/` — Per-user personal statistics
  - `notifications/` — Notification center
  - `profil/` — User profile and password change
- `src/app/api/` — REST API handlers; collection at `[resource]/route.ts`, single item at `[resource]/[id]/route.ts`
- `middleware.ts` — Intercepts all requests; allows only `/login`, `/forgot-password`, `/reset-password` unauthenticated; uses `authjs.session-token` cookie (or `__Secure-` prefix on HTTPS)

### API Route Convention

Every route handler must follow this pattern:
1. `auth()` → 401 if unauthenticated (or use `requirePermission`/`requireRole` from `src/lib/permissions.ts` which combine steps 1+2)
2. Check permissions → 403 if unauthorized
3. Validate body/params with Zod schema (inline in the route file) → 400 if invalid
4. Query/mutate via Prisma directly
5. Write to `audit_logs` for any mutation (via `src/lib/audit.ts`)
6. Return JSON with appropriate HTTP status

### Authentication & Roles

- NextAuth.js v5 (`next-auth@5.0.0-beta`) with CredentialsProvider, JWT strategy, 8-hour sessions
- Four roles: `medecin` (declare cases), `epidemiologiste` (investigate + analyze), `uisti` (morbidity/mortality stats view), `admin` (full access)
- Full RBAC via `Role`/`Permission`/`RolePermission`/`UserRole` models in DB
- JWT claims include: `userId`, `role`, `roles[]`, `permissions[]`, `etablissementId`, `wilayadId`
- Auth config in `src/lib/auth.ts`; exported `auth`, `signIn`, `signOut`, `handlers`

### Key Directories

| Path | Purpose |
|------|---------|
| `src/lib/auth.ts` | NextAuth configuration |
| `src/lib/prisma.ts` | Prisma Client singleton (prevents hot-reload duplication) |
| `src/lib/permissions.ts` | `requirePermission(slug)` / `requireRole(...roles)` helpers used at the top of API route handlers; return a `NextResponse` (401/403) or `null` if authorized |
| `src/lib/check-thresholds.ts` | Called after each case save; compares case counts against `SeuilAlerte` rules and auto-creates `Alerte` records + `Notification` rows |
| `src/lib/predictions.ts` | Pure algorithmic functions: `computeCusum()` (CUSUM anomaly detection) and `computeHoltWinters()` (Holt linear trend + 14-day forecast) — no DB access, tested in isolation |
| `src/lib/storage.ts` | Local-filesystem file storage to `public/uploads/`; exports `saveUploadedFile(file)` and `deleteUploadedFile(url)`. S3 env vars are optional future replacement |
| `src/hooks/use-auth.ts` | Reads the current NextAuth session client-side |
| `src/hooks/use-fiche-init.ts` | Auto-fills disease-specific form fields (fiche spécifique) on mount via `setValue`; handles nested objects recursively |
| `src/hooks/use-ocr-scan.ts` | Uploads a scanned form image to the OCR microservice; returns extracted field values with confidence scores |
| `src/lib/email.ts` | Sends transactional emails via Resend; exports `sendAlertEmail()` |
| `src/components/ui/` | shadcn/ui primitives (Radix UI) — do not edit manually |
| `src/components/shared/` | Reusable cross-feature components |
| `src/constants/` | App-wide enums and lookup tables (statuts, roles, reference data, navigation) |
| `prisma/schema.prisma` | Database schema (30+ models) |
| `prisma/seed.ts` | Reference data seeder |

### Database Schema Key Models

- **CasDeclare** — Core case declaration; statut enum: `brouillon | suspect | confirme`; related: `CasSymptome` (symptom junction), `CasLieu` (up to 4 frequented locations), `ResultatLabo` (lab results with germe), `Fichier` (attachments). Also holds fiche-specific data in `donneesSpecifiques` (JSONB) keyed by `ficheSpecifiqueType`
- **Patient** — Demographics linked to cases; unique `identifiant` used for deduplication check on declaration
- **MedecinDeclarant** — Declaring physician reference (nom, prenom, service); separate from the `User` model
- **Service** — Hospital department (service hospitalier); used by both `CasDeclare` and `InfectionIAS`
- **Germe** — Microorganism reference (bacteries, virus, parasites); linked to `ResultatLabo` and `InfectionIAS`
- **InfectionIAS** — UHH module: healthcare-associated infections; `typeIAS` enum: `PAVM | ISO | Autre`; `isBMR` flag for multi-drug-resistant bacteria
- **Investigation** — Launched from a case; tracks contacts via `Contact` model; `mesuresControle` and `zoneGeographique` as JSONB
- **Alerte** — Epidemic/threshold/informational alerts; thresholds defined in `SeuilAlerte`
- **Maladie** — Disease master list (CIM-10 codes, notification delays); `hasFicheSpecifique` flag links to `FicheSpecifiqueTemplate` via `ficheSpecifiqueSlug`
- **FicheSpecifiqueTemplate** — JSON schema for disease-specific forms (diphtérie, méningite, PFA, TIAC)
- **User** — Staff with role-based permissions; linked to `Etablissement` and `Wilaya`
- **Protocole** — Clinical protocol per disease; triggered via `ProtocoleDeclenchement` when a threshold is crossed
- **SeuilAlerte** — Alert threshold rules per disease + geographic scope (commune/wilaya/national)
- **Rapport** — Monthly/quarterly/annual reports stored as PDF/Excel
- **AuditLog** — Immutable activity log for compliance

Soft deletes on most reference models use `isActive: Boolean`. `CasDeclare` uses the `CasStatut` enum workflow (`brouillon → suspect → confirme`) rather than deletion.

### Disease-Specific Forms (Fiches Spécifiques)

Four diseases have extended forms beyond the standard declaration: diphtérie, méningite, PFA (poliomyélite), TIAC (toxi-infection alimentaire). Their TypeScript types live in `src/types/fiche-*.ts`. The `FicheSpecifiqueTemplate` model stores their JSON schema. `useFicheInit` hook handles hydrating form fields from saved `donneesSpecifiques` on edit. The renderer `src/components/declarations/fiche-dynamique-renderer.tsx` selects the correct form component based on `ficheSpecifiqueSlug`.

### Frontend Patterns

- React Server Components by default; add `"use client"` only when needed (forms, maps, charts)
- Forms use React Hook Form + Zod resolver; Zod schemas are defined inline in the component or its parent page
- No barrel files (`index.ts`) in `components/` — import each component directly
- Maps (Leaflet via `react-leaflet`) must be wrapped in `dynamic(..., { ssr: false })`
- Charts use Recharts (client-only)
- Toasts use `sonner`; animations use `framer-motion`
- Excel export uses `xlsx`; PDF export uses `jspdf` + `jspdf-autotable`; PDF capture uses `html2canvas`
- Path alias `@/` maps to `src/` — use it for all imports
- CSS design system in `src/app/globals.css` (CSS variables); primary brand color `#1B4F8A`
- Tailwind v4 with PostCSS plugin (`@tailwindcss/postcss`) — no `tailwind.config.js`

## Key Conventions

- **Dates:** ISO strings in DB, displayed as `DD/MM/YYYY` (French locale via `src/utils/format-date.ts`)
- **IDs:** All UUIDs generated server-side via `src/utils/generate-id.ts`
- **Imports:** Always use `@/` alias (e.g., `@/lib/prisma`, `@/types`)
- **JSON columns:** Flexible fields (`mesures_controle`, `zone_geographique`, `donnees_specifiques`, `evaluation_clinique`) use JSONB
- **UI language:** French throughout (labels, error messages, dates, disease names)

## OCR Microservice

`ocr-service/` is a separate Python/FastAPI service for scanning paper declaration forms. It runs as a Docker container (see `ocr-service/docker-compose.yml` and `ocr-service/Dockerfile`). It has its own `.env.example`. It is independent of the Next.js app and communicates over HTTP.
