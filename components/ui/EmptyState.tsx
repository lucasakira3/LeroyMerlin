import { type LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  tone?: 'green' | 'gray'
  size?: 'sm' | 'md'
}

const toneClasses: Record<NonNullable<EmptyStateProps['tone']>, string> = {
  green: 'bg-lm-green/10 text-lm-green',
  gray: 'bg-gray-100 dark:bg-gray-700 text-gray-400',
}

const sizeClasses: Record<NonNullable<EmptyStateProps['size']>, { wrap: string; circle: string; icon: number }> = {
  sm: { wrap: 'py-10', circle: 'w-12 h-12', icon: 22 },
  md: { wrap: 'py-16', circle: 'w-20 h-20', icon: 30 },
}

// Tratamento visual padrão pra "nada aqui" no painel do funcionário (busca sem resultado,
// fila vazia, etc.) — antes cada tela tinha só um texto cinza solto, sem nenhum ícone.
export default function EmptyState({ icon: Icon, title, description, tone = 'gray', size = 'sm' }: EmptyStateProps) {
  const s = sizeClasses[size]
  return (
    <div className={`flex flex-col items-center text-center gap-2 px-4 ${s.wrap}`}>
      <div className={`${s.circle} rounded-full flex items-center justify-center ${toneClasses[tone]}`}>
        <Icon size={s.icon} />
      </div>
      <p className="text-sm font-semibold text-gray-600">{title}</p>
      {description && <p className="text-xs text-gray-400 max-w-xs">{description}</p>}
    </div>
  )
}
