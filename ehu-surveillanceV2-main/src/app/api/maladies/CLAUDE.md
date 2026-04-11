# src/app/api/maladies/

Notifiable diseases (maladies à déclaration obligatoire — MDO) reference data API.

## Routes

### `GET /api/maladies`
Returns the full list of MDO diseases.

Response fields per disease:
- `id` (UUID)
- `nom` (French name)
- `code_mdo` (e.g., MDO-001)
- `categorie` (respiratoire, digestive, vectorielle, zoonotique, sexuellement_transmissible, neurologique, autre)
- `seuil_alerte` (number of cases to trigger automatic alert)
- `is_active` (boolean)

Query parameters:
- `is_active` — filter active/inactive (`true` by default for dropdown usage)
- `categorie` — filter by category

Access: all authenticated roles. Used in case declaration form dropdowns.

### `POST /api/maladies` (admin only)
Creates a new notifiable disease.

### `PATCH /api/maladies/:id` (admin only)
Updates a disease (nom, code_mdo, categorie, seuil_alerte, is_active).

### `DELETE /api/maladies/:id` (admin only)
Soft delete: sets `is_active = false`. Hard delete blocked if disease has linked cases.

## Caching
`export const revalidate = 3600` — cached for 1 hour.
On any admin mutation, call `revalidateTag('maladies')` to bust the cache.
