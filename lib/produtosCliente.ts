import type { SearchResult } from '@/types/produto'

export type ProdutoResolvido = SearchResult['produto']

export async function buscarProdutosPorIds(ids: string[]): Promise<ProdutoResolvido[]> {
  const respostas = await Promise.all(
    ids.map(async (id) => {
      const resposta = await fetch(`/api/produto/${id}`)
      if (!resposta.ok) return null
      return (await resposta.json()) as ProdutoResolvido
    })
  )
  return respostas.filter((p): p is ProdutoResolvido => p !== null)
}
