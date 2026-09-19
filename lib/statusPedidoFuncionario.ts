// Etapa do pedido definida À MÃO pelo funcionário (separar → pronto → entregue). Sem
// backend, isso vive em localStorage, então só vale no mesmo navegador do cliente — o
// suficiente pra demonstrar o ciclo completo (funcionário atualiza, cliente vê na timeline
// dele) e coerente com o resto do painel (lib/chamadosFuncionario.ts, lib/ajustesFuncionario.ts).
// Quando não há etapa manual, lib/statusPedido.ts continua calculando pelo tempo decorrido.
const CHAVE = 'lm_status_pedidos_funcionario'

type Mapa = Record<string, { etapa: number; atualizadoEm: string }>

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

export function getEtapaManual(numeroPedido: string): number | null {
  const item = lerMapa()[numeroPedido]
  return item && Number.isInteger(item.etapa) && item.etapa >= 0 ? item.etapa : null
}

export function definirEtapaManual(numeroPedido: string, etapa: number): void {
  if (typeof window === 'undefined') return
  const mapa = lerMapa()
  mapa[numeroPedido] = { etapa, atualizadoEm: new Date().toISOString() }
  window.localStorage.setItem(CHAVE, JSON.stringify(mapa))
  window.dispatchEvent(new Event('lm-status-pedido-change'))
}
