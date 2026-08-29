// Persistência 100% local (sem backend, ver lib/clientAuth.ts) — só {produtoId, quantidade},
// funciona sem login. `salvarItens` dispara 'lm-carrinho-change' em toda mudança pra
// qualquer componente que mostre a contagem (CarrinhoIcon no header) atualizar sozinho,
// mesmo componentes que não chamaram a função que mudou o carrinho.
const CHAVE = 'lm_carrinho'

export interface CartItem {
  produtoId: string
  quantidade: number
}

function lerItens(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const bruto = window.localStorage.getItem(CHAVE)
    if (!bruto) return []
    const dados = JSON.parse(bruto)
    if (!Array.isArray(dados)) return []
    return dados
  } catch {
    return []
  }
}

function salvarItens(itens: CartItem[]): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(CHAVE, JSON.stringify(itens))
  window.dispatchEvent(new Event('lm-carrinho-change'))
}

export function getCarrinho(): CartItem[] {
  return lerItens()
}

export function getQuantidadeTotal(): number {
  return lerItens().reduce((soma, item) => soma + item.quantidade, 0)
}

export function adicionarAoCarrinho(produtoId: string, quantidade: number = 1): void {
  const itens = lerItens()
  const index = itens.findIndex(i => i.produtoId === produtoId)
  if (index === -1) {
    itens.push({ produtoId, quantidade })
  } else {
    itens[index] = { ...itens[index], quantidade: itens[index].quantidade + quantidade }
  }
  salvarItens(itens)
}

export function atualizarQuantidade(produtoId: string, quantidade: number): void {
  const itens = lerItens()
  if (quantidade <= 0) {
    salvarItens(itens.filter(i => i.produtoId !== produtoId))
    return
  }
  const index = itens.findIndex(i => i.produtoId === produtoId)
  if (index === -1) return
  itens[index] = { ...itens[index], quantidade }
  salvarItens(itens)
}

export function removerDoCarrinho(produtoId: string): void {
  const itens = lerItens()
  salvarItens(itens.filter(i => i.produtoId !== produtoId))
}

export function limparCarrinho(): void {
  salvarItens([])
}
