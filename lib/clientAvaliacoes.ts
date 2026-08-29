// Mapa por produtoId -> lista de avaliações (uma por e-mail, upsert em salvarAvaliacao —
// avaliar de novo edita a anterior em vez de duplicar). Sem backend: getMedia() calcula
// a média na hora a partir da lista completa, não é um valor persistido separadamente.
const CHAVE = 'lm_avaliacoes_produtos'

export interface Avaliacao {
  email: string
  nota: number
  comentario?: string
  // Data URL JPEG já redimensionada (ver lib/imagemUtil.ts) — nunca o arquivo original,
  // pra não estourar a cota de localStorage com fotos de celular sem compressão.
  foto?: string
  data: string
}

type Mapa = Record<string, Avaliacao[]>

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

export function getAvaliacoes(produtoId: string): Avaliacao[] {
  const mapa = lerMapa()
  return mapa[produtoId] ?? []
}

export function getAvaliacaoDoUsuario(produtoId: string, email: string): Avaliacao | null {
  const avaliacoes = getAvaliacoes(produtoId)
  return avaliacoes.find(a => a.email === email) ?? null
}

export function salvarAvaliacao(produtoId: string, email: string, nota: number, comentario?: string, foto?: string): void {
  const mapa = lerMapa()
  const avaliacoes = mapa[produtoId] ?? []
  const notaClamp = Math.max(0, Math.min(5, Math.round(nota)))
  const nova: Avaliacao = { email, nota: notaClamp, comentario: comentario?.trim() || undefined, foto, data: new Date().toISOString() }
  const index = avaliacoes.findIndex(a => a.email === email)
  if (index === -1) {
    avaliacoes.push(nova)
  } else {
    avaliacoes[index] = nova
  }
  mapa[produtoId] = avaliacoes
  salvarMapa(mapa)
}

export function getMedia(produtoId: string): { media: number; total: number } {
  const avaliacoes = getAvaliacoes(produtoId)
  if (avaliacoes.length === 0) return { media: 0, total: 0 }
  const soma = avaliacoes.reduce((acc, a) => acc + a.nota, 0)
  return { media: soma / avaliacoes.length, total: avaliacoes.length }
}

export interface AvaliacaoComProduto extends Avaliacao {
  produtoId: string
}

// Sem índice reverso por e-mail — o mapa é pequeno (uma avaliação por produto por
// usuário), então varrer todas as chaves é barato e evita duplicar estado.
export function getAvaliacoesDoUsuario(email: string): AvaliacaoComProduto[] {
  const mapa = lerMapa()
  const resultado: AvaliacaoComProduto[] = []
  for (const [produtoId, avaliacoes] of Object.entries(mapa)) {
    const minha = avaliacoes.find(a => a.email === email)
    if (minha) resultado.push({ ...minha, produtoId })
  }
  return resultado.sort((a, b) => b.data.localeCompare(a.data))
}

export function removerAvaliacao(produtoId: string, email: string): void {
  const mapa = lerMapa()
  const avaliacoes = mapa[produtoId] ?? []
  mapa[produtoId] = avaliacoes.filter(a => a.email !== email)
  salvarMapa(mapa)
}
