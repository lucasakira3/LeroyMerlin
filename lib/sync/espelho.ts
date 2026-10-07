// Conversa entre a cópia que cada aparelho guarda no navegador (localStorage, do jeito que
// os módulos lib/client*.ts já gravavam) e as linhas das tabelas do Supabase.
//
// Duas funções puras, sem tocar em localStorage nem em rede — o lib/sync/motor.ts é quem
// lê, grava e chama o servidor:
//   linhasLocais(estado)            aparelho → banco: o estado local virado em linhas
//   mesclarRemoto(estado, ...)      banco → aparelho: junta o que veio dos outros aparelhos
//
// As regras de "quem ganha" são as mesmas dos gatilhos em supabase/schema.sql, e todas só
// andam pra frente (atendido não volta a pendente, cancelado não volta a confirmado, vale a
// etapa mais recente). Por isso aplicar a mesma mudança duas vezes, ou fora de ordem, dá o
// mesmo resultado — o motor pode repetir um envio ou uma busca sem medo.
import type { Pedido } from '../clientPedidos'
import type { PedidoAjuda } from '../ajudaCorredor'
import type { NotaChamado } from '../chamadosFuncionario'
import type { ConversaEspecialista } from '../conversasEspecialista'
import type { Agendamento } from '../../components/AgendamentosLista'
import type { Linha, Lote, Remocao, Tabela } from './tabelas'

// Onde cada parte mora no localStorage.
export const CHAVES = {
  pedidos: 'lm_pedidos_cliente',
  status: 'lm_status_pedidos_funcionario',
  contas: 'lm_contas_cliente',
  // Nome dos clientes de OUTROS aparelhos, recebidos do banco. Fica separado de `contas`
  // (as contas criadas neste navegador, com senha) pra não misturar com o login daqui.
  clientesRemotos: 'lm_clientes_remotos',
  ajuda: 'lm_pedidos_ajuda',
  agendamentos: 'lm_agendamentos',
  chamados: 'lm_chamados_funcionario',
  conversas: 'lm_conversas_especialista',
} as const

export type ParteLocal = keyof typeof CHAVES

export interface EstadoLocal {
  pedidos: Record<string, Pedido[]>
  status: Record<string, { etapa: number; atualizadoEm: string }>
  contas: Record<string, { nome: string; criadoEm: string }>
  clientesRemotos: Record<string, { nome: string; criadoEm: string }>
  ajuda: PedidoAjuda[]
  agendamentos: Agendamento[]
  chamados: Record<string, { atendido: boolean; notas: NotaChamado[] }>
  conversas: Record<string, ConversaEspecialista>
}

export function estadoVazio(): EstadoLocal {
  return { pedidos: {}, status: {}, contas: {}, clientesRemotos: {}, ajuda: [], agendamentos: [], chamados: {}, conversas: {} }
}

const LIMITE_AJUDA = 50 // mesmo limite de lib/ajudaCorredor.ts

function ms(data: unknown): number {
  const t = typeof data === 'string' || typeof data === 'number' ? new Date(data).getTime() : NaN
  return Number.isFinite(t) ? t : NaN
}

// Data em ISO (o formato que o site grava) ou null se não for uma data. O banco devolve
// "+00:00" no lugar do "Z"; passar tudo por aqui deixa as duas pontas iguais.
function iso(data: unknown): string | null {
  const t = ms(data)
  return Number.isNaN(t) ? null : new Date(t).toISOString()
}

function texto(valor: unknown): string | null {
  return typeof valor === 'string' && valor.trim() !== '' ? valor : null
}

// Mensagens novas já nascem com `id` (lib/conversasEspecialista.ts). As antigas não têm:
// pra elas a identidade é e-mail + hora + autor.
export function idDaMensagem(email: string, mensagem: { id?: string; data: string; autor: string }): string {
  return mensagem.id || `${email}|${iso(mensagem.data) ?? mensagem.data}|${mensagem.autor}`
}

export function chaveDaLinha(tabela: string, id: string): string {
  return `${tabela}:${id}`
}

