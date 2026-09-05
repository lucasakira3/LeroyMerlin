'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import CategoriaView from '@/components/CategoriaView'
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
  )
}
