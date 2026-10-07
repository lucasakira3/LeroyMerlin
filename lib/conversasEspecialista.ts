// Chat real (não IA) entre cliente e funcionário — card "Especialista" em /duvidas. Uma
// conversa por cliente (por e-mail), igual clientPedidos.ts/clientAvaliacoes.ts. Sem
// backend, então "refletir pro funcionário" funciona via localStorage compartilhado: o
// evento nativo `storage` dispara nas OUTRAS abas do mesmo navegador quando uma muda o
// localStorage — é assim que a aba do funcionário (`/funcionario/chamados`) enxerga uma
// mensagem nova do cliente sem precisar de servidor.
const CHAVE = 'lm_conversas_especialista'

export interface MensagemEspecialista {
  // Identidade da mensagem entre aparelhos (lib/sync). Não pode ser a hora: a hora é
  // corrigida pelo servidor quando o relógio do aparelho está errado, e cada aparelho passa
  // a mostrar a hora corrigida. Ausente em mensagens antigas (aí vale e-mail + hora + autor).
  id?: string
  autor: 'cliente' | 'funcionario'
  texto: string
  data: string
}

export interface ConversaEspecialista {
  clienteEmail: string
  clienteNome: string
  mensagens: MensagemEspecialista[]
  // Fica true quando um funcionário encerra o atendimento; volta pra false sozinho se o
  // cliente mandar mensagem de novo, pra não sumir da fila de pendentes por engano.
  atendida: boolean
  // Quando o funcionário encerrou. É o que vai pro banco (lib/sync): com a hora, dois
  // aparelhos chegam à mesma resposta sobre a conversa estar encerrada ou não — é encerrada
  // se não houver mensagem do cliente depois dessa hora. Ausente em conversas antigas.
  atendidaEm?: string | null
  atualizadoEm: string
}

type Mapa = Record<string, ConversaEspecialista>

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
  window.dispatchEvent(new Event('lm-conversa-especialista-change'))
}

export function getConversa(email: string): ConversaEspecialista | null {
  return lerMapa()[email] ?? null
}

export function getConversas(): ConversaEspecialista[] {
  return Object.values(lerMapa()).sort((a, b) => b.atualizadoEm.localeCompare(a.atualizadoEm))
}

export function enviarMensagemEspecialista(
  email: string,
  nome: string,
  autor: 'cliente' | 'funcionario',
  texto: string,
): void {
  const mapa = lerMapa()
  const atual = mapa[email] ?? {
    clienteEmail: email,
    clienteNome: nome,
    mensagens: [],
    atendida: false,
    atualizadoEm: new Date().toISOString(),
  }
  const nova: MensagemEspecialista = {
    id: `MS-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    autor,
    texto,
    data: new Date().toISOString(),
  }
  mapa[email] = {
    ...atual,
    clienteNome: nome || atual.clienteNome,
    mensagens: [...atual.mensagens, nova],
    atendida: autor === 'cliente' ? false : atual.atendida,
    atualizadoEm: nova.data,
  }
  salvarMapa(mapa)
}

export function marcarConversaAtendida(email: string, atendida: boolean): void {
  const mapa = lerMapa()
  const atual = mapa[email]
  if (!atual) return
  mapa[email] = { ...atual, atendida, atendidaEm: atendida ? new Date().toISOString() : null }
  salvarMapa(mapa)
}
