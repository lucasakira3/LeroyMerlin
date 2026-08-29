// Histórico de produtos visitados (Minha Conta), não por e-mail — lista global de até 12,
// mais recente primeiro. addAoHistorico remove qualquer entrada duplicada do mesmo produto
// antes de reinserir no topo, então revisitar um produto só reordena, não duplica.
const CHAVE = 'lm_historico_produtos'
const LIMITE = 12

interface EntradaHistorico {
  id: string
  visitadoEm: number
}

function lerEntradas(): EntradaHistorico[] {
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

function salvarEntradas(entradas: EntradaHistorico[]): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(CHAVE, JSON.stringify(entradas))
}

export function addAoHistorico(id: string): void {
  if (typeof window === 'undefined') return
  const entradas = lerEntradas().filter((entrada) => entrada.id !== id)
  entradas.unshift({ id, visitadoEm: Date.now() })
  salvarEntradas(entradas.slice(0, LIMITE))
}

export function getHistoricoIds(): string[] {
  return lerEntradas().map((entrada) => entrada.id)
}
