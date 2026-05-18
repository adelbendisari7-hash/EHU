"use client"

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts"

interface DiseaseData { name: string; count: number }

// Custom tick that wraps long names onto two lines
function CustomTick({ x, y, payload, width }: { x?: number | string; y?: number | string; payload?: { value: string }; width?: number }) {
  const name: string = payload?.value ?? ""
  const maxW = (width ?? 160) - 4
  const words = name.split(" ")
  const lines: string[] = []
  let current = ""
  for (const word of words) {
    const test = current ? `${current} ${word}` : word
    if (test.length * 6.5 > maxW && current) {
      lines.push(current)
      current = word
    } else {
      current = test
    }
  }
  if (current) lines.push(current)
  const lineH = 13
  const totalH = lines.length * lineH
  return (
    <g transform={`translate(${x},${y})`}>
      {lines.map((line, i) => (
        <text
          key={i}
          x={-6}
          y={-totalH / 2 + i * lineH + lineH * 0.75}
          textAnchor="end"
          fill="#4B5563"
          fontSize={11}
          fontWeight={500}
        >
          {line}
        </text>
      ))}
    </g>
  )
}

export default function DiseaseDistribution({ data, total }: { data: DiseaseData[]; total?: number }) {
  if (!data.length) {
    return (
      <div className="h-[280px] flex items-center justify-center">
        <p className="text-xs text-gray-400">Aucune donnée disponible</p>
      </div>
    )
  }

  const computedTotal = total ?? data.reduce((s, d) => s + d.count, 0)
  const maxNameLen = data.reduce((m, d) => Math.max(m, d.name.length), 0)
  const labelWidth = Math.min(Math.max(Math.ceil(maxNameLen * 6.5), 110), 180)
  const rowHeight = 44
  const chartHeight = Math.max(280, data.length * rowHeight)

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 64, left: 0, bottom: 4 }}>
        <XAxis
          type="number"
          tick={{ fontSize: 10, fill: "#9CA3AF", fontWeight: 500 }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={(props) => <CustomTick {...props} width={labelWidth} />}
          tickLine={false}
          axisLine={false}
          width={labelWidth}
        />
        <Tooltip
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid #E5E7EB",
            fontSize: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            padding: "8px 12px",
          }}
          formatter={(value) => {
            const v = typeof value === "number" ? value : 0
            const pct = computedTotal > 0 ? Math.round((v / computedTotal) * 100) : 0
            return [`${v} cas (${pct}%)`, ""]
          }}
          cursor={{ fill: "rgba(27, 79, 138, 0.04)" }}
        />
        <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
          {data.map((_, i) => (
            <Cell key={i} fill={i === 0 ? "#1B4F8A" : i === 1 ? "#2563EB" : "#3B82F6"} />
          ))}
          <LabelList
            dataKey="count"
            position="right"
            formatter={(value) => {
              const v = typeof value === "number" ? value : 0
              const pct = computedTotal > 0 ? Math.round((v / computedTotal) * 100) : 0
              return `${pct}%`
            }}
            style={{ fontSize: 11, fill: "#6B7280", fontWeight: 600 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
