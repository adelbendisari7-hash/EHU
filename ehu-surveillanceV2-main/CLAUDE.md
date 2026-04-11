# EHU Oran — Système de Surveillance Épidémiologique

Next.js 14 + TypeScript + Tailwind CSS + Prisma + PostgreSQL application for epidemiological disease surveillance at EHU Oran, Algeria.

## Stack
- Framework: Next.js 14 (App Router)
- Language: TypeScript
- Styling: Tailwind CSS + shadcn/ui
- ORM: Prisma + PostgreSQL (Supabase/Neon)
- Auth: NextAuth.js v5 (JWT + RBAC)
- Maps: Leaflet.js + React-Leaflet
- Charts: Recharts
- Forms: React Hook Form + Zod
- Storage: AWS S3 / Cloudflare R2
- Email: Resend
- Hosting: Vercel + Railway

## Roles
- `medecin` — declares cases, views own cases
- `epidemiologiste` — investigates, analyzes, manages alerts
- `admin` — full access, user management, configuration

## Key Conventions
- All API routes validate input with Zod server-side
- RBAC middleware protects every API route
- All IDs are UUIDs
- Dates stored as ISO strings; displayed in DD/MM/YYYY (French locale)
- Primary color: #1B4F8A (EHU Blue)
