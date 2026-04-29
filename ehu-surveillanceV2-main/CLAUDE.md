# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Next.js (App Router) + TypeScript epidemiological disease surveillance system for EHU Oran, Algeria. Tracks mandatory disease declarations (MDO), patient cases, epidemiological investigations, alerts, and generates reports.

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

# Database
npm run db:migrate    # Apply pending Prisma migrations
npm run db:seed       # Seed reference data (48 wilayas, 1541 communes, all MDO diseases)
npx prisma migrate dev --name <name>  # Create a new migration
npx prisma studio     # Open Prisma Studio
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
Request → middleware.ts (auth check) → app/api/*/route.ts → src/services/*.service.ts → Prisma → PostgreSQL
```

API routes never call Prisma directly — always through service functions in `src/services/`.

### Routing Structure

- `src/app/(auth)/` — Public routes: login, forgot-password, reset-password
- `src/app/(dashboard)/` — Protected routes behind sidebar layout
- `src/app/api/` — REST API handlers
- `src/middleware.ts` — Intercepts all requests; allows only `/login`, `/forgot-password`, `/reset-password` unauthenticated

### API Route Convention

Every route handler must follow this pattern:
1. `auth()` → 401 if unauthenticated
2. Check `session.user.permissions` (with DB fallback) → 403 if unauthorized
3. Validate body/params with Zod schema from `src/lib/validators.ts` → 400 if invalid
4. Call service function
5. Write to `audit_logs` for any mutation
6. Return JSON with appropriate HTTP status

### Service Layer

Business logic lives in `src/services/*.service.ts`. Services receive validated data, apply domain rules (e.g., alert threshold evaluation), and return typed results. Never put business logic in route handlers.

### Authentication & Roles

- NextAuth.js v5 with CredentialsProvider, JWT strategy, 8-hour sessions
- Roles: `medecin` (declare cases), `epidemiologiste` (investigate + analyze), `admin` (full access)
- JWT claims include: `userId`, `role`, `roles[]`, `permissions[]`, `etablissementId`, `wilayadId`
- Password reset uses 32-byte hex token → SHA-256 hash stored in DB, 1-hour expiry

### Key Directories

| Path | Purpose |
|------|---------|
| `src/lib/validators.ts` | All Zod schemas — single source of truth for validation |
| `src/lib/auth.ts` | NextAuth configuration |
| `src/lib/prisma.ts` | Prisma Client singleton |
| `src/services/` | Business logic layer |
| `src/components/ui/` | shadcn/ui primitives (Radix UI) |
| `src/components/shared/` | Reusable cross-feature components |
| `prisma/schema.prisma` | Database schema (26 models) |
| `prisma/seed.ts` | Reference data seeder |

### Database Schema Key Models

- **CasDeclare** — Core case declaration with MDO fields (symptoms, location, hospitalization, lab results)
- **Patient** — Demographics and location (linked to CasDeclare)
- **Investigation** — Launched from a case; tracks contacts, timeline, source hypothesis
- **Alerte** — Epidemic/threshold/informational alerts; evaluated via `SeuilAlerte` thresholds
- **Maladie** — Disease master list (CIM-10 codes, notification delays, alert thresholds)
- **User** — Staff with role-based permissions; linked to Etablissement and Wilaya
- **Rapport** — Monthly/quarterly/annual reports stored as PDF/Excel in S3
- **AuditLog** — Immutable activity log for compliance

Soft deletes use `is_active: Boolean` — never hard-delete records.

### Frontend Patterns

- React Server Components by default; add `"use client"` only when needed (forms, maps, charts)
- Forms use React Hook Form + Zod resolver; schemas imported from `src/lib/validators.ts`
- Maps (Leaflet) and charts (Recharts) are always client components
- Path alias `@/` maps to `src/` — use it for all imports
- CSS design system in `src/app/globals.css` (CSS variables); primary brand color `#1B4F8A`

## Key Conventions

- **Dates:** ISO strings in DB, displayed as `DD/MM/YYYY` (French locale via `src/utils/format-date.ts`)
- **IDs:** All UUIDs generated via `src/utils/generate-id.ts`
- **Imports:** Always use `@/` alias (e.g., `@/lib/prisma`, `@/types`)
- **JSON columns:** Flexible fields (`mesures_controle`, `zone_geographique`) use JSONB
- **UI language:** French throughout (labels, error messages, dates)
- **Tailwind:** Version 4 with PostCSS plugin (`@tailwindcss/postcss`) — not the classic CLI
