'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import ProductCard from './ProductCard'
import ProdutoDrawer from './ProdutoDrawer'
import ProductCardSkeleton from './ProductCardSkeleton'
import type { Produto } from '@/types/produto'

type ProdutoComOferta = Omit<Produto, 'embedding' | 'embedding_text'> & {
  precoOriginal: number
  percentualDesconto: number
}

// 12 fecha linhas cheias em 2, 3 e 4 colunas; em 5 colunas (2xl) os 2 últimos ficam ocultos pra não sobrar linha quebrada.
const QTD_DESTAQUES = 12

// Fim da home: os produtos com maior desconto real (mesma fonte de /ofertas, nada inventado).
// Sem isso a home terminava na altura da tela, só com banner e 2 botões.
export default function VitrineProdutos() {
  const [produtos, setProdutos] = useState<ProdutoComOferta[] | null>(null)
  const [produtoDrawer, setProdutoDrawer] = useState<ProdutoComOferta | null>(null)

  useEffect(() => {
    fetch('/api/ofertas')
      .then(r => r.json())
      // /api/ofertas já vem ordenado por desconto decrescente
      .then((lista: ProdutoComOferta[]) => setProdutos(lista.slice(0, QTD_DESTAQUES)))
      .catch(() => setProdutos([]))
  }, [])

  if (produtos && produtos.length === 0) return null

  return (
    <section className="mb-8">
      <ProdutoDrawer produto={produtoDrawer as any} onClose={() => setProdutoDrawer(null)} />
      <div className="flex items-end justify-between mb-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
          Maiores descontos da semana
        </h2>
        <Link href="/ofertas" className="flex items-center gap-1 text-sm font-semibold text-lm-green hover:underline">
          Ver todas as ofertas <ArrowRight size={14} />
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
        {produtos === null
          ? Array.from({ length: 5 }).map((_, i) => <ProductCardSkeleton key={i} />)
          : produtos.map((p, i) => (
              <div key={p.id} className={i >= 10 ? '2xl:hidden' : undefined}>
                <ProductCard produto={p} onDetalhes={() => setProdutoDrawer(p)} />
              </div>
            ))}
      </div>
    </section>
  )
}
