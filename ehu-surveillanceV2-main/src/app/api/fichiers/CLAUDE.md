# src/app/api/fichiers/

File management API. Handles file uploads and metadata storage for documents attached to cases and investigations.

## Sub-Routes
- `upload/` — File upload endpoint (POST to S3/R2)

## Routes

### `GET /api/fichiers`
Returns list of files attached to a specific case or investigation.

Query parameters:
- `cas_id` — get files for a specific case (required; one of cas_id or investigation_id)
- `investigation_id` — get files for a specific investigation

Response fields per file:
- `id` (UUID)
- `nom_original` — original filename as uploaded
- `type_fichier` — MIME type
- `taille` — file size in bytes
- `url` — public or signed URL for download
- `uploaded_by` — user who uploaded (nom complet)
- `created_at`

Access: authenticated users can view files for cases they have access to.

### `DELETE /api/fichiers/:id`
Deletes a file: removes from S3/R2 and deletes the database record.
Access: the uploader or admin only.
