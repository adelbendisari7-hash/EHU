# src/lib/

Core singleton utilities and third-party client initialization. Files here are imported across the entire application.

## Files

### `prisma.ts`
Prisma Client singleton. Prevents multiple Prisma instances in development (Next.js hot reload issue).
```ts
import { PrismaClient } from '@prisma/client'
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
export const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```
Import: `import { prisma } from '@/lib/prisma'`

### `auth.ts`
NextAuth.js v5 configuration object (`authOptions`). Exported and used in both `src/app/api/auth/[...nextauth]/route.ts` and `getServerSession(authOptions)` calls throughout the app.
Configures: CredentialsProvider, JWT strategy, session callbacks, custom JWT claims.

### `s3.ts`
AWS S3 / Cloudflare R2 client singleton.
Exports: `s3Client` (S3Client instance), `uploadFile(key, body, contentType)`, `deleteFile(key)`, `getSignedUrl(key, expiresIn)`.
Uses `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`.

### `email.ts`
Resend email client and email-sending functions.
Exports: `sendEmail(to, subject, html)`, `sendWelcomeEmail(user)`, `sendAlertEmail(alert, recipients)`, `sendPasswordResetEmail(user, token)`.

### `validators.ts`
All shared Zod schemas reused across API route handlers and React Hook Form resolvers.
Exports: `loginSchema`, `createCasSchema`, `updateCasSchema`, `createContactSchema`, `createUserSchema`, `updateUserSchema`, `createAlerteSchema`, `dateRangeSchema`, etc.
Single source of truth for validation rules — avoids schema duplication between server and client.

### `logger.ts`
Structured logging utility. Wraps `console` in development, sends to a logging service (e.g., Axiom, Logtail) in production.
Exports: `logger.info()`, `logger.warn()`, `logger.error()`, `logger.audit()`.
`logger.audit()` writes to the `audit_logs` database table.
