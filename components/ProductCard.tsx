'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { MapPin, ShoppingCart, Check, Square, CheckSquare, Heart } from 'lucide-react'
import StockIndicator from './StockIndicator'
import SustainabilityBadge from './SustainabilityBadge'
import StarRating from './ui/StarRating'
import { getImagemCategoria } from '@/lib/categoriaImagens'
import { adicionarAoCarrinho } from '@/lib/clientCarrinho'
import { getMedia } from '@/lib/clientAvaliacoes'
import { isFavorito, toggleFavorito } from '@/lib/clientFavoritos'
import { formatarParcelamento } from '@/lib/parcelamento'
import type { SustentabilidadeScore } from '@/types/produto'

interface ProductCardProduto {
  id: string
  categoria: string
  produto: string
  corredor: string
  preco: number
  precoOriginal?: number
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
  const [favoritado, setFavoritado] = useState(false)
  const emOferta = produto.precoOriginal !== undefined && produto.precoOriginal > produto.preco
  const { media, total: totalAvaliacoes } = getMedia(produto.id)
  const parcelamentoStr = formatarParcelamento(produto.preco)

  useEffect(() => {
    setFavoritado(isFavorito(produto.id))
  }, [produto.id])

  function handleAdicionarCarrinho(e: React.MouseEvent) {
    e.stopPropagation()
    e.preventDefault()
    if (produto.estoque === 0) return
    adicionarAoCarrinho(produto.id)
    setAdicionado(true)
    setTimeout(() => setAdicionado(false), 1500)
  }

  function handleFavorito(e: React.MouseEvent) {
    e.stopPropagation()
    e.preventDefault()
    setFavoritado(toggleFavorito(produto.id))
  }

  function handleToggleSelecao(e: React.MouseEvent) {
    e.stopPropagation()
    e.preventDefault()
    onSelect?.()
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
        {emOferta && (
          <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-md">
            -{Math.round((1 - produto.preco / produto.precoOriginal!) * 100)}%
          </span>
        )}
        <div className="absolute top-2 right-2 flex items-center gap-1.5">
          {onSelect && (
            <button
              type="button"
              onClick={handleToggleSelecao}
              aria-label={selected ? 'Remover da seleção' : 'Selecionar produto'}
              aria-pressed={selected}
              className={`w-7 h-7 rounded-full flex items-center justify-center shadow-md transition-colors ${
                selected ? 'bg-lm-green text-white' : 'bg-white/90 text-gray-400 hover:text-lm-green'
              }`}
            >
              {selected ? <CheckSquare size={15} /> : <Square size={15} />}
            </button>
          )}
          <button
            type="button"
            onClick={handleFavorito}
            aria-label={favoritado ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            aria-pressed={favoritado}
            className={`w-7 h-7 rounded-full flex items-center justify-center shadow-md transition-colors bg-white/90 ${
              favoritado ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
            }`}
          >
            <Heart size={15} fill={favoritado ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      <div className="p-3">
        <div className="flex items-center gap-1 text-[10px] font-bold text-lm-green mb-1.5">
          <MapPin size={10} strokeWidth={2.5} /> {produto.corredor}
        </div>
        <h3 className="text-sm font-semibold text-lm-dark leading-snug mb-2 line-clamp-2 min-h-[2.5rem]">
          {produto.produto}
        </h3>
        {totalAvaliacoes > 0 && (
          <div className="flex items-center gap-1.5 mb-2">
            <StarRating value={media} size={12} />
            <span className="text-[11px] text-gray-400">({totalAvaliacoes})</span>
          </div>
        )}
        {emOferta && (
          <p className="text-xs text-gray-400 line-through">
            {produto.precoOriginal!.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        )}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div>
            <p className="text-base font-black text-lm-dark">
              {produto.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
            {parcelamentoStr && <p className="text-[10px] text-gray-400">{parcelamentoStr}</p>}
          </div>
          <button
            type="button"
            onClick={handleAdicionarCarrinho}
            disabled={produto.estoque === 0}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 text-white ${
              adicionado ? 'bg-lm-green' : 'bg-lm-dark hover:bg-lm-green'
            }`}
          >
            <ShoppingCart size={13} />
            {adicionado ? 'Adicionado ✓' : 'Adicionar'}
          </button>
        </div>
        <div className="flex items-center justify-between gap-1.5 flex-wrap">
          <StockIndicator estoque={produto.estoque} />
          <SustainabilityBadge sustentabilidade={produto.sustentabilidade} />
        </div>
      </div>
    </>
  )

  if (href && !onDetalhes) {
    return (
      <Link href={href} className={wrapperClass} style={style}>
        {conteudo}
      </Link>
    )
  }

  // Não pode ser <button> aqui: o card já contém o checkbox de seleção e o coração de
  // favoritar, que são <button> por baixo — <button> dentro de <button> é HTML inválido
  // (aviso "cannot be a descendant of" no console) e quebra em alguns navegadores.
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onDetalhes}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onDetalhes?.()
        }
      }}
      className={wrapperClass}
      style={style}
    >
      {conteudo}
    </div>
  )
}
