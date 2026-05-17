# src/components/auth/

Authentication UI components used on the login and auth pages.

## Components

### `login-form.tsx` ("use client")
The main login form component. Contains all form fields and submission logic.

Fields:
1. Établissement select (populated via fetch to `/api/etablissements`)
2. Email input
3. Password input with show/hide toggle
4. Role radio group (`RoleSelector` sub-component)
5. Submit button (full-width, primary color)

Logic:
- Uses `react-hook-form` with `zodResolver` and `loginSchema`
- On submit: calls NextAuth `signIn('credentials', {...})`
- Displays inline error on invalid credentials
- Shows loading spinner on the button during submission
- "Mot de passe oublié ?" link at the bottom

### `role-selector.tsx` ("use client")
A styled radio group for selecting the user role.

Roles displayed as clickable cards with icons:
- **Médecin** — stethoscope icon
- **Épidémiologiste** — microscope icon
- **Administrateur** — shield icon

Each card highlights in `#1B4F8A` when selected. Built using shadcn/ui `RadioGroup` + custom styling.

## Usage
```tsx
import { LoginForm } from '@/components/auth/login-form'
// Used in src/app/(auth)/login/page.tsx
```
