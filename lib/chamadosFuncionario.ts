// Estado do funcionário sobre um "chamado" — que aqui é um Agendamento real de visita
// (ver components/AgendamentosLista.tsx), não um ticket de suporte inventado. Guardado à
// parte do status confirmado/cancelado do próprio agendamento (esse é do cliente) pra não
// mexer num tipo compartilhado com o lado do cliente.
const CHAVE = 'lm_chamados_funcionario'

export interface NotaChamado {
  texto: string
  data: string
}

interface EstadoChamado {
  atendido: boolean
  notas: NotaChamado[]
}

type Mapa = Record<string, EstadoChamado>

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

export function getEstadoChamado(agendamentoId: string): EstadoChamado {
  return lerMapa()[agendamentoId] ?? { atendido: false, notas: [] }
}

export function adicionarNota(agendamentoId: string, texto: string): void {
  const mapa = lerMapa()
  const atual = mapa[agendamentoId] ?? { atendido: false, notas: [] }
  mapa[agendamentoId] = { ...atual, notas: [...atual.notas, { texto, data: new Date().toISOString() }] }
  salvarMapa(mapa)
}

export function marcarAtendido(agendamentoId: string, atendido: boolean): void {
  const mapa = lerMapa()
  const atual = mapa[agendamentoId] ?? { atendido: false, notas: [] }
  mapa[agendamentoId] = { ...atual, atendido }
  salvarMapa(mapa)
}
