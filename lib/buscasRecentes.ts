// Últimas buscas do usuário — global, sem login (mesmo padrão de clientFavoritos.ts),
// usado só pra sugerir buscas recentes ao focar o campo antes de digitar. Sem evento de
// mudança: é lido sob demanda (no focus do input), não precisa de reatividade em tempo real.
const CHAVE = 'lm_buscas_recentes'
const MAX_BUSCAS = 5

function lerBuscas(): string[] {
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

export function getBuscasRecentes(): string[] {
  return lerBuscas()
}

export function registrarBusca(query: string): void {
  if (typeof window === 'undefined') return
  const termo = query.trim()
  if (!termo) return
  const atuais = lerBuscas().filter(b => b.toLowerCase() !== termo.toLowerCase())
  const novas = [termo, ...atuais].slice(0, MAX_BUSCAS)
  window.localStorage.setItem(CHAVE, JSON.stringify(novas))
}
