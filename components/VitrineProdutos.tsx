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

// Uma linha só, com scroll horizontal (como "Destaques com desconto" em ProdutosView.tsx) —
// uma grade que quebra em 2 linhas ficava comprida demais e pesada na home.
const QTD_DESTAQUES = 10

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
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x snap-mandatory">
        {produtos === null
          ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="w-52 flex-shrink-0"><ProductCardSkeleton /></div>)
          : produtos.map(p => (
              <div key={p.id} className="w-52 flex-shrink-0 snap-start">
                <ProductCard produto={p} onDetalhes={() => setProdutoDrawer(p)} className="h-full" />
              </div>
            ))}
      </div>
    </section>
  )
}
