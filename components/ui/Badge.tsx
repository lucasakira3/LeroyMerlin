import { HTMLAttributes } from 'react'

type BadgeTone = 'green' | 'yellow' | 'orange' | 'red' | 'gray'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone
}

const toneClasses: Record<BadgeTone, string> = {
  green: 'bg-lm-green/10 text-lm-green',
  yellow: 'bg-lm-yellow/20 text-yellow-800',
  orange: 'bg-lm-orange/10 text-lm-orange',
  red: 'bg-red-50 text-red-600',
  gray: 'bg-gray-100 text-gray-600',
}

export default function Badge({ tone = 'gray', className = '', children, ...rest }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${toneClasses[tone]} ${className}`}
      {...rest}
    >
      {children}
    </span>
  )
}
