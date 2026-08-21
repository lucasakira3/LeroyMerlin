import type { SearchResult } from '@/types/produto'

export interface ItemProjeto {
  material: string
  categoria: string
  quantidade: string
  prioridade: string
  observacao: string
  comodo: string
  resultados: SearchResult[]
  etapa_ordem?: number
  etapa_nome?: string
}

export interface Projeto {
  titulo: string
  resumo: string
  orcamento_estimado: string
  complexidade: string
  dica_especialista: string
  itens: ItemProjeto[]
}

export interface GrupoComodo {
  comodo: string
  itens: ItemProjeto[]
}

export function agruparPorComodo(itens: ItemProjeto[]): GrupoComodo[] {
  const ordem: string[] = []
  const grupos = new Map<string, ItemProjeto[]>()

  for (const item of itens) {
    const nome = item.comodo || 'Geral'
    if (!grupos.has(nome)) {
      grupos.set(nome, [])
      ordem.push(nome)
    }
    grupos.get(nome)!.push(item)
  }

  const semGeral = ordem.filter(n => n !== 'Geral')
  const ordemFinal = ordem.includes('Geral') ? [...semGeral, 'Geral'] : semGeral

  return ordemFinal.map(nome => ({ comodo: nome, itens: grupos.get(nome)! }))
}

export function resolverProdutoSelecionado(
  item: ItemProjeto,
  selecionados: Set<string>
): SearchResult['produto'] | null {
  const selecionado = item.resultados.find(r => selecionados.has(r.produto.id))
  if (selecionado) return selecionado.produto
  return item.resultados[0]?.produto ?? null
}
