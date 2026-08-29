'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { X } from 'lucide-react'
import ProductCard from './ProductCard'
import ProdutoDrawer from './ProdutoDrawer'
import Pagination from './ui/Pagination'
import Skeleton from './ui/Skeleton'
import { CATEGORIA_LABELS } from '@/lib/categorias'
import type { Produto } from '@/types/produto'

type ProdutoComOferta = Omit<Produto, 'embedding' | 'embedding_text'> & {
  precoOriginal: number
  percentualDesconto: number
}

const ITENS_POR_PAGINA = 20

export default function OfertasView() {
  const searchParams = useSearchParams()
  const categoriaSlug = searchParams.get('categoria')
  const categoriaLabel = categoriaSlug ? CATEGORIA_LABELS[categoriaSlug] : undefined

  const [produtos, setProdutos] = useState<ProdutoComOferta[]>([])
  const [loading, setLoading] = useState(true)
  const [pagina, setPagina] = useState(1)
  const [produtoDrawer, setProdutoDrawer] = useState<ProdutoComOferta | null>(null)

  useEffect(() => {
    setLoading(true)
    setPagina(1)
    const url = categoriaLabel ? `/api/ofertas?categoria=${categoriaSlug}` : '/api/ofertas'
    fetch(url)
      .then(r => r.json())
      .then(data => { setProdutos(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [categoriaSlug, categoriaLabel])

  const totalPaginas = Math.max(1, Math.ceil(produtos.length / ITENS_POR_PAGINA))
  const produtosPaginados = produtos.slice((pagina - 1) * ITENS_POR_PAGINA, pagina * ITENS_POR_PAGINA)

  const filtro = categoriaLabel && (
    <div className="flex items-center gap-2 mb-4 text-sm">
      <span className="text-gray-500">
        Ofertas em <strong className="text-lm-dark">{categoriaLabel}</strong>
      </span>
      <Link href="/ofertas" className="flex items-center gap-1 text-lm-green font-semibold hover:underline">
        <X size={13} /> limpar filtro
      </Link>
    </div>
  )

  if (loading) {
    return (
      <>
        {filtro}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="p-4 rounded-xl border-2 border-gray-200 bg-white space-y-2">
              <Skeleton className="w-full h-36" />
              <Skeleton className="w-full h-3.5" />
              <Skeleton className="w-2/3 h-3.5" />
            </div>
          ))}
        </div>
      </>
    )
  }

  if (produtos.length === 0) {
    return (
      <>
        {filtro}
        <p className="text-sm text-gray-500 py-10 text-center">
          {categoriaLabel ? `Nenhuma oferta em ${categoriaLabel} no momento.` : 'Nenhuma oferta disponível no momento.'}
        </p>
      </>
    )
  }

  return (
    <>
      <ProdutoDrawer produto={produtoDrawer as any} onClose={() => setProdutoDrawer(null)} />
      {filtro}
      <p className="text-xs text-gray-400 mb-4">{produtos.length} produtos em oferta</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 mb-6">
        {produtosPaginados.map(p => (
          <ProductCard key={p.id} produto={p} onDetalhes={() => setProdutoDrawer(p)} />
        ))}
      </div>
      <Pagination page={pagina} totalPages={totalPaginas} onChange={setPagina} />
    </>
  )
}
