# src/

All application source code for the EHU surveillance system.

## Directory Overview
- `app/` — Next.js 14 App Router: pages, layouts, route groups, and API route handlers
- `components/` — React components organized by feature domain
- `hooks/` — Custom React hooks for data fetching and shared stateful logic
- `lib/` — Singleton utility instances and third-party client initialization
- `services/` — Business logic layer between API routes and the database
- `types/` — TypeScript type definitions mirroring the Prisma schema
- `constants/` — Static enums, configuration values, and seed data references
- `utils/` — Pure utility functions with no side effects

## Path Aliases
All imports use the `@/` alias pointing to `src/`:
```ts
import { prisma } from '@/lib/prisma'
import type { Cas } from '@/types'
import { formatDate } from '@/utils/format-date'
```

## Key Rules
- React Server Components are the default in `app/` — add `"use client"` only when hooks or browser APIs are needed
- All business logic lives in `services/`, not inline in API routes
- All shared Zod schemas live in `lib/validators.ts`
- No barrel files (`index.ts`) in components/ — import each component directly
