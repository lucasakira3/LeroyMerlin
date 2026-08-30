'use client'

import Link from 'next/link'
import { getImagemCategoria } from '@/lib/categoriaImagens'

interface ProductListItemProduto {
  id: string
  categoria: string
  produto: string
  preco: number
}

interface ProductListItemProps {
  produto: ProductListItemProduto
  href: string
  style?: React.CSSProperties
  className?: string
  extra?: React.ReactNode
}

export default function ProductListItem({ produto, href, style, className = '', extra }: ProductListItemProps) {
  return (
    <div
      style={style}
      className={`flex items-center gap-2 bg-white border border-gray-200 rounded-xl p-2 hover:border-lm-green/40 hover:shadow-sm transition-all ${className}`}
    >
      <Link href={href} className="flex items-center gap-3 flex-1 min-w-0">
        <img
          src={getImagemCategoria(produto.categoria, produto.id)}
          alt={produto.categoria}
          className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-lm-dark truncate">{produto.produto}</p>
          <p className="text-sm font-bold text-lm-green mt-0.5">
            {produto.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{produto.categoria}</p>
        </div>
      </Link>
      {extra}
    </div>
  )
}
