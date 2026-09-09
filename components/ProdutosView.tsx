'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import CategoriaView from '@/components/CategoriaView'
import ProductCard from '@/components/ProductCard'
import ProductCardSkeleton from '@/components/ProductCardSkeleton'
import ProdutoDrawer from '@/components/ProdutoDrawer'
import { Grid2x2, Tag } from 'lucide-react'
import { getImagemCategoria } from '@/lib/categoriaImagens'
import { trackProductView } from '@/lib/hooks/useProductTracker'
import type { Produto } from '@/types/produto'

const CATEGORIAS = [
  { slug: 'ferramentas', label: 'Ferramentas' },
  { slug: 'eletrica',    label: 'Elétrica' },
  { slug: 'hidraulica',  label: 'Hidráulica' },
  { slug: 'pintura',     label: 'Pintura' },
  { slug: 'jardim',      label: 'Jardim' },
  { slug: 'iluminacao',  label: 'Iluminação' },
  { slug: 'construcao',  label: 'Construção' },
  { slug: 'decoracao',   label: 'Decoração' },
]

type ProdutoOferta = Omit<Produto, 'embedding' | 'embedding_text'> & {
  precoOriginal: number
  percentualDesconto: number
}

// Antes vivia junto com a busca inteligente aqui mesmo — separado de novo em duas abas do
// NavBar: "Buscar" (components/BuscarView.tsx, busca por texto/foto) e "Produtos" (aqui, só
// categorias — cada uma com seu próprio seletor de loja embutido em CategoriaView.tsx, não
// precisa de um seletor de loja nesta tela). `?categoria=` seed vem de deep links (banner da
// home, vitrine de ofertas).
export default function ProdutosView() {
  const searchParams = useSearchParams()
  const categoriaInicial = searchParams.get('categoria')
  const [categoriaAtiva, setCategoriaAtiva] = useState<{ slug: string; label: string } | null>(() => {
    if (!categoriaInicial) return null
    const encontrada = CATEGORIAS.find(c => c.slug === categoriaInicial)
    return encontrada ?? { slug: categoriaInicial, label: 'Todos' }
  })
  const [destaques, setDestaques] = useState<ProdutoOferta[] | null>(null)
  const [produtoDrawer, setProdutoDrawer] = useState<ProdutoOferta | null>(null)

  // Tela de aterrissagem da aba (sem categoria escolhida ainda) só tinha a grade de
  // categorias, ficava vazia demais. Reaproveita /api/ofertas (mesma rota da VitrineOfertas
  // em BuscarView) pra puxar um produto real de cada categoria — o de maior desconto —
  // em vez de repetir os mesmos ladrilhos de categoria com outra cor.
  useEffect(() => {
    if (categoriaAtiva) return
    fetch('/api/ofertas')
      .then(r => r.json())
      .then((produtos: ProdutoOferta[]) => {
        const melhorPorCategoria = new Map<string, ProdutoOferta>()
        for (const p of produtos) {
          const atual = melhorPorCategoria.get(p.categoria)
          if (!atual || p.percentualDesconto > atual.percentualDesconto) melhorPorCategoria.set(p.categoria, p)
        }
        setDestaques([...melhorPorCategoria.values()].sort((a, b) => b.percentualDesconto - a.percentualDesconto))
      })
      .catch(() => setDestaques([]))
  }, [categoriaAtiva])

  if (categoriaAtiva) {
    return (
      <div key={categoriaAtiva.slug} className="px-4 sm:px-6 lg:px-8 py-6 animate-fade-in-up">
        <CategoriaView
          slug={categoriaAtiva.slug}
          label={categoriaAtiva.label}
          onBack={() => setCategoriaAtiva(null)}
        />
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">
      <ProdutoDrawer produto={produtoDrawer} onClose={() => setProdutoDrawer(null)} />

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
          Navegar por categoria
        </h2>
        <button
          onClick={() => setCategoriaAtiva({ slug: 'todos', label: 'Todos' })}
          className="flex items-center gap-1.5 text-xs font-semibold text-lm-green hover:underline"
        >
          Ver todos <Grid2x2 size={13} />
        </button>
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
        {CATEGORIAS.map(({ slug, label }, i) => (
          <button
            key={slug}
            onClick={() => setCategoriaAtiva({ slug, label })}
            style={{ '--stagger-delay': `${i * 30}ms` } as React.CSSProperties}
            className="group relative rounded-xl overflow-hidden aspect-square animate-fade-in-up shadow-sm hover:shadow-lg hover:-translate-y-1 active:scale-95 transition-all duration-300 cursor-pointer"
          >
            <img
              src={getImagemCategoria(label)}
              alt={label}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-125"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent transition-opacity duration-300 group-hover:from-lm-green/85 group-hover:via-black/20" />
            <span className="absolute bottom-1.5 left-0 right-0 text-center text-white text-[11px] font-bold leading-tight px-1">
              {label}
            </span>
          </button>
        ))}
      </div>

      {destaques === null ? (
        <div className="mt-10">
          <div className="h-3 w-40 bg-gray-100 rounded-full mb-4 animate-pulse" />
          <div className="flex gap-3 overflow-x-auto pb-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-52 flex-shrink-0">
                <ProductCardSkeleton />
              </div>
            ))}
          </div>
        </div>
      ) : destaques.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              Destaques com desconto
            </h2>
            <Link
              href="/ofertas"
              className="flex items-center gap-1.5 text-xs font-semibold text-lm-green hover:underline"
            >
              Ver todas as ofertas <Tag size={13} />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x snap-mandatory">
            {destaques.map((produto, i) => (
              <div key={produto.id} className="w-52 flex-shrink-0 snap-start">
                <ProductCard
                  produto={produto}
                  onDetalhes={() => {
                    trackProductView({ id: produto.id, nome: produto.produto, categoria: produto.categoria })
                    setProdutoDrawer(produto)
                  }}
                  style={{ '--stagger-delay': `${Math.min(i, 8) * 30}ms` } as React.CSSProperties}
                  className="animate-fade-in-up h-full"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
