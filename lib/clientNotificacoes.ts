export type TipoNotificacao = 'pedido' | 'agendamento' | 'entrevista'

export interface Notificacao {
  id: string
  tipo: TipoNotificacao
  titulo: string
  mensagem: string
  href: string
  criadaEm: string
  lida: boolean
}

const CHAVE = 'lm_notificacoes'
const LIMITE = 20

type Mapa = Record<string, Notificacao[]>

function normalizar(email: string): string {
  return email.trim().toLowerCase()
}

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
  window.dispatchEvent(new Event('lm-notificacoes-change'))
}

export function adicionarNotificacao(email: string, dados: Omit<Notificacao, 'id' | 'criadaEm' | 'lida'>): void {
  const mapa = lerMapa()
  const chave = normalizar(email)
  const lista = mapa[chave] ?? []
  const notificacao: Notificacao = {
    ...dados,
    id: `NT-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    criadaEm: new Date().toISOString(),
    lida: false,
  }
  mapa[chave] = [notificacao, ...lista].slice(0, LIMITE)
  salvarMapa(mapa)
}

export function getNotificacoes(email: string): Notificacao[] {
  return lerMapa()[normalizar(email)] ?? []
}

export function marcarComoLida(email: string, id: string): void {
  const mapa = lerMapa()
  const chave = normalizar(email)
  const lista = mapa[chave] ?? []
  mapa[chave] = lista.map(n => (n.id === id ? { ...n, lida: true } : n))
  salvarMapa(mapa)
}

export function marcarTodasComoLidas(email: string): void {
  const mapa = lerMapa()
  const chave = normalizar(email)
  const lista = mapa[chave] ?? []
  mapa[chave] = lista.map(n => ({ ...n, lida: true }))
  salvarMapa(mapa)
}

export function getQuantidadeNaoLida(email: string): number {
  return getNotificacoes(email).filter(n => !n.lida).length
}
