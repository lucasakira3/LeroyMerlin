'use client'

import { useEffect, useState } from 'react'
import ProductCard from './ProductCard'
import ProdutoDrawer from './ProdutoDrawer'
import Pagination from './ui/Pagination'
import Skeleton from './ui/Skeleton'
import type { Produto } from '@/types/produto'

type ProdutoComOferta = Omit<Produto, 'embedding' | 'embedding_text'> & {
  precoOriginal: number
  percentualDesconto: number
}

const ITENS_POR_PAGINA = 20

export default function OfertasView() {
  const [produtos, setProdutos] = useState<ProdutoComOferta[]>([])
  const [loading, setLoading] = useState(true)
  const [pagina, setPagina] = useState(1)
  const [produtoDrawer, setProdutoDrawer] = useState<ProdutoComOferta | null>(null)

  useEffect(() => {
    fetch('/api/ofertas')
      .then(r => r.json())
      .then(data => { setProdutos(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const totalPaginas = Math.max(1, Math.ceil(produtos.length / ITENS_POR_PAGINA))
  const produtosPaginados = produtos.slice((pagina - 1) * ITENS_POR_PAGINA, pagina * ITENS_POR_PAGINA)

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="p-4 rounded-xl border-2 border-gray-200 bg-white space-y-2">
            <Skeleton className="w-full h-36" />
            <Skeleton className="w-full h-3.5" />
            <Skeleton className="w-2/3 h-3.5" />
          </div>
        ))}
      </div>
    )
  }

  if (produtos.length === 0) {
    return <p className="text-sm text-gray-500 py-10 text-center">Nenhuma oferta disponível no momento.</p>
  }

  return (
    <>
      <ProdutoDrawer produto={produtoDrawer as any} onClose={() => setProdutoDrawer(null)} />
      <p className="text-xs text-gray-400 mb-4">{produtos.length} produtos em oferta</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 mb-6">
        {produtosPaginados.map(p => (
          <ProductCard key={p.id} produto={p} onSelect={() => setProdutoDrawer(p)} />
        ))}
      </div>
      <Pagination page={pagina} totalPages={totalPaginas} onChange={setPagina} />
    </>
  )
}
