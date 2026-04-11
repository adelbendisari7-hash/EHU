# src/components/charts/

Reusable Recharts wrapper components. All components are Client Components (`"use client"`) as Recharts uses browser APIs and React hooks.

## Brand Colors
```ts
const COLORS = {
  primary:  '#1B4F8A', // EHU Blue
  red:      '#E74C3C',
  green:    '#27AE60',
  amber:    '#F39C12',
  purple:   '#8E44AD',
  gray:     '#95A5A6',
}
```

## Components

### `line-chart.tsx` ("use client")
Wraps Recharts `LineChart` with `ResponsiveContainer`.
Props: `data` (array of objects), `lines` (array of `{ dataKey, color, label }`), `xKey` (string), `height` (default 300).
Includes: `CartesianGrid`, `XAxis`, `YAxis`, `Tooltip`, `Legend`.

### `bar-chart.tsx` ("use client")
Wraps Recharts `BarChart` with `ResponsiveContainer`.
Props: `data`, `bars` (array of `{ dataKey, color, label }`), `xKey`, `layout` (`vertical | horizontal`, default horizontal), `height`.
Includes: `CartesianGrid`, `XAxis`, `YAxis`, `Tooltip`, `Legend`.

### `pie-chart.tsx` ("use client")
Wraps Recharts `PieChart`. Used for disease distribution percentage breakdown.
Props: `data` (array of `{ name, value, color }`), `height` (default 300).
Includes: `Pie`, `Tooltip`, `Legend`, `Cell` per slice.

### `heatmap-chart.tsx` ("use client")
Custom heatmap (not native Recharts — built with a CSS grid or D3-inspired approach).
Used for temporal analysis by weekday × hour or by week × disease.
Props: `data` (2D matrix), `xLabels`, `yLabels`, `colorScale`.

## Conventions
- All charts wrapped in `ResponsiveContainer` with `width="100%"` and a fixed `height`
- French number formatting: use `Intl.NumberFormat('fr-DZ')` in Tooltip formatters
- Empty state: if `data` is empty or all zeros, render an `EmptyState` component instead of a blank chart
