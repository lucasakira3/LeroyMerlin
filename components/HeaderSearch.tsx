'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Clock } from 'lucide-react'
import { getBuscasRecentes, registrarBusca } from '@/lib/buscasRecentes'

export default function HeaderSearch() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [sugestoes, setSugestoes] = useState<string[]>([])
  const [aberto, setAberto] = useState(false)

  function buscar(q: string) {
    const termo = q.trim()
    if (!termo) return
    registrarBusca(termo)
    setAberto(false)
    router.push(`/?q=${encodeURIComponent(termo)}`)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    buscar(query)
  }

  function handleFocus() {
    setSugestoes(getBuscasRecentes())
    setAberto(true)
  }

  function handleSugestaoClick(termo: string) {
    setQuery(termo)
    buscar(termo)
  }

  const mostrarSugestoes = aberto && query.trim() === '' && sugestoes.length > 0

  return (
    <form onSubmit={handleSubmit} className="relative flex-1 min-w-0 md:max-w-2xl">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={17} />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={handleFocus}
        onBlur={() => setTimeout(() => setAberto(false), 150)}
        placeholder="Buscar produtos..."
        aria-label="Buscar produtos"
        className="w-full h-10 pl-10 pr-4 rounded-xl border-0 bg-white/95 text-sm text-lm-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50"
      />
      {mostrarSugestoes && (
        <ul className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl shadow-soft-lg overflow-hidden z-50">
          {sugestoes.map(termo => (
            <li key={termo}>
              <button
                type="button"
                onMouseDown={() => handleSugestaoClick(termo)}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <Clock size={14} className="text-gray-400 flex-shrink-0" />
                {termo}
              </button>
            </li>
          ))}
        </ul>
      )}
    </form>
  )
}
