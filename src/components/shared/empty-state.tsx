import { FileX } from "lucide-react"

interface Props {
  title?: string
  description?: string
  icon?: React.ElementType
  action?: {
    label: string
    onClick: () => void
  }
}

export default function EmptyState({
  title = "Aucune donnée",
  description = "Il n'y a rien à afficher pour le moment.",
  icon: Icon = FileX,
  action,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
        <Icon size={20} className="text-gray-400" />
      </div>
      <p className="text-[13px] font-medium text-gray-600">{title}</p>
      <p className="text-[12px] text-gray-400 mt-1 max-w-xs">{description}</p>
      {action && (
        <button onClick={action.onClick} className="btn btn-secondary btn-sm mt-4">
          {action.label}
        </button>
      )}
    </div>
  )
}
