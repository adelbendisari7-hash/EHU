# src/utils/

Pure utility functions with no side effects and no imports from application code (no Prisma, no services, no components). Safe to import in both Server and Client Components.

## Files

### `format-date.ts`
Date formatting utilities using the French (Algeria) locale.

```ts
// Format a date or ISO string as DD/MM/YYYY
export function formatDate(date: Date | string): string

// Format as relative time: "il y a 5 minutes", "hier", "le 12/03/2024"
export function formatRelativeDate(date: Date | string): string

// Format date range: "Du 01/03/2024 au 15/03/2024"
export function formatDateRange(from: Date | string, to: Date | string): string

// Parse DD/MM/YYYY string to Date object
export function parseFrenchDate(str: string): Date
```

Locale: `fr-DZ` (French Algeria). Uses `Intl.DateTimeFormat` for formatting.

### `calculate-age.ts`
Calculate a person's age from their date of birth.

```ts
// Returns integer age in years
export function calculateAge(dateOfBirth: Date | string): number

// Returns age group string: "0-9", "10-19", ..., "80+"
export function getAgeGroup(dateOfBirth: Date | string): string
```

### `generate-id.ts`
Generate the patient identifiant in YYYYMMDD-XXXX format.

```ts
// Generate the date portion: "20240315"
export function getDatePrefix(): string

// Generate a full identifiant (client-side preview; server confirms final)
// counter is the daily sequential number (1-based)
export function generatePatientId(date: Date, counter: number): string
// Example: generatePatientId(new Date('2024-03-15'), 42) → "20240315-0042"
```

### `cn.ts`
Tailwind CSS class merging utility (standard shadcn/ui pattern).

```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
```

Used throughout components for conditional class application.
