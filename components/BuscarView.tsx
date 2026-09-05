'use client'

import { useSearchParams } from 'next/navigation'
import SearchSection from '@/components/SearchSection'
import Card from '@/components/ui/Card'

// Antes vivia junto com o painel de categorias em ProdutosView.tsx — usuário pediu pra
// separar de novo: "Buscar" (essa tela, com sua própria loja + busca por texto/foto + mapa,
// tudo dentro de SearchSection.tsx) e "Produtos" (categorias, cada uma com seu próprio
// seletor de loja embutido em CategoriaView.tsx) viram duas abas distintas no NavBar.
export default function BuscarView() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') ?? undefined

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">
      <Card>
        <h1 className="text-base font-bold text-lm-dark mb-0.5">Busca inteligente</h1>
        <p className="text-xs text-gray-400 mb-4">Descreva com suas palavras — a IA encontra o produto certo</p>
        <SearchSection key={initialQuery ?? 'default'} initialQuery={initialQuery} />
      </Card>
    </div>
  )
}
