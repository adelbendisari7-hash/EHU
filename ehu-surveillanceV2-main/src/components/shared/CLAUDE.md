# src/components/shared/

Generic reusable utility components used across multiple features. These components have no domain-specific logic.

## Components

### `loading-spinner.tsx`
Centered animated spinner for loading states.
Props: `size` (sm/md/lg), `className`.
Uses a CSS animation or shadcn/ui loader. Shown in `loading.tsx` files and Suspense fallbacks.

### `empty-state.tsx`
Empty state display for lists/tables with no data.
Props: `icon` (Lucide icon), `title` (string), `description` (string), `action` (optional button label + onClick).
Example: "Aucune déclaration trouvée" with a "Nouvelle déclaration" button.

### `confirm-dialog.tsx` ("use client")
Reusable confirmation dialog for destructive actions.
Props: `open`, `onOpenChange`, `title`, `description`, `confirmLabel` (default: "Confirmer"), `onConfirm`, `loading`, `variant` (default/destructive).
Built on shadcn/ui `AlertDialog`.
Used for: deleting cases, deactivating users, archiving alerts.

### `file-upload.tsx` ("use client")
Drag-and-drop file upload component.
Props: `onUpload` (callback with file URL), `accept` (MIME types), `maxSize` (bytes), `multiple`.
On file drop/select: calls `POST /api/fichiers/upload`.
Shows upload progress bar, file name, and size.
Displays error if file type or size is invalid.

### `date-range-picker.tsx` ("use client")
Date range picker for filter forms.
Props: `from`, `to`, `onChange`. Uses shadcn/ui `Popover` + `Calendar`.

### `export-button.tsx` ("use client")
Split button: "Exporter PDF" / "Exporter Excel".
Props: `onExportPdf`, `onExportExcel`, `loading`.
Shows a loading spinner while export is generating.

### `pagination.tsx`
Pagination controls component.
Props: `currentPage`, `totalPages`, `onPageChange`.
Shows: Previous, page numbers (with ellipsis), Next buttons.
