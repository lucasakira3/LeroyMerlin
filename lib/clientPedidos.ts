const CHAVE = 'lm_pedidos_cliente'

export interface ItemPedido {
  produtoId: string
  nome: string
  preco: number
  quantidade: number
}

export interface Pedido {
  numero: string
  data: string
  itens: ItemPedido[]
  metodo: 'retirada' | 'entrega'
  loja?: string
  endereco?: string
  total: number
}

type Mapa = Record<string, Pedido[]>

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

export function getPedidos(email: string): Pedido[] {
  const mapa = lerMapa()
  const pedidos = mapa[email] ?? []
  return [...pedidos].sort((a, b) => b.data.localeCompare(a.data))
}

export function salvarPedido(email: string, pedido: Pedido): void {
  const mapa = lerMapa()
  const pedidos = mapa[email] ?? []
  pedidos.push(pedido)
  mapa[email] = pedidos
  salvarMapa(mapa)
}

export function gerarNumeroPedido(): string {
  return 'LM' + Date.now().toString(36).toUpperCase()
}
