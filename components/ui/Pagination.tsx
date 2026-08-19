'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  page: number
  totalPages: number
  onChange: (page: number) => void
  className?: string
}

function paginasVisiveis(page: number, totalPages: number): (number | '…')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const paginas = new Set<number>([1, totalPages, page, page - 1, page + 1])
  const ordenadas = [...paginas].filter(p => p >= 1 && p <= totalPages).sort((a, b) => a - b)

  const resultado: (number | '…')[] = []
  let anterior = 0
  for (const p of ordenadas) {
    if (p - anterior > 1) resultado.push('…')
    resultado.push(p)
    anterior = p
  }
  return resultado
}

export default function Pagination({ page, totalPages, onChange, className = '' }: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <nav
      aria-label="Paginação"
      className={`flex items-center justify-center gap-1.5 ${className}`}
    >
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        aria-label="Página anterior"
        className="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-lm-green/40 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
      >
        <ChevronLeft size={16} />
      </button>

      {paginasVisiveis(page, totalPages).map((p, i) =>
        p === '…' ? (
          <span key={`ellipsis-${i}`} className="w-9 h-9 flex items-center justify-center text-sm text-gray-400">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-current={p === page ? 'page' : undefined}
            className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${
              p === page
                ? 'bg-lm-green text-white'
                : 'text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-lm-green/40'
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        aria-label="Próxima página"
        className="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-lm-green/40 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  )
}
