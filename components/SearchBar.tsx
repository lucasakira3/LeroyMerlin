'use client'

import { useState, useCallback } from 'react'
import { Search } from 'lucide-react'
import VoiceButton from './VoiceButton'
import type { SearchResult } from '@/types/produto'

interface SearchBarProps {
  onResults: (results: SearchResult[], query: string) => void
  loading: boolean
  setLoading: (loading: boolean) => void
}

export default function SearchBar({ onResults, loading, setLoading }: SearchBarProps) {
  const [query, setQuery] = useState('')

  const handleSearch = useCallback(
    async (searchQuery: string) => {
      const q = searchQuery.trim()
      if (!q) return

      setLoading(true)
      try {
        const res = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: q, limit: 5 }),
        })

        if (!res.ok) throw new Error('Erro na busca')

        const data = await res.json()
        onResults(data.resultados, data.query_processada || q)
      } catch (err) {
        console.error('Erro ao buscar:', err)
        onResults([], q)
      } finally {
        setLoading(false)
      }
    },
    [onResults, setLoading]
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch(query)
  }

  const handleTranscript = (text: string) => {
    setQuery(text)
    handleSearch(text)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative flex items-center">
        <Search className="absolute left-4 text-gray-400 pointer-events-none" size={20} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="O que você está procurando?"
          disabled={loading}
          aria-label="Buscar produto na Leroy Merlin"
          className="w-full h-14 pl-12 pr-14 rounded-xl border border-gray-200 bg-white text-lm-dark placeholder-gray-400 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-lm-green focus:border-transparent disabled:opacity-60 disabled:cursor-not-allowed"
        />
        <div className="absolute right-4">
          <VoiceButton onTranscript={handleTranscript} disabled={loading} />
        </div>
      </div>
      <button
        type="submit"
        disabled={loading || !query.trim()}
        className="mt-3 w-full h-12 bg-lm-green text-white font-semibold rounded-xl hover:bg-green-700 active:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Buscando...
          </>
        ) : (
          <>
            <Search size={18} />
            Buscar produto
          </>
        )}
      </button>
    </form>
  )
}
