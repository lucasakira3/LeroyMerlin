'use client'

import { useState } from 'react'
import SearchBar from './SearchBar'
import ImageUpload from './ImageUpload'
import StoreMap from './StoreMap'
import ProdutoDrawer from './ProdutoDrawer'
import { MapPin } from 'lucide-react'
import type { SearchResult } from '@/types/produto'

const LOJAS = [
  'Interlagos — São Paulo/SP',
  'Osasco — Osasco/SP',
  'Aricanduva — São Paulo/SP',
  'Santo André — Santo André/SP',
  'Guarulhos — Guarulhos/SP',
  'Campinas — Campinas/SP',
  'Alphaville — Barueri/SP',
  'São Bernardo do Campo — SBC/SP',
  'Sorocaba — Sorocaba/SP',
  'Belo Horizonte Norte — BH/MG',
  'Barra da Tijuca — Rio de Janeiro/RJ',
  'Curitiba — Curitiba/PR',
  'Porto Alegre — Porto Alegre/RS',
  'Brasília — DF',
  'Goiânia — Goiânia/GO',
]

export default function SearchSection() {
  const [resultados, setResultados] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [queryProcessada, setQueryProcessada] = useState('')
  const [loja, setLoja] = useState(LOJAS[0])
  const [produtoDrawer, setProdutoDrawer] = useState<SearchResult['produto'] | null>(null)

  const handleSearchResults = (results: SearchResult[], query: string) => {
    setResultados(results)
    setQueryProcessada(query)
  }

  const handleImageResults = (results: SearchResult[]) => {
    setResultados(results)
    setQueryProcessada('busca por imagem')
  }

  return (
    <div className="space-y-5">
      <ProdutoDrawer produto={produtoDrawer} onClose={() => setProdutoDrawer(null)} />
      {/* Seletor de loja */}
      <div className="flex items-center gap-3">
        <MapPin size={15} className="text-lm-green flex-shrink-0" />
        <label className="text-xs font-semibold text-gray-600 flex-shrink-0">Loja:</label>
        <select
          value={loja}
          onChange={(e) => setLoja(e.target.value)}
          className="flex-1 h-9 px-3 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-lm-green/30"
        >
          {LOJAS.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>

      {/* Busca */}
      <SearchBar
        onResults={handleSearchResults}
        loading={loading}
        setLoading={setLoading}
      />

      {/* Upload de imagem */}
      <ImageUpload
        onResults={handleImageResults}
        loading={loading}
        setLoading={setLoading}
      />

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-14">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-lm-green border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Localizando produtos no mapa...</p>
          </div>
        </div>
      )}

      {/* Mapa com resultados */}
      {!loading && resultados.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 mb-4">
            Resultados para: <span className="font-medium text-gray-600">{queryProcessada}</span>
          </p>
          <StoreMap
            resultados={resultados}
            loja={loja}
            totalEstimado={resultados.reduce((sum, r) => sum + ((r.produto as any).preco ?? 0), 0)}
            onSelect={setProdutoDrawer}
          />
        </div>
      )}

      {/* Estado vazio */}
      {!loading && resultados.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🗺️</div>
          <h2 className="text-base font-semibold text-lm-dark mb-2">
            Busque um produto para ver no mapa
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Os produtos aparecerão como pins na planta da loja selecionada
          </p>
          <div className="flex flex-wrap gap-2.5 justify-center">
            {['Torneira banheiro', 'Tinta branca', 'Disjuntor 20A', 'Piso laminado', 'Mangueira jardim'].map((s) => (
              <span key={s} className="px-3 py-1.5 bg-white border border-gray-100 shadow-soft rounded-full text-sm text-gray-600">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
