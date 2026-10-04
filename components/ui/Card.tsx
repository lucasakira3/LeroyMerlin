import { HTMLAttributes } from 'react'

type CardPadding = 'none' | 'sm' | 'md'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: CardPadding
  hoverable?: boolean
}

const paddingClasses: Record<CardPadding, string> = {
  // Sem padding o conteúdo encosta na borda do cartão. Recortar aqui impede que fundo de
  // cabeçalho de tabela, linha em hover ou foto vazem pelos cantos arredondados.
  none: 'overflow-hidden',
  sm: 'p-4',
  md: 'p-6',
}

export default function Card({
  padding = 'md',
  hoverable = false,
  className = '',
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={`bg-white rounded-card shadow-soft border border-gray-200 dark:border-gray-500 ${paddingClasses[padding]} ${
        hoverable ? 'transition-shadow hover:shadow-soft-lg' : ''
      } ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}
