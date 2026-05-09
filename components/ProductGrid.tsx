import ProductCard from './ProductCard'
import type { SearchResult } from '@/types/produto'

export default function ProductGrid({ resultados }: { resultados: SearchResult[] }) {
  if (resultados.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-8">
        Nenhum produto encontrado. Tente outras palavras.
      </p>
    )
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-200">
      {resultados.map((result) => (
        <ProductCard key={result.produto.id} result={result} />
      ))}
    </div>
  )
}
