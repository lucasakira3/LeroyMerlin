'use client'

import { Star } from 'lucide-react'

interface StarRatingProps {
  value: number
  onChange?: (nota: number) => void
  size?: number
}

export default function StarRating({ value, onChange, size = 16 }: StarRatingProps) {
  const interativo = onChange !== undefined
  const arredondado = Math.round(value)

  return (
    <div className={`flex items-center gap-0.5 ${interativo ? '' : 'pointer-events-none'}`} role={interativo ? 'radiogroup' : undefined} aria-label={interativo ? 'Selecionar nota de 0 a 5 estrelas' : `Nota: ${value.toFixed(1)} de 5`}>
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          disabled={!interativo}
          onClick={() => onChange?.(value === i ? 0 : i)}
          aria-label={`${i} estrela${i > 1 ? 's' : ''}`}
          aria-pressed={interativo ? arredondado === i : undefined}
          className={interativo ? 'cursor-pointer' : 'cursor-default'}
        >
          <Star
            size={size}
            className={i <= arredondado ? 'fill-lm-yellow text-lm-yellow' : 'text-gray-300'}
          />
        </button>
      ))}
    </div>
  )
}
