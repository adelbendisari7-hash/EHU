# src/app/api/investigations/[id]/contacts/

Contact tracing sub-resource for a specific investigation. Contacts are people who had exposure to the index case.

## Routes

### `GET /api/investigations/:id/contacts`
Returns all contacts for the investigation, ordered by `date_dernier_contact` descending.

Each contact includes:
- nom, prénom, age, sexe
- type_contact: `familial | professionnel | communautaire`
- date_dernier_contact
- statut: current follow-up status
- notes

Access: épidémiologiste and admin.

### `POST /api/investigations/:id/contacts`
Adds a new contact to the investigation.

Body (validated with `createContactSchema`):
```json
{
  "nom": "string",
  "prenom": "string",
  "age": "number",
  "sexe": "M | F",
  "type_contact": "familial | professionnel | communautaire",
  "date_dernier_contact": "ISO date string",
  "telephone": "string (optional)",
  "adresse": "string (optional)",
  "notes": "string (optional)"
}
```

Initial status set to `a_contacter`.

### `PATCH /api/investigations/:id/contacts/:contactId`
Updates a contact's follow-up status or notes.

Status workflow: `a_contacter → contacte → sous_surveillance → libere`

Access: épidémiologiste and admin.

### `DELETE /api/investigations/:id/contacts/:contactId`
Removes a contact from the investigation. Épidémiologiste and admin only.
