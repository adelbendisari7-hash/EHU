"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts"

interface DataPoint { date: string; count: number }

export default function EpidemicCurve({ data }: { data: DataPoint[] }) {
  const formatted = data.map(d => ({
    ...d,
    label: new Date(d.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
  }))

  if (!data.length) {
    return (
      <div className="h-[260px] flex items-center justify-center">
        <p className="text-xs text-gray-400">Aucune donnée pour cette période</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={formatted} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1B4F8A" stopOpacity={0.12} />
            <stop offset="100%" stopColor="#1B4F8A" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F3F5" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: "#9CA3AF", fontWeight: 500 }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 10, fill: "#9CA3AF", fontWeight: 500 }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid #E5E7EB",
            fontSize: "12px",
            boxShadow: "var(--shadow-md)",
            padding: "8px 12px",
          }}
          formatter={(value) => [value, "Cas"]}
          labelFormatter={(label) => `Date: ${label}`}
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke="#1B4F8A"
          strokeWidth={2}
          fill="url(#curveGradient)"
          dot={false}
          activeDot={{ r: 4, fill: "#1B4F8A", stroke: "#fff", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
