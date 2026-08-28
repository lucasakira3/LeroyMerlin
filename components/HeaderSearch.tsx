'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

export default function HeaderSearch() {
  const router = useRouter()
  const [query, setQuery] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    router.push(`/?q=${encodeURIComponent(q)}`)
  }

  return (
    <form onSubmit={handleSubmit} className="relative flex-1 md:max-w-2xl">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={17} />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar produtos..."
        aria-label="Buscar produtos"
        className="w-full h-10 pl-10 pr-4 rounded-xl border-0 bg-white/95 text-sm text-lm-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50"
      />
    </form>
  )
}
