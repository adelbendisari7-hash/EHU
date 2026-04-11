# src/components/investigations/

Epidemiological investigation components. Used on the investigation pages.

## Components

### `investigation-map.tsx` ("use client")
Leaflet map for the investigation screen. Must be dynamically imported with `{ ssr: false }`.

Features:
- Index case marker (red pin) at the case's commune coordinates
- Contact markers (orange pins) for all identified contacts
- Editable polygon tool (Leaflet.Draw) to define `zone_geographique`
- Layer controls to toggle contacts/zone visibility
- Map click handler to add new contact location

### `contact-tracing-form.tsx` ("use client")
Form to add a new contact to the investigation.
Fields: nom, prénom, âge, sexe, type_contact (select), date_dernier_contact (date picker), téléphone, adresse, notes.
Submits to `POST /api/investigations/:id/contacts`.

### `contact-list.tsx` ("use client")
Table of all contacts for the investigation.
Columns: nom complet, type contact, date dernier contact, statut badge, actions.
Status badge colors: a_contacter (gray), contacte (blue), sous_surveillance (amber), libere (green).
Inline status update: clicking the status badge opens a select dropdown.

### `mesures-controle.tsx` ("use client")
Interactive checklist of epidemic control measures.
Each measure: checkbox + label + optional notes field when checked.
Data stored as JSONB in `investigations.mesures_controle`.
Saves automatically on checkbox change (debounced PATCH to API).

### `investigation-timeline.tsx`
Read-only chronological timeline of investigation events.
Events: opened, contact added, status changed, measure checked, closed.
Visual timeline with timestamps and user attribution.
