import { HTMLAttributes } from 'react'

type CardPadding = 'none' | 'sm' | 'md'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: CardPadding
  hoverable?: boolean
}

const paddingClasses: Record<CardPadding, string> = {
  none: '',
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
      className={`bg-white rounded-card shadow-soft border border-gray-100 ${paddingClasses[padding]} ${
        hoverable ? 'transition-shadow hover:shadow-soft-lg' : ''
      } ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}
