// "Botão de Ajuda no Corredor": o cliente pede ajuda de dentro do drawer do produto,
// já informando corredor + produto — sem precisar procurar um funcionário na loja.
// Mesmo padrão de store local usado em clientNotificacoes.ts / chamadosFuncionario.ts
// (localStorage + CustomEvent pra sincronizar entre componentes na mesma aba).
const CHAVE = 'lm_pedidos_ajuda'
const LIMITE = 50

export interface PedidoAjuda {
  id: string
  produtoId: string
  produtoNome: string
  corredor: string
  clienteNome?: string
  criadoEm: string
  atendido: boolean
}

function ler(): PedidoAjuda[] {
  if (typeof window === 'undefined') return []
  try {
    const bruto = window.localStorage.getItem(CHAVE)
    if (!bruto) return []
    const dados = JSON.parse(bruto)
    return Array.isArray(dados) ? dados : []
  } catch {
    return []
  }
}

function salvar(lista: PedidoAjuda[]): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(CHAVE, JSON.stringify(lista))
  window.dispatchEvent(new Event('lm-ajuda-corredor-change'))
}

export function solicitarAjuda(dados: {
  produtoId: string
  produtoNome: string
  corredor: string
  clienteNome?: string
}): PedidoAjuda {
  const pedido: PedidoAjuda = {
    ...dados,
    id: `AJ-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    criadoEm: new Date().toISOString(),
    atendido: false,
  }
  salvar([pedido, ...ler()].slice(0, LIMITE))
  return pedido
}

export function getPedidosAjuda(): PedidoAjuda[] {
  return ler()
}

export function marcarAjudaAtendida(id: string): void {
  salvar(ler().map(p => (p.id === id ? { ...p, atendido: true } : p)))
}
