// Histórico de perguntas feitas no chat "Pergunte sobre este produto" (ver
// components/ProdutoDrawer.tsx), por e-mail — mesmo padrão de clientAvaliacoes.ts. Antes
// disso o chat não persistia em lugar nenhum, resetava toda vez que o drawer fechava.
const CHAVE = 'lm_perguntas_cliente'

export interface PerguntaSalva {
  id: string
  produtoId: string
  produtoNome: string
  pergunta: string
  resposta: string
  data: string
}

type Mapa = Record<string, PerguntaSalva[]>

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

export function getPerguntas(email: string): PerguntaSalva[] {
  const lista = lerMapa()[email] ?? []
  return [...lista].sort((a, b) => b.data.localeCompare(a.data))
}

export function salvarPergunta(email: string, dados: Omit<PerguntaSalva, 'id' | 'data'>): void {
  const mapa = lerMapa()
  const lista = mapa[email] ?? []
  lista.push({ ...dados, id: Date.now().toString(36), data: new Date().toISOString() })
  mapa[email] = lista
  salvarMapa(mapa)
}

export function removerPergunta(email: string, id: string): void {
  const mapa = lerMapa()
  mapa[email] = (mapa[email] ?? []).filter(p => p.id !== id)
  salvarMapa(mapa)
}
