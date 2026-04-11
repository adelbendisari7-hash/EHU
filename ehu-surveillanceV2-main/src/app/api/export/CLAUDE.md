# src/app/api/export/

Data export endpoint. Generates PDF or Excel files from filtered epidemiological data.

## Route: `GET /api/export`

### Query Parameters
- `format` — **required**: `pdf | excel`
- `type` — report type: `cas | analyses | investigation` (default: `analyses`)
- `date_from`, `date_to` — date range (required)
- `maladie_id`, `commune_id`, `wilaya_id`, `etablissement_id` — filters
- `age_min`, `age_max`, `sexe` — demographic filters
- `cas_id` — for single case export (type=cas)
- `investigation_id` — for single investigation report

### PDF Export
- Uses **jsPDF** + **jsPDF-AutoTable** for tabular data
- Uses **html2canvas** to capture chart images if `type=analyses`
- Report includes: header with EHU logo + report title + date range, data tables, charts, footer with generation timestamp and user name
- Patient names are replaced with identifiant_patient in all exports (pseudonymization)

### Excel Export
- Uses **SheetJS (xlsx)** library
- Generates a workbook with multiple sheets:
  - Sheet 1: Cases data (pseudonymized)
  - Sheet 2: Summary statistics
  - Sheet 3: By-disease breakdown
- Column headers in French

### Access
Épidémiologiste and admin only. Médecin role is blocked (return 403).

### Response
Returns binary file with appropriate Content-Type header:
- PDF: `Content-Type: application/pdf`
- Excel: `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
Both set `Content-Disposition: attachment; filename="rapport-ehu-{date}.{ext}"`
