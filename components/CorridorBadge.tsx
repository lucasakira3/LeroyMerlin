import { MapPin } from 'lucide-react'
import Badge from './ui/Badge'

interface CorridorBadgeProps {
  corredor: string
  large?: boolean
}

export default function CorridorBadge({ corredor, large = false }: CorridorBadgeProps) {
  return (
    <Badge
      tone="green"
      className={`gap-2 font-bold ${large ? 'px-5 py-3 text-lg' : 'px-3 py-2 text-sm'}`}
    >
      <MapPin size={large ? 22 : 16} strokeWidth={2.5} />
      <span>{corredor}</span>
    </Badge>
  )
}
