# src/app/api/fichiers/upload/

File upload endpoint. Accepts multipart/form-data and stores files in AWS S3 or Cloudflare R2.

## Route: `POST /api/fichiers/upload`

### Request
Content-Type: `multipart/form-data`

Form fields:
- `file` — the file binary (required)
- `cas_id` — UUID of the linked case (required; or `investigation_id`)
- `investigation_id` — UUID of the linked investigation (optional alternative to cas_id)
- `description` — optional text description of the file

### Constraints
- **Maximum file size**: 10MB (enforced server-side; return 413 if exceeded)
- **Allowed MIME types**: `application/pdf`, `image/jpeg`, `image/png`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- Filename is sanitized before storage (remove special characters, spaces → underscores)

### Upload Logic
1. Validate file size and MIME type
2. Generate a unique S3 key: `fichiers/{cas_id}/{uuid}-{sanitized_filename}`
3. Upload to S3/R2 using the AWS SDK client from `@/lib/s3`
4. Store metadata in the `fichiers` database table
5. Return the file URL and metadata

### Response
```json
{
  "data": {
    "id": "uuid",
    "url": "https://...",
    "nom_original": "resultat-labo.pdf",
    "taille": 245678
  }
}
```

### Environment Variables Required
- `S3_BUCKET_NAME`
- `S3_REGION` (or `R2_ACCOUNT_ID` for Cloudflare R2)
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`
