import { Leaf } from 'lucide-react'
import type { SustentabilidadeScore } from '@/types/produto'

interface SustainabilityBadgeProps {
  sustentabilidade: SustentabilidadeScore
}

const badgeConfig: Record<
  Exclude<SustentabilidadeScore, 'N/A'>,
  { bg: string; text: string; border: string }
> = {
  Bronze: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-300' },
  Prata: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-400' },
  Ouro: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-400' },
}

export default function SustainabilityBadge({ sustentabilidade }: SustainabilityBadgeProps) {
  if (sustentabilidade === 'N/A') return null

  const config = badgeConfig[sustentabilidade]

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-xs font-medium ${config.bg} ${config.text} ${config.border}`}
    >
      <Leaf size={11} />
      {sustentabilidade}
    </span>
  )
}
