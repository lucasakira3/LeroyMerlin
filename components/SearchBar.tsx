'use client'

import { useState, useCallback } from 'react'
import { Search } from 'lucide-react'
import VoiceButton from './VoiceButton'
import { buscarProdutos } from '@/lib/buscarProdutos'
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
      if (!searchQuery.trim()) return

      setLoading(true)
      const { resultados, queryProcessada } = await buscarProdutos(searchQuery)
      onResults(resultados, queryProcessada)
      setLoading(false)
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
          className="w-full h-14 pl-12 pr-14 rounded-xl border border-gray-200 bg-white text-lm-dark placeholder-gray-400 text-base shadow-soft focus:outline-none focus:ring-2 focus:ring-lm-green/30 focus:border-transparent disabled:opacity-60 disabled:cursor-not-allowed"
        />
        <div className="absolute right-4">
          <VoiceButton onTranscript={handleTranscript} disabled={loading} />
        </div>
      </div>
      <button
        type="submit"
        disabled={loading || !query.trim()}
        className="mt-4 w-full h-12 bg-lm-green text-white font-semibold rounded-xl hover:bg-green-700 active:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
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