// JSON com as chaves em ordem fixa: a mesma linha sempre dá o mesmo texto, não importa a
// ordem em que o objeto foi montado.
function jsonEstavel(valor: unknown): string {
  if (Array.isArray(valor)) return `[${valor.map(jsonEstavel).join(',')}]`
  if (valor && typeof valor === 'object') {
    const objeto = valor as Record<string, unknown>
    return `{${Object.keys(objeto).sort().filter(k => objeto[k] !== undefined).map(k => `${JSON.stringify(k)}:${jsonEstavel(objeto[k])}`).join(',')}}`
  }
  return JSON.stringify(valor ?? null)
}

// Impressão digital curta da linha (FNV-1a). O motor guarda a de cada linha já enviada e
// reenvia só quando ela muda — é assim que ele sabe o que mudou neste aparelho sem que cada
// tela precise avisar.
export function hashDaLinha(linha: Linha): string {
  const s = jsonEstavel(linha)
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return `${(h >>> 0).toString(36)}.${s.length.toString(36)}`
}

// ── aparelho → banco ─────────────────────────────────────────────────────────────────

export function linhasLocais(estado: EstadoLocal): Record<Tabela, Linha[]> {
  const emailDoPedido = new Map<string, string>()
  const pedidos: Linha[] = []
  for (const [email, lista] of Object.entries(estado.pedidos)) {
    for (const pedido of Array.isArray(lista) ? lista : []) {
      const feitoEm = iso(pedido?.data)
      if (!pedido?.numero || !feitoEm) continue
      emailDoPedido.set(pedido.numero, email)
      pedidos.push({
        id: pedido.numero,
        cliente_email: email,
        // Pedidos antigos não têm `metodo`; lib/statusPedido.ts já trata isso como entrega.
        metodo: pedido.metodo === 'retirada' ? 'retirada' : 'entrega',
        total: Number(pedido.total) || 0,
        feito_em: feitoEm,
        dados: pedido,
      })
    }
  }

  const pedidosStatus: Linha[] = []
  for (const [numero, item] of Object.entries(estado.status)) {
    const definidaEm = iso(item?.atualizadoEm)
    const email = emailDoPedido.get(numero)
    // Sem o pedido neste aparelho a etapa não tem dono: é o que sobra depois de "apagar meus
    // dados" (que tira o pedido, mas não este mapa). Mandá-la recriaria no banco a etapa de
    // um pedido que acabou de ser apagado.
    if (!email || !definidaEm || !Number.isInteger(item.etapa) || item.etapa < 0) continue
    pedidosStatus.push({ id: numero, cliente_email: email, etapa: item.etapa, definida_em: definidaEm })
  }

  const clientes: Linha[] = Object.entries(estado.contas)
    .filter(([email]) => email.trim() !== '')
    .map(([email, conta]) => ({ id: email, nome: conta?.nome ?? '', criado_em: iso(conta?.criadoEm) }))

  const ajudaCorredor: Linha[] = []
  for (const pedido of estado.ajuda) {
    const pedidoEm = iso(pedido?.criadoEm)
    if (!pedido?.id || !pedidoEm) continue
    ajudaCorredor.push({
      id: pedido.id,
      produto_id: pedido.produtoId ?? '',
      produto_nome: pedido.produtoNome ?? '',
      corredor: pedido.corredor ?? '',
      cliente_nome: texto(pedido.clienteNome),
      pedido_em: pedidoEm,
      atendido: !!pedido.atendido,
    })
  }

  const agendamentos: Linha[] = estado.agendamentos
    .filter(a => !!a?.id)
    .map(a => ({
      id: a.id,
      cliente_email: texto(a.email),
      cliente_nome: texto(a.nome),
      servico: texto(a.servicoLabel) ?? texto(a.servico),
      loja: texto(a.loja),
      data: texto(a.data),
      horario: texto(a.horario),
      status: a.status === 'cancelado' ? 'cancelado' : 'confirmado',
      dados: a,
    }))

  const chamados: Linha[] = Object.entries(estado.chamados).map(([id, estadoDoChamado]) => ({
    id,
    atendido: !!estadoDoChamado?.atendido,
    notas: Array.isArray(estadoDoChamado?.notas) ? estadoDoChamado.notas : [],
  }))

  const conversas: Linha[] = []
  const mensagens: Linha[] = []
  for (const [email, conversa] of Object.entries(estado.conversas)) {
    if (!conversa) continue
    conversas.push({
      id: email,
      cliente_nome: texto(conversa.clienteNome),
      // Conversas encerradas antes de existir `atendidaEm` só têm o sim/não: vale a hora
      // da última mudança.
      atendida_em: iso(conversa.atendidaEm) ?? (conversa.atendida ? iso(conversa.atualizadoEm) : null),
    })
    for (const mensagem of Array.isArray(conversa.mensagens) ? conversa.mensagens : []) {
      const enviadaEm = iso(mensagem?.data)
      if (!enviadaEm || (mensagem.autor !== 'cliente' && mensagem.autor !== 'funcionario')) continue
      mensagens.push({ id: idDaMensagem(email, mensagem), cliente_email: email, autor: mensagem.autor, texto: mensagem.texto ?? '', enviada_em: enviadaEm })
    }
  }

  return { clientes, pedidos, pedidos_status: pedidosStatus, ajuda_corredor: ajudaCorredor, agendamentos, chamados, conversas, mensagens }
}

