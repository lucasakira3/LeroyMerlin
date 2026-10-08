'use client'

import Link from 'next/link'
import { getImagemProduto, ajusteFoto } from '@/lib/categoriaImagens'

interface ProductListItemProduto {
  id: string
  categoria: string
  produto: string
  imagem?: string
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
      // flex-wrap: no celular quem passa `extra` pode mandá-lo pra uma segunda linha (basis-full),
      // como faz a tela de Favoritos — ao lado do texto, o nome do produto virava "Furad...".
      className={`flex flex-wrap sm:flex-nowrap items-center gap-2 bg-white border border-gray-200 dark:border-gray-500 rounded-xl p-2 hover:border-lm-green/40 hover:shadow-sm transition-all ${className}`}
    >
      <Link href={href} className="flex items-center gap-3 flex-1 min-w-0">
        <img
          src={getImagemProduto(produto)}
          alt={produto.categoria}
          className={`w-16 h-16 rounded-lg ${ajusteFoto(produto, 'p-1')} flex-shrink-0`}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-lm-dark line-clamp-2 sm:line-clamp-1">{produto.produto}</p>
          <p className="text-sm font-bold text-lm-green mt-0.5">
            {produto.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
          <p className="text-sm text-gray-600 mt-0.5">{produto.categoria}</p>
        </div>
      </Link>
      {extra}
    </div>
  )
}
