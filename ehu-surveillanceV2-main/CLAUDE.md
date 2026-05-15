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
Request → middleware.ts (JWT auth check) → app/api/*/route.ts → src/services/ → Prisma → PostgreSQL
```

### Routing Structure

- `src/app/(auth)/` — Public routes: login, forgot-password, reset-password
- `src/app/(dashboard)/` — Protected routes behind sidebar layout; one folder per feature
- `src/app/api/` — REST API handlers; collection at `[resource]/route.ts`, single item at `[resource]/[id]/route.ts`
- `middleware.ts` — Intercepts all requests; allows only `/login`, `/forgot-password`, `/reset-password` unauthenticated; uses `authjs.session-token` cookie (or `__Secure-` prefix on HTTPS)

### API Route Convention

Every route handler must follow this pattern:
1. `auth()` → 401 if unauthenticated
2. Check permissions → 403 if unauthorized
3. Validate body/params with Zod schema → 400 if invalid
4. Call service function (business logic never belongs in route handlers)
5. Write to `audit_logs` for any mutation
6. Return JSON with appropriate HTTP status

### Authentication & Roles

- NextAuth.js v5 (`next-auth@5.0.0-beta`) with CredentialsProvider, JWT strategy, 8-hour sessions
- Three roles: `medecin` (declare cases), `epidemiologiste` (investigate + analyze), `admin` (full access)
- Full RBAC via `Role`/`Permission`/`RolePermission`/`UserRole` models in DB
- JWT claims include: `userId`, `role`, `roles[]`, `permissions[]`, `etablissementId`, `wilayadId`
- Auth config in `src/lib/auth.ts`; exported `auth`, `signIn`, `signOut`, `handlers`

### Key Directories

| Path | Purpose |
|------|---------|
| `src/lib/auth.ts` | NextAuth configuration |
| `src/lib/prisma.ts` | Prisma Client singleton (prevents hot-reload duplication) |
| `src/lib/validators.ts` | All Zod schemas — single source of truth for validation |
| `src/services/` | Business logic layer called by API routes |
| `src/components/ui/` | shadcn/ui primitives (Radix UI) — do not edit manually |
| `src/components/shared/` | Reusable cross-feature components |
| `src/constants/` | App-wide enums and lookup tables (statuts, roles, reference data) |
| `prisma/schema.prisma` | Database schema (26 models) |
| `prisma/seed.ts` | Reference data seeder |

### Database Schema Key Models

- **CasDeclare** — Core case declaration; statut enum: `brouillon | suspect | confirme`; related: `CasSymptome`, `CasLieu` (up to 4 locations), `ResultatLabo`, `Fichier`
- **Patient** — Demographics linked to cases
- **Investigation** — Launched from a case; tracks contacts via `Contact` model
- **Alerte** — Epidemic/threshold/informational alerts; thresholds defined in `SeuilAlerte`
- **Maladie** — Disease master list (CIM-10 codes, notification delays); `hasFicheSpecifique` flag links to `FicheSpecifiqueTemplate`
- **User** — Staff with role-based permissions; linked to `Etablissement` and `Wilaya`
- **Protocole** — Clinical protocol per disease; triggered via `ProtocoleDeclenchement`
- **Rapport** — Monthly/quarterly/annual reports stored as PDF/Excel
- **AuditLog** — Immutable activity log for compliance

Soft deletes on most reference models use `isActive: Boolean`. `CasDeclare` uses the `CasStatut` enum workflow (`brouillon → suspect → confirme`) rather than deletion.

### Frontend Patterns

- React Server Components by default; add `"use client"` only when needed (forms, maps, charts)
- Forms use React Hook Form + Zod resolver; schemas imported from `src/lib/validators.ts`
- Maps (Leaflet via `react-leaflet`) must be wrapped in `dynamic(..., { ssr: false })`
- Charts use Recharts (client-only)
- Path alias `@/` maps to `src/` — use it for all imports
- CSS design system in `src/app/globals.css` (CSS variables); primary brand color `#1B4F8A`
- Tailwind v4 with PostCSS plugin (`@tailwindcss/postcss`) — no `tailwind.config.js`

## Key Conventions

- **Dates:** ISO strings in DB, displayed as `DD/MM/YYYY` (French locale via `src/utils/format-date.ts`)
- **IDs:** All UUIDs generated server-side via `src/utils/generate-id.ts`
- **Imports:** Always use `@/` alias (e.g., `@/lib/prisma`, `@/types`)
- **JSON columns:** Flexible fields (`mesures_controle`, `zone_geographique`, `donnees_specifiques`) use JSONB
- **UI language:** French throughout (labels, error messages, dates, disease names)

## OCR Microservice

`ocr-service/` is a separate Python/FastAPI service for scanning paper declaration forms. It runs as a Docker container (see `ocr-service/docker-compose.yml` and `ocr-service/Dockerfile`). It has its own `.env.example`. It is independent of the Next.js app and communicates over HTTP.
