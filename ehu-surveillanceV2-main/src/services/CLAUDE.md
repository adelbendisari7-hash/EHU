# src/services/

Business logic layer between API route handlers and the Prisma ORM. Services are plain async functions (not classes) organized by domain.

## Design Principles
- API routes call service functions — they never call Prisma directly
- Services call Prisma and enforce business rules
- Services can call other services (e.g., `cas-service` calls `alerte-service`)
- Services can send notifications (via `notification-service`)
- Services are server-side only (never imported in Client Components)

## Service Files

### `cas-service.ts`
- `getCas(filters, userId, role)` — paginated list with RBAC filtering
- `getCasById(casId, userId, role)` — single case with access check
- `createCas(data, userId)` — creates patient (if new) + case, triggers threshold check
- `updateCas(casId, data, userId, role)` — partial update with status workflow validation
- `deleteCas(casId)` — cascade delete

### `patient-service.ts`
- `searchPatients(query)` — deduplication search
- `findOrCreatePatient(data)` — used by createCas

### `investigation-service.ts`
- `getInvestigations(filters)` — list with filters
- `createInvestigation(data, userId)` — creates investigation, validates 1:1 constraint
- `updateInvestigation(id, data, userId, role)` — partial update with conclusion validation
- `addContact(investigationId, data)` — adds a contact
- `updateContact(contactId, data)` — updates contact status

### `alerte-service.ts`
- `checkThresholds(casId)` — called after case creation/confirmation; auto-creates alerts if thresholds exceeded
- `createAlerte(data, userId)` — manual alert creation with notification dispatch
- `resolveAlerte(id, note, userId)` — sets resolved_at, notifies

### `user-service.ts`
- `getUsers(filters)` — admin user list
- `createUser(data)` — bcrypt hash + create + welcome email
- `updateUser(id, data, requesterId)` — with role-change authorization check

### `stats-service.ts`
- `getDashboardStats(filters)` — aggregated dashboard data
- `getAnalysesStats(filters)` — advanced analytics aggregations

### `notification-service.ts`
- `notifyUsers(userIds, notification)` — bulk insert into notifications table
- `notifyByRole(roles, notification)` — notify all users with given roles
- `notifyAlert(alerte)` — sends in-app + email notification for new alerts

### `export-service.ts`
- `exportToPdf(filters, type)` — generates PDF buffer
- `exportToExcel(filters, type)` — generates Excel buffer