// ── banco → aparelho ─────────────────────────────────────────────────────────────────

// "AG-1759680000000" → 1759680000000: o id do agendamento carrega a hora em que foi criado,
// e é por ela que a lista fica com os mais novos primeiro (o campo `criadoEm` é um texto
// "dd/mm/aaaa, hh:mm:ss", ruim de ordenar).
function ordemDoAgendamento(id: string): number {
  const n = Number(/^AG-(\d+)$/.exec(id)?.[1])
  return Number.isFinite(n) ? n : 0
}

function conversaEstaAtendida(conversa: ConversaEspecialista): boolean {
  const encerradaEm = ms(conversa.atendidaEm)
  if (Number.isNaN(encerradaEm)) return false
  // Mensagem do cliente depois do encerramento reabre a conversa (mesma regra de
  // lib/conversasEspecialista.ts).
  return !conversa.mensagens.some(m => m.autor === 'cliente' && ms(m.data) > encerradaEm)
}

export function mesclarRemoto(
  estadoAtual: EstadoLocal,
  tabelas: Lote,
  remocoes: Remocao[] = []
): { estado: EstadoLocal; alteradas: ParteLocal[] } {
  const estado: EstadoLocal = JSON.parse(JSON.stringify(estadoAtual))

  // Quando cada coisa foi apagada, pra descartar linha que chegou na mesma resposta mas é
  // ANTERIOR ao apagamento. Acontece quando o aparelho pergunta no meio de um apagamento: a
  // consulta de mensagens roda antes dele e a de remoções, depois. Sem isto a conversa era
  // removida no passo 1 e recriada, vazia, no passo 2.
  const apagadoEm = new Map<string, number>()
  for (const remocao of remocoes) {
    const quando = ms(remocao.removido_em)
    if (!Number.isNaN(quando)) apagadoEm.set(chaveDaLinha(remocao.tabela, remocao.id), quando)
  }
  // `dono` = o que precisa continuar existindo pra linha fazer sentido (a etapa depende do
  // pedido, a mensagem depende da conversa...).
  const sobreviveu = (tabelaDoDono: string, idDoDono: unknown, linha: Linha): boolean => {
    const quando = typeof idDoDono === 'string' ? apagadoEm.get(chaveDaLinha(tabelaDoDono, idDoDono)) : undefined
    const gravadaEm = ms(linha.atualizado_em)
    return quando === undefined || Number.isNaN(gravadaEm) || gravadaEm > quando
  }
  const vivas: Lote = {
    clientes: tabelas.clientes?.filter(l => sobreviveu('clientes', l.id, l)),
    pedidos: tabelas.pedidos?.filter(l => sobreviveu('pedidos', l.id, l)),
    pedidos_status: tabelas.pedidos_status?.filter(l => sobreviveu('pedidos', l.id, l)),
    ajuda_corredor: tabelas.ajuda_corredor,
    agendamentos: tabelas.agendamentos?.filter(l => sobreviveu('agendamentos', l.id, l)),
    chamados: tabelas.chamados?.filter(l => sobreviveu('agendamentos', l.id, l)),
    conversas: tabelas.conversas?.filter(l => sobreviveu('conversas', l.id, l)),
    mensagens: tabelas.mensagens?.filter(l => sobreviveu('conversas', l.cliente_email, l)),
  }
  tabelas = vivas

  // 1) O que foi apagado em outro aparelho sai daqui também.
  for (const remocao of remocoes) {
    if (remocao.tabela === 'pedidos') {
      for (const email of Object.keys(estado.pedidos)) {
        estado.pedidos[email] = estado.pedidos[email].filter(p => p.numero !== remocao.id)
        if (estado.pedidos[email].length === 0) delete estado.pedidos[email]
      }
      delete estado.status[remocao.id]
    } else if (remocao.tabela === 'agendamentos') {
      estado.agendamentos = estado.agendamentos.filter(a => a.id !== remocao.id)
      delete estado.chamados[remocao.id]
    } else if (remocao.tabela === 'conversas') {
      delete estado.conversas[remocao.id]
    } else if (remocao.tabela === 'clientes') {
      delete estado.clientesRemotos[remocao.id]
    }
  }

  // 2) O que foi criado ou mudou em outro aparelho.
  for (const linha of tabelas.clientes ?? []) {
    estado.clientesRemotos[linha.id] = { nome: typeof linha.nome === 'string' ? linha.nome : '', criadoEm: iso(linha.criado_em) ?? '' }
  }

  for (const linha of tabelas.pedidos ?? []) {
    const email = typeof linha.cliente_email === 'string' ? linha.cliente_email : ''
    const pedido = linha.dados as Pedido | null
    if (!email || !pedido || typeof pedido !== 'object' || pedido.numero !== linha.id) continue
    const lista = estado.pedidos[email] ?? []
    if (lista.some(p => p.numero === pedido.numero)) continue
    estado.pedidos[email] = [...lista, pedido]
  }

  for (const linha of tabelas.pedidos_status ?? []) {
    const definidaEm = iso(linha.definida_em)
    const etapa = Number(linha.etapa)
    if (!definidaEm || !Number.isInteger(etapa)) continue
    const local = estado.status[linha.id]
    if (local && !(ms(definidaEm) > ms(local.atualizadoEm))) continue
    estado.status[linha.id] = { etapa, atualizadoEm: definidaEm }
  }

  let chegouAjudaNova = false
  for (const linha of tabelas.ajuda_corredor ?? []) {
    const local = estado.ajuda.find(p => p.id === linha.id)
    if (local) {
      if (linha.atendido === true) local.atendido = true
      continue
    }
    const criadoEm = iso(linha.pedido_em)
    if (!criadoEm) continue
    const nome = texto(linha.cliente_nome)
    estado.ajuda.push({
      id: linha.id,
      produtoId: String(linha.produto_id ?? ''),
      produtoNome: String(linha.produto_nome ?? ''),
      corredor: String(linha.corredor ?? ''),
      ...(nome ? { clienteNome: nome } : {}),
      criadoEm,
      atendido: linha.atendido === true,
    })
    chegouAjudaNova = true
  }
  if (chegouAjudaNova) {
    estado.ajuda = estado.ajuda.sort((a, b) => ms(b.criadoEm) - ms(a.criadoEm)).slice(0, LIMITE_AJUDA)
  }

  let chegouAgendamentoNovo = false
  for (const linha of tabelas.agendamentos ?? []) {
    const cancelado = linha.status === 'cancelado'
    const local = estado.agendamentos.find(a => a.id === linha.id)
    if (local) {
      if (cancelado) local.status = 'cancelado'
      continue
    }
    const agendamento = linha.dados as Agendamento | null
    if (!agendamento || typeof agendamento !== 'object' || agendamento.id !== linha.id) continue
    estado.agendamentos.push({ ...agendamento, status: cancelado ? 'cancelado' : agendamento.status })
    chegouAgendamentoNovo = true
  }
  if (chegouAgendamentoNovo) {
    estado.agendamentos = estado.agendamentos.sort((a, b) => ordemDoAgendamento(b.id) - ordemDoAgendamento(a.id))
  }

  for (const linha of tabelas.chamados ?? []) {
    const local = estado.chamados[linha.id] ?? { atendido: false, notas: [] }
    const notasRemotas = (Array.isArray(linha.notas) ? linha.notas : []) as NotaChamado[]
    const vistas = new Set<string>()
    const notas = [...local.notas, ...notasRemotas]
      .filter(n => n && typeof n.texto === 'string' && typeof n.data === 'string')
      .filter(n => {
        const chave = `${n.data}|${n.texto}`
        if (vistas.has(chave)) return false
        vistas.add(chave)
        return true
      })
      .sort((a, b) => a.data.localeCompare(b.data))
    estado.chamados[linha.id] = { atendido: local.atendido || linha.atendido === true, notas }
  }

  const conversasTocadas = new Set<string>()
  const conversaDe = (email: string, nome?: string | null): ConversaEspecialista => {
    conversasTocadas.add(email)
    return (estado.conversas[email] ??= {
      clienteEmail: email,
      clienteNome: nome || email,
      mensagens: [],
      atendida: false,
      atualizadoEm: new Date(0).toISOString(),
    })
  }

  for (const linha of tabelas.conversas ?? []) {
    const nome = texto(linha.cliente_nome)
    const conversa = conversaDe(linha.id, nome)
    if (nome && (!conversa.clienteNome || conversa.clienteNome === conversa.clienteEmail)) conversa.clienteNome = nome
    const encerradaEm = iso(linha.atendida_em)
    if (encerradaEm && !(ms(conversa.atendidaEm) >= ms(encerradaEm))) conversa.atendidaEm = encerradaEm
  }

  for (const linha of tabelas.mensagens ?? []) {
    const email = typeof linha.cliente_email === 'string' ? linha.cliente_email : ''
    const data = iso(linha.enviada_em)
    const autor = linha.autor
    if (!email || !data || (autor !== 'cliente' && autor !== 'funcionario')) continue
    const conversa = conversaDe(email)
    const local = conversa.mensagens.find(m => idDaMensagem(email, m) === linha.id)
    if (local) {
      // A hora que vale é a do banco, já corrigida pelo servidor — inclusive pra quem
      // enviou. Com cada aparelho usando o próprio relógio, a resposta do funcionário podia
      // aparecer ANTES da pergunta do cliente. O id é fixado antes de trocar a hora, senão
      // uma mensagem antiga (identificada pela hora) viraria outra mensagem.
      if (ms(local.data) !== ms(data)) {
        local.id = linha.id
        local.data = data
      }
      continue
    }
    conversa.mensagens.push({ id: linha.id, autor, texto: String(linha.texto ?? ''), data })
  }

  for (const email of conversasTocadas) {
    const conversa = estado.conversas[email]
    // Conversa encerrada antes de existir `atendidaEm`: sem isto, o recálculo abaixo a
    // reabriria só por ter chegado uma linha do banco.
    if (conversa.atendida && !conversa.atendidaEm) conversa.atendidaEm = conversa.atualizadoEm
    conversa.mensagens.sort((a, b) => ms(a.data) - ms(b.data))
    const ultima = conversa.mensagens[conversa.mensagens.length - 1]
    if (ultima && !(ms(conversa.atualizadoEm) >= ms(ultima.data))) conversa.atualizadoEm = ultima.data
    conversa.atendida = conversaEstaAtendida(conversa)
  }

  const alteradas = (Object.keys(CHAVES) as ParteLocal[]).filter(
    parte => JSON.stringify(estado[parte]) !== JSON.stringify(estadoAtual[parte])
  )
  return { estado, alteradas }
}
