# public/images/

Static image assets served at `/images/filename`. Referenced in JSX as `<img src="/images/filename.ext" />` or via Next.js `<Image>` component with `src="/images/filename.ext"`.

## Intended Contents
- `logo-ehu-full.png` — Full EHU Oran logo with text (for login page header)
- `logo-ehu-icon.png` — Icon-only EHU logo (for collapsed sidebar)
- `map-placeholder.png` — Placeholder shown while Leaflet map loads
- `avatar-default.png` — Default user avatar
- `algeria-map.svg` — Static SVG outline of Algeria (fallback for map components)

## Conventions
- Prefer SVG for logos and icons (scalable, small file size)
- Use WebP format for photographs and backgrounds
- Use Next.js `<Image>` component for automatic optimization when displaying images inside the app
- Maximum recommended size: 500KB per image; compress before adding
