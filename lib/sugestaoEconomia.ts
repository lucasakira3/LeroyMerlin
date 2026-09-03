import type { ProdutoResolvido } from './produtosCliente'

export interface SugestaoTroca {
  itemAtual: ProdutoResolvido
  alternativa: ProdutoResolvido
  economia: number
}

// Dado o carrinho já resolvido (produto + quantidade), acha o melhor candidato a troca:
// pega o item mais caro (unitário) e pergunta pra API se existe algo mais barato na MESMA
// categoria exata (ver app/api/produto/[id]/alternativa/route.ts). Se não houver alternativa
// pro item mais caro, tenta o próximo mais caro — assim não trava a sugestão só porque o
// item nº1 do carrinho não tem substituto comparável.
export async function buscarSugestaoTroca(
  itens: { produto: ProdutoResolvido; quantidade: number }[]
): Promise<SugestaoTroca | null> {
  const ordenados = [...itens].sort((a, b) => b.produto.preco - a.produto.preco)

  for (const { produto } of ordenados.slice(0, 5)) {
    try {
      const resposta = await fetch(`/api/produto/${produto.id}/alternativa`)
      if (!resposta.ok) continue
      const dados = await resposta.json() as { alternativa: ProdutoResolvido | null }
      if (dados.alternativa) {
        return {
          itemAtual: produto,
          alternativa: dados.alternativa,
          economia: Math.round((produto.preco - dados.alternativa.preco) * 100) / 100,
        }
      }
    } catch {
      continue
    }
  }
  return null
}
