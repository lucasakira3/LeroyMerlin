'use client'

import { SlidersHorizontal } from 'lucide-react'
import type { SearchResult } from '@/types/produto'

export interface FiltrosBusca {
  categoria: string
  precoMin: string
  precoMax: string
  apenasDisponiveis: boolean
}

export const FILTROS_INICIAIS: FiltrosBusca = {
  categoria: 'Todas',
  precoMin: '',
  precoMax: '',
  apenasDisponiveis: false,
}

export function temFiltroAtivo(filtros: FiltrosBusca): boolean {
  return (
    filtros.categoria !== 'Todas' ||
    filtros.precoMin !== '' ||
    filtros.precoMax !== '' ||
    filtros.apenasDisponiveis
  )
}

export function aplicarFiltros(resultados: SearchResult[], filtros: FiltrosBusca): SearchResult[] {
  const min = filtros.precoMin ? Number(filtros.precoMin) : null
  const max = filtros.precoMax ? Number(filtros.precoMax) : null

  return resultados.filter(({ produto }) => {
    if (filtros.categoria !== 'Todas' && produto.categoria !== filtros.categoria) return false
    if (filtros.apenasDisponiveis && produto.estoque <= 0) return false
    if (min !== null && produto.preco < min) return false
    if (max !== null && produto.preco > max) return false
    return true
  })
}

interface Props {
  resultados: SearchResult[]
  filtros: FiltrosBusca
  onChange: (filtros: FiltrosBusca) => void
}

export default function SearchFilters({ resultados, filtros, onChange }: Props) {
  const categorias = ['Todas', ...Array.from(new Set(resultados.map((r) => r.produto.categoria))).sort()]

  return (
    <div className="flex flex-wrap items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl shadow-soft">
      <div className="flex items-center gap-1.5 text-gray-400">
        <SlidersHorizontal size={13} />
        <span className="text-xs font-medium text-gray-500">Filtros:</span>
      </div>

      <select
        value={filtros.categoria}
        onChange={(e) => onChange({ ...filtros, categoria: e.target.value })}
        className="h-8 px-2.5 rounded-lg border border-gray-200 text-xs text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-lm-green/30"
      >
        {categorias.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      <div className="flex items-center gap-1.5">
        <input
          type="number"
          min={0}
          inputMode="numeric"
          placeholder="Min R$"
          value={filtros.precoMin}
          onChange={(e) => onChange({ ...filtros, precoMin: e.target.value })}
          className="w-20 h-8 px-2 rounded-lg border border-gray-200 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-lm-green/30 bg-white"
        />
        <span className="text-xs text-gray-300">—</span>
        <input
          type="number"
          min={0}
          inputMode="numeric"
          placeholder="Máx R$"
          value={filtros.precoMax}
          onChange={(e) => onChange({ ...filtros, precoMax: e.target.value })}
          className="w-20 h-8 px-2 rounded-lg border border-gray-200 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-lm-green/30 bg-white"
        />
      </div>

      <button
        type="button"
        onClick={() => onChange({ ...filtros, apenasDisponiveis: !filtros.apenasDisponiveis })}
        className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
          filtros.apenasDisponiveis
            ? 'bg-lm-green text-white border-lm-green'
            : 'bg-white text-gray-500 border-gray-200 hover:border-lm-green/40'
        }`}
      >
        ✓ Só disponíveis
      </button>

      {temFiltroAtivo(filtros) && (
        <button
          type="button"
          onClick={() => onChange(FILTROS_INICIAIS)}
          className="text-xs text-gray-400 hover:text-lm-green ml-auto"
        >
          Limpar filtros
        </button>
      )}
    </div>
  )
}
