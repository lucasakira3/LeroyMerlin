import { MapPin } from 'lucide-react'

interface CorridorBadgeProps {
  corredor: string
  large?: boolean
}

export default function CorridorBadge({ corredor, large = false }: CorridorBadgeProps) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-lg border border-lm-green bg-lm-green/10 text-lm-green font-bold ${
        large ? 'px-5 py-3 text-lg' : 'px-3 py-2 text-sm'
      }`}
    >
      <MapPin size={large ? 22 : 16} strokeWidth={2.5} />
      <span>{corredor}</span>
    </div>
  )
}
