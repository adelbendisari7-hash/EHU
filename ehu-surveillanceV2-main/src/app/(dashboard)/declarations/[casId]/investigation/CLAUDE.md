# src/app/(dashboard)/declarations/[casId]/investigation/

Epidemiological investigation page for a specific case. Served at `/declarations/:casId/investigation`. Accessible by épidémiologiste and admin roles only.

## Displayed Content

### Interactive Map (Leaflet)
- Shows the case index location as a primary marker
- Plots all identified contacts as secondary markers
- Draws a geographic zone polygon (editable by épidémiologiste)
- Dynamic import with `{ ssr: false }` required

### Contact Tracing
- Form to add new contacts (nom, prénom, date dernier contact, type contact: familial/professionnel/communautaire)
- Contacts list table showing all contacts with current follow-up status
- Status workflow per contact: `a_contacter` → `contacte` → `sous_surveillance` → `libere`

### Control Measures Checklist
- Predefined checklist of public health control measures (isolation, vaccination, désinfection, etc.)
- Stored as JSONB in `investigations.mesures_controle`

### Investigation Timeline
- Chronological log of all actions taken during the investigation
- Includes: status changes, contact additions, measure updates

## Actions
- **Export to PDF**: generates a full investigation report PDF using jsPDF
- **Close investigation**: changes status to `terminee`, requires conclusion text

## Data Sources
- `GET /api/investigations?casId=:casId` — fetches the linked investigation
- `GET /api/investigations/:id/contacts` — fetches contact list
