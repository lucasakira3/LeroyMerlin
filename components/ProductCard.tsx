'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MapPin, ShoppingCart, Check } from 'lucide-react'
import StockIndicator from './StockIndicator'
import SustainabilityBadge from './SustainabilityBadge'
import { getImagemCategoria } from '@/lib/categoriaImagens'
import { adicionarAoCarrinho } from '@/lib/clientCarrinho'
import type { SustentabilidadeScore } from '@/types/produto'

interface ProductCardProduto {
  id: string
  categoria: string
  produto: string
  corredor: string
  preco: number
  estoque: number
  sustentabilidade: SustentabilidadeScore
}

interface ProductCardProps {
  produto: ProductCardProduto
  selected?: boolean
  href?: string
  onSelect?: () => void
  onDetalhes?: () => void
  style?: React.CSSProperties
  className?: string
}

export default function ProductCard({
  produto,
  selected = false,
  href,
  onSelect,
  onDetalhes,
  style,
  className = '',
}: ProductCardProps) {
  const [adicionado, setAdicionado] = useState(false)

  function handleAdicionarCarrinho(e: React.MouseEvent) {
    e.stopPropagation()
    e.preventDefault()
    if (produto.estoque === 0) return
    adicionarAoCarrinho(produto.id)
    setAdicionado(true)
    setTimeout(() => setAdicionado(false), 1500)
  }

  const wrapperClass = `group relative block text-left w-full rounded-card overflow-hidden border-2 bg-white transition-all hover:shadow-md ${
    selected ? 'border-lm-green shadow-sm' : 'border-gray-200 hover:border-lm-green/40'
  } ${className}`

  const conteudo = (
    <>
      <div className="relative">
        <img
          src={getImagemCategoria(produto.categoria, produto.id)}
          alt={produto.categoria}
          className="w-full h-36 object-cover"
        />
        <span className="absolute bottom-2 left-2 flex items-center gap-1 bg-lm-green text-white text-[10px] font-bold px-2 py-1 rounded-md">
          <MapPin size={10} strokeWidth={2.5} /> {produto.corredor}
        </span>
        <button
          type="button"
          onClick={handleAdicionarCarrinho}
          disabled={produto.estoque === 0}
          aria-label="Adicionar ao carrinho"
          className={`absolute top-2 right-2 flex items-center justify-center w-8 h-8 rounded-full shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed text-white ${
            adicionado ? 'bg-lm-green' : 'bg-lm-dark/80 hover:bg-lm-green'
          }`}
        >
          {adicionado ? <Check size={14} /> : <ShoppingCart size={14} />}
        </button>
        {onDetalhes && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); e.preventDefault(); onDetalhes() }}
            className="absolute bottom-2 right-2 text-[10px] font-semibold text-white bg-black/50 hover:bg-black/70 rounded-full px-2 py-1 transition-colors"
          >
            Detalhes
          </button>
        )}
      </div>

      <div className="p-3">
        <h3 className="text-sm font-semibold text-lm-dark leading-snug mb-1.5 line-clamp-2 min-h-[2.5rem]">
          {produto.produto}
        </h3>
        <p className="text-base font-black text-lm-dark mb-1.5">
          {produto.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </p>
        <div className="flex items-center justify-between gap-1.5 flex-wrap">
          <StockIndicator estoque={produto.estoque} />
          <SustainabilityBadge sustentabilidade={produto.sustentabilidade} />
        </div>
      </div>
    </>
  )

  if (href && !onSelect) {
    return (
      <Link href={href} className={wrapperClass} style={style}>
        {conteudo}
      </Link>
    )
  }

  return (
    <button type="button" onClick={onSelect} className={wrapperClass} style={style}>
      {conteudo}
    </button>
  )
}
