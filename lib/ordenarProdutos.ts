import { getMedia } from './clientAvaliacoes'

export type CriterioOrdenacao = 'relevancia' | 'menor-preco' | 'maior-preco' | 'melhor-avaliado'

export const OPCOES_ORDENACAO: { valor: CriterioOrdenacao; label: string }[] = [
  { valor: 'relevancia', label: 'Relevância' },
  { valor: 'menor-preco', label: 'Menor preço' },
  { valor: 'maior-preco', label: 'Maior preço' },
  { valor: 'melhor-avaliado', label: 'Mais bem avaliado' },
]

// Genérica sobre o formato do item (CategoriaView usa o produto direto, SearchSection
// usa SearchResult) via extratores em vez de um shape fixo — evita duplicar a lógica de
// ordenação em cada tela. Nunca muta o array recebido: várias telas guardam o resultado
// "cru" em estado e recalculam a ordenação a cada render via useMemo.
export function ordenarProdutos<T>(
  itens: T[],
  criterio: CriterioOrdenacao,
  getId: (item: T) => string,
  getPreco: (item: T) => number
): T[] {
  if (criterio === 'relevancia') return itens
  const copia = [...itens]
  if (criterio === 'menor-preco') return copia.sort((a, b) => getPreco(a) - getPreco(b))
  if (criterio === 'maior-preco') return copia.sort((a, b) => getPreco(b) - getPreco(a))
  // melhor-avaliado: maior média primeiro; empate de nota desempata por mais avaliações
  // (mais confiável que uma nota 5.0 baseada numa única avaliação)
  return copia.sort((a, b) => {
    const ma = getMedia(getId(a))
    const mb = getMedia(getId(b))
    if (mb.media !== ma.media) return mb.media - ma.media
    return mb.total - ma.total
  })
}
