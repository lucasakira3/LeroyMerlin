const CHAVE = 'lm_favoritos_produtos'

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
}

export function isFavorito(id: string): boolean {
  return lerIds().includes(id)
}

export function toggleFavorito(id: string): boolean {
  const ids = lerIds()
  const index = ids.indexOf(id)
  if (index === -1) {
    ids.push(id)
    salvarIds(ids)
    return true
  }
  ids.splice(index, 1)
  salvarIds(ids)
  return false
}

export function getFavoritosIds(): string[] {
  return lerIds()
}
