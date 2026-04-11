// Skeleton building blocks — use for every loading state

export function Sk({ w = "100%", h = 16, rounded = 8 }: { w?: string | number; h?: number; rounded?: number }) {
  return (
    <div
      className="skeleton"
      style={{ width: w, height: h, borderRadius: rounded, flexShrink: 0 }}
    />
  )
}

export function StatCardSkeleton() {
  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-start justify-between">
        <Sk w="50%" h={10} />
        <Sk w={32} h={32} rounded={8} />
      </div>
      <Sk w="40%" h={28} rounded={6} />
      <Sk w="70%" h={10} />
    </div>
  )
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr className="border-b border-gray-50">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Sk h={14} w={i === 0 ? "70%" : i === cols - 1 ? "40%" : "85%"} />
        </td>
      ))}
    </tr>
  )
}

export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRowSkeleton key={i} cols={cols} />
      ))}
    </>
  )
}

export function CardSkeleton() {
  return (
    <div className="card p-4 space-y-2">
      <div className="flex items-center justify-between">
        <Sk w="40%" h={14} />
        <Sk w={60} h={22} rounded={12} />
      </div>
      <Sk w="70%" h={12} />
      <Sk w="50%" h={12} />
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map(i => <StatCardSkeleton key={i} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card p-5 space-y-3">
          <Sk w="30%" h={14} />
          <Sk w="100%" h={340} rounded={8} />
        </div>
        <div className="card p-5 space-y-3">
          <Sk w="50%" h={14} />
          <Sk w="100%" h={280} rounded={8} />
        </div>
      </div>
      <div className="card p-5 space-y-3">
        <Sk w="25%" h={14} />
        <Sk w="100%" h={260} rounded={8} />
      </div>
    </div>
  )
}

export function RapportListSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2, 3, 4].map(i => (
        <div key={i} className="card p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Sk w={40} h={40} rounded={10} />
            <div className="space-y-2">
              <Sk w={220} h={14} />
              <Sk w={160} h={11} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Sk w={70} h={26} rounded={20} />
            <Sk w={60} h={32} rounded={8} />
          </div>
        </div>
      ))}
    </div>
  )
}
