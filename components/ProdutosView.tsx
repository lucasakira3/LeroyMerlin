'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import SearchSection from '@/components/SearchSection'
import CategoriaView from '@/components/CategoriaView'
import Card from '@/components/ui/Card'
import { Grid2x2 } from 'lucide-react'
import { getImagemCategoria } from '@/lib/categoriaImagens'

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

// Antes vivia dentro de HomeView.tsx, junto com o banner e a vitrine de ofertas — usuário
// achou a home poluída com tudo misturado. Separado numa tela própria (/produtos), a home
// virou só a "vitrine" (banner + ofertas + stats) e aqui é onde a navegação/busca de
// verdade acontece. `?categoria=` seed vem do link direto do banner/vitrine da home
// (mesmo padrão já usado pra `?q=` alimentar SearchSection).
export default function ProdutosView() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') ?? undefined
  const categoriaInicial = searchParams.get('categoria')
  const [categoriaAtiva, setCategoriaAtiva] = useState<{ slug: string; label: string } | null>(() => {
    if (!categoriaInicial) return null
    const encontrada = CATEGORIAS.find(c => c.slug === categoriaInicial)
    return encontrada ?? { slug: categoriaInicial, label: 'Todos' }
  })

  useEffect(() => {
    if (initialQuery) setCategoriaAtiva(null)
  }, [initialQuery])

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
      {/* Categorias */}
      <div className="mb-8">
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
      </div>

      {/* Busca semântica */}
      <Card>
        <h1 className="text-base font-bold text-lm-dark mb-0.5">Busca inteligente</h1>
        <p className="text-xs text-gray-400 mb-4">Descreva com suas palavras — a IA encontra o produto certo</p>
        <SearchSection key={initialQuery ?? 'default'} initialQuery={initialQuery} />
      </Card>
    </div>
  )
}
