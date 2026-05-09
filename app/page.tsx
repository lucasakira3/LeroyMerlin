'use client'

import { useState } from 'react'
import SearchSection from '@/components/SearchSection'
import CategoriaView from '@/components/CategoriaView'
import { Grid2x2, Zap, Droplets, Hammer, Palette, Flower2, Lightbulb, BrickWall } from 'lucide-react'

const CATEGORIAS = [
  { slug: 'ferramentas', label: 'Ferramentas', icon: Hammer,    cor: 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100' },
  { slug: 'eletrica',    label: 'Elétrica',    icon: Zap,       cor: 'bg-yellow-50 text-yellow-600 border-yellow-200 hover:bg-yellow-100' },
  { slug: 'hidraulica',  label: 'Hidráulica',  icon: Droplets,  cor: 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100' },
  { slug: 'pintura',     label: 'Pintura',     icon: Palette,   cor: 'bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100' },
  { slug: 'jardim',      label: 'Jardim',      icon: Flower2,   cor: 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100' },
  { slug: 'iluminacao',  label: 'Iluminação',  icon: Lightbulb, cor: 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100' },
  { slug: 'construcao',  label: 'Construção',  icon: BrickWall, cor: 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100' },
  { slug: 'todos',       label: 'Todos',       icon: Grid2x2,   cor: 'bg-lm-green/10 text-lm-green border-lm-green/30 hover:bg-lm-green/20' },
]

export default function Home() {
  const [categoriaAtiva, setCategoriaAtiva] = useState<{ slug: string; label: string } | null>(null)

  if (categoriaAtiva) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6">
        <CategoriaView
          slug={categoriaAtiva.slug}
          label={categoriaAtiva.label}
          onBack={() => setCategoriaAtiva(null)}
        />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Categorias */}
      <div className="mb-6">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
          Navegar por categoria
        </h2>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {CATEGORIAS.map(({ slug, label, icon: Icon, cor }) => (
            <button
              key={slug}
              onClick={() => setCategoriaAtiva({ slug, label })}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-semibold transition-all hover:shadow-sm active:scale-95 cursor-pointer ${cor}`}
            >
              <Icon size={22} />
              <span className="text-center leading-tight">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Busca semântica */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 mb-6">
        <h1 className="text-base font-bold text-lm-dark mb-0.5">Busca inteligente</h1>
        <p className="text-xs text-gray-400 mb-4">Descreva com suas palavras — a IA encontra o produto certo</p>
        <SearchSection />
      </div>

      {/* Info bar */}
      <div className="grid grid-cols-3 gap-3 text-center text-xs text-gray-500">
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <p className="font-bold text-lm-dark text-base">5.000+</p>
          <p>produtos disponíveis</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <p className="font-bold text-lm-dark text-base">45</p>
          <p>lojas no Brasil</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <p className="font-bold text-lm-dark text-base">IA</p>
          <p>busca por linguagem natural</p>
        </div>
      </div>
    </div>
  )
}
