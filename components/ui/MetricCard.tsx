import { CSSProperties } from 'react'
import { type LucideIcon } from 'lucide-react'
import Card from './Card'

interface MetricCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  // Cor de fundo do quadrado do ícone (classe do Tailwind, ex.: 'bg-blue-500').
  iconClassName?: string
  hoverable?: boolean
  className?: string
  style?: CSSProperties
}

// Cartão de número-resumo do painel do funcionário (Dashboard, Pedidos). Um componente só
// pra todas as telas usarem a mesma régua. `h-full` + altura mínima deixam os cartões de uma
// mesma fileira iguais mesmo quando o rótulo de um quebra em duas linhas e o do outro não.
export default function MetricCard({
  label,
  value,
  icon: Icon,
  iconClassName = 'bg-lm-green',
  hoverable = false,
  className = '',
  style,
}: MetricCardProps) {
  return (
    <Card
      padding="sm"
      hoverable={hoverable}
      className={`h-full min-h-[5.5rem] flex items-center gap-3 ${className}`}
      style={style}
    >
      <span className={`w-12 h-12 rounded-xl text-white flex items-center justify-center flex-shrink-0 shadow-soft ${iconClassName}`}>
        <Icon size={24} />
      </span>
      <span className="min-w-0">
        <span className="block text-3xl font-bold text-gray-900 leading-tight">{value}</span>
        <span className="block text-sm text-gray-700">{label}</span>
      </span>
    </Card>
  )
}
