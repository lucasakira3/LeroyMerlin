// Mesmo padrão de lib/clientCarrinho.ts: persistência 100% local, sem backend, funciona
// sem login. Guarda um único número (o teto de gasto que o cliente definiu pra essa
// compra) e dispara 'lm-orcamento-change' em toda mudança pra qualquer componente que
// mostre o valor (TermometroOrcamento) atualizar sozinho.
const CHAVE = 'lm_orcamento_valor'

export function getOrcamento(): number | null {
  if (typeof window === 'undefined') return null
  const bruto = window.localStorage.getItem(CHAVE)
  if (!bruto) return null
  const valor = Number(bruto)
  return Number.isFinite(valor) && valor > 0 ? valor : null
}

export function definirOrcamento(valor: number): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(CHAVE, String(valor))
  window.dispatchEvent(new Event('lm-orcamento-change'))
}

export function limparOrcamento(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(CHAVE)
  window.dispatchEvent(new Event('lm-orcamento-change'))
}
