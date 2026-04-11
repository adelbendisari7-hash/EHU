"use client"

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

interface DiseaseData { name: string; count: number }

export default function DiseaseDistribution({ data }: { data: DiseaseData[] }) {
  if (!data.length) {
    return (
      <div className="h-[280px] flex items-center justify-center">
        <p className="text-xs text-gray-400">Aucune donnée disponible</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
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
          tick={{ fontSize: 11, fill: "#4B5563", fontWeight: 500 }}
          tickLine={false}
          axisLine={false}
          width={110}
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
          cursor={{ fill: "rgba(27, 79, 138, 0.04)" }}
        />
        <Bar
          dataKey="count"
          fill="#1B4F8A"
          radius={[0, 4, 4, 0]}
          barSize={18}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
