// Ajustes de estoque/preço feitos pelo funcionário — camada só do lado do funcionário.
// data/produtos.json não é gravável a partir do navegador (não existe rota de escrita),
// então os ajustes ficam num overlay em localStorage: soma-se ao valor base do catálogo
// na hora de exibir. De propósito NÃO reflete no catálogo que o cliente vê (isso seria
// uma feature maior — "estoque compartilhado" — combinada à parte, não implícita aqui).
const CHAVE = 'lm_ajustes_funcionario'

interface Ajuste {
  estoqueDelta: number
  precoOverride?: number
}

type Mapa = Record<string, Ajuste>

function lerMapa(): Mapa {
  if (typeof window === 'undefined') return {}
  try {
    const bruto = window.localStorage.getItem(CHAVE)
    if (!bruto) return {}
    const dados = JSON.parse(bruto)
    if (!dados || typeof dados !== 'object' || Array.isArray(dados)) return {}
    return dados
  } catch {
    return {}
  }
}

function salvarMapa(mapa: Mapa): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(CHAVE, JSON.stringify(mapa))
}

export function getAjuste(produtoId: string): Ajuste {
  return lerMapa()[produtoId] ?? { estoqueDelta: 0 }
}

export function ajustarEstoque(produtoId: string, delta: number): void {
  const mapa = lerMapa()
  const atual = mapa[produtoId] ?? { estoqueDelta: 0 }
  mapa[produtoId] = { ...atual, estoqueDelta: atual.estoqueDelta + delta }
  salvarMapa(mapa)
}

export function definirPreco(produtoId: string, preco: number): void {
  const mapa = lerMapa()
  const atual = mapa[produtoId] ?? { estoqueDelta: 0 }
  mapa[produtoId] = { ...atual, precoOverride: preco }
  salvarMapa(mapa)
}

export function aplicarAjustes<T extends { id: string; preco: number; estoque: number }>(produto: T): T {
  const ajuste = getAjuste(produto.id)
  return {
    ...produto,
    preco: ajuste.precoOverride ?? produto.preco,
    estoque: Math.max(0, produto.estoque + ajuste.estoqueDelta),
  }
}
