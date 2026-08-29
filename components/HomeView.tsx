'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import SearchSection from '@/components/SearchSection'
import CategoriaView from '@/components/CategoriaView'
import BannerCarrossel from '@/components/BannerCarrossel'
import VitrineOfertas from '@/components/VitrineOfertas'
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

export default function HomeView() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') ?? undefined
  const [categoriaAtiva, setCategoriaAtiva] = useState<{ slug: string; label: string } | null>(null)

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
      {/* Banner promocional */}
      <BannerCarrossel onCategoriaClick={setCategoriaAtiva} />

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
              className="group relative rounded-xl overflow-hidden aspect-square animate-fade-in-up hover:shadow-soft hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer"
            >
              <img src={getImagemCategoria(label)} alt={label} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <span className="absolute bottom-1.5 left-0 right-0 text-center text-white text-[11px] font-bold leading-tight px-1">
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Ofertas em destaque */}
      <VitrineOfertas />

      {/* Busca semântica */}
      <Card className="mb-8">
        <h1 className="text-base font-bold text-lm-dark mb-0.5">Busca inteligente</h1>
        <p className="text-xs text-gray-400 mb-4">Descreva com suas palavras — a IA encontra o produto certo</p>
        <SearchSection key={initialQuery ?? 'default'} initialQuery={initialQuery} />
      </Card>

      {/* Info bar */}
      <div className="grid grid-cols-3 gap-4 text-center text-xs text-gray-500">
        <Card padding="sm">
          <p className="font-bold text-lm-dark text-base">5.000+</p>
          <p>produtos disponíveis</p>
        </Card>
        <Card padding="sm">
          <p className="font-bold text-lm-dark text-base">45</p>
          <p>lojas no Brasil</p>
        </Card>
        <Card padding="sm">
          <p className="font-bold text-lm-dark text-base">IA</p>
          <p>busca por linguagem natural</p>
        </Card>
      </div>
    </div>
  )
}
