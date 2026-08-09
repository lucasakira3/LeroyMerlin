const CHAVE = 'lm_comparador'
const MAX_ITENS = 3

function lerIds(): string[] {
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

function salvarIds(ids: string[]): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(CHAVE, JSON.stringify(ids))
  window.dispatchEvent(new Event('lm-comparador-change'))
}

export function getComparador(): string[] {
  return lerIds()
}

export function estaNoComparador(produtoId: string): boolean {
  return lerIds().includes(produtoId)
}

export function toggleComparador(produtoId: string): 'added' | 'removed' | 'full' {
  const ids = lerIds()
  const index = ids.indexOf(produtoId)
  if (index !== -1) {
    ids.splice(index, 1)
    salvarIds(ids)
    return 'removed'
  }
  if (ids.length >= MAX_ITENS) {
    return 'full'
  }
  ids.push(produtoId)
  salvarIds(ids)
  return 'added'
}

export function removerDoComparador(produtoId: string): void {
  const ids = lerIds()
  salvarIds(ids.filter(id => id !== produtoId))
}

export function limparComparador(): void {
  salvarIds([])
}

export function definirComparador(ids: string[]): void {
  salvarIds(ids.slice(0, MAX_ITENS))
}
