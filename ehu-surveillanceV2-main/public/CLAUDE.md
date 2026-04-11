# public/

Static assets served at the root URL path (`/`) by Next.js. Files placed here are accessible directly without any build processing.

## Contents
- `logo-ehu.svg` — EHU Oran official logo (used in sidebar, login page, and reports)
- `favicon.ico` — Browser tab favicon
- `images/` — Static images (logos, icons, backgrounds)

## Conventions
- Files here are served as-is — no imports needed; reference them as `/filename.ext` in JSX/CSS
- Keep file sizes small; use SVG for logos/icons, WebP for photos
- Do not place sensitive files here — everything in public/ is publicly accessible
- Versioning: append a hash or version suffix to filenames when updating assets to bust cache (e.g., `logo-ehu-v2.svg`)
