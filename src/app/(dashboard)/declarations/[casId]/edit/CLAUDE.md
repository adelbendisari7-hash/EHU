# src/app/(dashboard)/declarations/[casId]/edit/

Edit form for an existing case declaration. Served at `/declarations/:casId/edit`.

## Access Control
- **Médecin**: can edit own cases only (cases where `declared_by === session.userId`)
- **Épidémiologiste**: can edit any case
- **Admin**: can edit any case
- Unauthorized access redirects to the case detail page with an error toast

## Form Structure
Same 3-section structure as the new declaration form, but:
- All fields pre-filled with existing case data
- Patient fields (Section A) are read-only if the patient already has other cases (to prevent data inconsistency)
- Status field is editable (shows full workflow options based on current status)

## Behavior
- Data loaded server-side via `GET /api/cas/:casId`
- On submit: `PATCH /api/cas/:casId` with only the changed fields (partial update)
- On success: redirect to `/declarations/:casId` with a success toast
- On cancel: redirect back to `/declarations/:casId` without changes

## Validation
- Uses the same Zod schema as the new form (`updateCasSchema` from `@/lib/validators`) but with all fields optional (partial update)
- Server-side re-validation in the API route handler
