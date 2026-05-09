import Link from 'next/link'
import { MapPin } from 'lucide-react'
import StockIndicator from './StockIndicator'
import SustainabilityBadge from './SustainabilityBadge'
import type { SearchResult } from '@/types/produto'

export default function ProductCard({ result }: { result: SearchResult }) {
  const { produto, score } = result

  return (
    <Link
      href={`/produto/${produto.id}`}
      className="block bg-white border border-gray-200 hover:border-lm-green/50 hover:shadow-sm transition-all"
    >
      <div className="flex items-stretch">
        {/* ID column — McMaster style */}
        <div className="bg-lm-green/5 border-r border-gray-200 px-3 py-3 flex flex-col items-center justify-center min-w-[64px]">
          <span className="text-[10px] text-gray-400 font-mono">{produto.id}</span>
          <span className="text-[10px] text-lm-green font-bold mt-1">
            {Math.round(score * 100)}%
          </span>
        </div>

        {/* Main content */}
        <div className="flex-1 px-4 py-3">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">
            {produto.categoria}
          </p>
          <h3 className="text-sm font-semibold text-lm-dark leading-snug mb-2">
            {produto.produto}
          </h3>

          {/* Corridor — prominently displayed */}
          <div className="flex items-center gap-1.5 text-lm-green mb-2">
            <MapPin size={13} strokeWidth={2.5} />
            <span className="text-sm font-bold">{produto.corredor}</span>
          </div>

          {/* Preço */}
          {'preco' in produto && (
            <p className="text-base font-bold text-lm-dark mb-2">
              {Number(produto.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          )}

          {/* Tags */}
          <div className="flex items-center justify-between">
            <StockIndicator estoque={produto.estoque} />
            <SustainabilityBadge sustentabilidade={produto.sustentabilidade} />
          </div>
        </div>
      </div>
    </Link>
  )
}
