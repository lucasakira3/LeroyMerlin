import { Leaf } from 'lucide-react'
import Badge from './ui/Badge'
import type { SustentabilidadeScore } from '@/types/produto'

interface SustainabilityBadgeProps {
  sustentabilidade: SustentabilidadeScore
}

const toneConfig: Record<Exclude<SustentabilidadeScore, 'N/A'>, 'orange' | 'gray' | 'yellow'> = {
  Bronze: 'orange',
  Prata: 'gray',
  Ouro: 'yellow',
}

export default function SustainabilityBadge({ sustentabilidade }: SustainabilityBadgeProps) {
  if (sustentabilidade === 'N/A') return null

  return (
    <Badge tone={toneConfig[sustentabilidade]}>
      <Leaf size={11} />
      {sustentabilidade}
    </Badge>
  )
}
