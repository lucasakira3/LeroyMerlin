import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { horaCerta, loginDeVerdadeAtivo, supabaseServidor, tabelaNaoExiste } from '@/lib/supabaseServidor'
import { cookieDeSaida, normalizarEmail, sessaoDaRequisicao } from '@/lib/servidor/sessao'
import {
  NOMES_DAS_TABELAS, TABELAS, ehTabela, podeGravar,
  type Linha, type PedidoDeSync, type Remocao, type RespostaDeSync, type Tabela,
} from '@/lib/sync/tabelas'

// Porta única entre o site e o Supabase (ver lib/sync/motor.ts, que é quem chama).
// Cada chamada faz, nesta ordem: apaga o que o aparelho pediu pra apagar, grava o que mudou
// nele, e devolve o que mudou nos outros aparelhos desde a última vez.
//
// Quem está chamando é decidido pelo cookie de sessão (lib/servidor/sessao.ts), nunca pelo
// que o aparelho diz no corpo: sem o cookie de funcionário ninguém lê o painel, e um cliente
// só lê e grava o que é do e-mail com que fez login. O que cada papel pode gravar está em
// `podeGravar` (lib/sync/tabelas.ts). Sem login dá pra pedir ajuda no corredor e agendar
// visita, como sempre deu — por isso essas duas gravações (e remover um agendamento pelo id)
// seguem abertas; é o limite conhecido que sobra.
export const dynamic = 'force-dynamic'

const MAX_LINHAS_POR_CHAMADA = 600
const MAX_LINHAS_POR_TABELA_NA_VOLTA = 500
const MAX_TAMANHO_DA_LINHA = 100_000
// Folga do relógio da sincronização — ver `seguroAte` em lib/sync/tabelas.ts.
const FOLGA_MS = 5000

// Colunas cuja hora é carimbada no APARELHO (quando o funcionário mudou a etapa, quando a
// mensagem foi enviada...). Relógio de celular e de computador erram por segundos, às vezes
// minutos, e essas horas decidem coisas: a ordem das mensagens no chat, qual etapa do pedido
// vale, se a conversa foi reaberta. Então o servidor as corrige antes de gravar.
const HORAS_DO_APARELHO: Partial<Record<Tabela, string[]>> = {
  pedidos_status: ['definida_em'],
  ajuda_corredor: ['pedido_em'],
  conversas: ['atendida_em'],
  mensagens: ['enviada_em'],
}

// Tabela cujo registro de remoção (tabela `remocoes`) bloqueia a gravação — ver `gravar`.
// pedidos_status e chamados usam o mesmo id do pedido / do agendamento a que se referem.
const DEPENDE_DE: Partial<Record<Tabela, string>> = {
  pedidos: 'pedidos',
  pedidos_status: 'pedidos',
  agendamentos: 'agendamentos',
  chamados: 'agendamentos',
}

type Erro = { code?: string; message?: string } | null

class TabelasAusentes extends Error {}

function conferir(erro: Erro): void {
  if (!erro) return
  if (tabelaNaoExiste(erro)) throw new TabelasAusentes()
  throw new Error(erro.message ?? 'erro no banco')
}

function inativo(motivo: RespostaDeSync['motivo']) {
  return NextResponse.json<RespostaDeSync>({ ativo: false, motivo })
}

// Só as colunas conhecidas da tabela entram; o resto do que o aparelho mandar é ignorado.
function limpar(tabela: Tabela, bruta: unknown): Linha | null {
  if (!bruta || typeof bruta !== 'object') return null
  const origem = bruta as Record<string, unknown>
  const id = origem.id
  if (typeof id !== 'string' || id.length === 0 || id.length > 300) return null
  const linha: Linha = { id }
  for (const coluna of TABELAS[tabela].colunas) {
    if (coluna !== 'id' && origem[coluna] !== undefined) linha[coluna] = origem[coluna]
  }
  return JSON.stringify(linha).length <= MAX_TAMANHO_DA_LINHA ? linha : null
}

// Quanto somar às horas do aparelho pra virarem hora certa. O aparelho diz que horas são
// pra ele no envio; a diferença pra hora certa na chegada é o erro do relógio dele (mais o
// tempo de viagem do pedido, por isso menos de 2s é tratado como "relógio certo").
function desvioDoAparelho(agoraDoAparelho: unknown, agoraCerto: number): number {
  const la = typeof agoraDoAparelho === 'string' ? new Date(agoraDoAparelho).getTime() : NaN
  if (!Number.isFinite(la)) return 0
  const desvio = agoraCerto - la
  return Math.abs(desvio) < 2000 ? 0 : desvio
}

function acertarHoras(tabela: Tabela, linhas: Linha[], desvio: number): Linha[] {
  const colunas = HORAS_DO_APARELHO[tabela]
  if (!colunas || desvio === 0) return linhas
  return linhas.map(linha => {
    const certa = { ...linha }
    for (const coluna of colunas) {
      const t = typeof linha[coluna] === 'string' ? new Date(linha[coluna] as string).getTime() : NaN
      if (Number.isFinite(t)) certa[coluna] = new Date(t + desvio).toISOString()
    }
    return certa
  })
}

async function registrarRemocoes(sb: SupabaseClient, agora: number, remocoes: { tabela: string; id: string; cliente_email: string | null }[]) {
  if (remocoes.length === 0) return
  const { error } = await sb.from('remocoes').upsert(
    remocoes.map(r => ({ ...r, removido_em: new Date(agora).toISOString() })),
    { onConflict: 'tabela,id' }
  )
  conferir(error)
}

// "Apagar meus dados": some com o que é desse e-mail e deixa o aviso pros outros aparelhos
// apagarem a cópia deles. Apaga o mesmo que lib/privacidadeDados.ts já apagava no aparelho
// (pedidos, conversa e conta) mais a senha; os agendamentos ficam, como lá. Com a senha
// apagada, o mesmo e-mail pode se cadastrar de novo depois.
async function apagarCliente(sb: SupabaseClient, agora: number, email: string) {
  const idCliente = email.trim().toLowerCase()
  const pedidos = await sb.from('pedidos').delete().eq('cliente_email', email).select('id')
  conferir(pedidos.error)
  conferir((await sb.from('pedidos_status').delete().eq('cliente_email', email)).error)
  conferir((await sb.from('mensagens').delete().eq('cliente_email', email)).error)
  conferir((await sb.from('conversas').delete().eq('id', email)).error)
  conferir((await sb.from('clientes').delete().eq('id', idCliente)).error)
  const senha = await sb.from('credenciais').delete().eq('email', idCliente)
  if (!tabelaNaoExiste(senha.error)) conferir(senha.error)

  await registrarRemocoes(sb, agora, [
    ...(pedidos.data ?? []).map(p => ({ tabela: 'pedidos', id: p.id as string, cliente_email: email })),
    { tabela: 'conversas', id: email, cliente_email: email },
    { tabela: 'clientes', id: idCliente, cliente_email: email },
  ])
}

async function removerAgendamentos(sb: SupabaseClient, agora: number, ids: string[]) {
  const apagados = await sb.from('agendamentos').delete().in('id', ids).select('id, cliente_email')
  conferir(apagados.error)
  conferir((await sb.from('chamados').delete().in('id', ids)).error)
  const emailPorId = new Map((apagados.data ?? []).map(a => [a.id as string, (a.cliente_email as string | null) ?? null]))
  // Registra mesmo o que não estava mais no banco: outro aparelho ainda pode ter a cópia.
  await registrarRemocoes(sb, agora, ids.map(id => ({ tabela: 'agendamentos', id, cliente_email: emailPorId.get(id) ?? null })))
}

// `mensagensDoEnvio`: as mensagens que vieram na mesma chamada (já com a hora corrigida).
async function gravar(sb: SupabaseClient, tabela: Tabela, linhas: Linha[], mensagensDoEnvio: Linha[] = []) {
  if (linhas.length === 0) return
  let aceitas = linhas

  // O que foi apagado não volta só porque um aparelho antigo ainda tinha a cópia — nem o
  // que depende dele: a etapa de um pedido apagado, as anotações de um agendamento removido.
  const dependeDe = DEPENDE_DE[tabela]
  if (dependeDe) {
    const apagadas = await sb.from('remocoes').select('id').eq('tabela', dependeDe).in('id', linhas.map(l => l.id))
    conferir(apagadas.error)
    const ids = new Set((apagadas.data ?? []).map(r => r.id as string))
    aceitas = linhas.filter(l => !ids.has(l.id))
  } else if (tabela === 'conversas') {
    // Conversa de quem pediu "apagar meus dados" só é recriada se vier com mensagem nova
    // (o cliente voltou a escrever). Sozinha, é sobra de um aparelho que ainda tinha a cópia
    // — foi assim que uma conversa vazia reapareceu no banco no teste do site publicado.
    const apagadas = await sb.from('remocoes').select('id, removido_em').eq('tabela', 'conversas').in('id', linhas.map(l => l.id))
    conferir(apagadas.error)
    const apagadaEm = new Map((apagadas.data ?? []).map(r => [r.id as string, new Date(r.removido_em as string).getTime()]))
    if (apagadaEm.size > 0) {
      const jaTemMensagem = await sb.from('mensagens').select('cliente_email').in('cliente_email', Array.from(apagadaEm.keys()))
      conferir(jaTemMensagem.error)
      const comMensagem = new Set((jaTemMensagem.data ?? []).map(m => m.cliente_email as string))
      for (const m of mensagensDoEnvio) {
        const corte = apagadaEm.get(String(m.cliente_email ?? ''))
        if (corte !== undefined && new Date(String(m.enviada_em)).getTime() > corte) comMensagem.add(String(m.cliente_email))
      }
      aceitas = linhas.filter(l => !apagadaEm.has(l.id) || comMensagem.has(l.id))
    }
  } else if (tabela === 'mensagens') {
    // Mensagem anterior ao "apagar meus dados" do cliente também não volta; as novas sim.
    const emails = Array.from(new Set(linhas.map(l => String(l.cliente_email ?? ''))))
    const apagadas = await sb.from('remocoes').select('id, removido_em').eq('tabela', 'conversas').in('id', emails)
    conferir(apagadas.error)
    const apagadaEm = new Map((apagadas.data ?? []).map(r => [r.id as string, new Date(r.removido_em as string).getTime()]))
    aceitas = linhas.filter(l => {
      const corte = apagadaEm.get(String(l.cliente_email ?? ''))
      return corte === undefined || new Date(String(l.enviada_em)).getTime() > corte
    })
  }
  if (aceitas.length === 0) return

  const { error } = await sb.from(tabela).upsert(aceitas, { onConflict: 'id', ignoreDuplicates: TABELAS[tabela].imutavel })
  conferir(error)
}

// O relógio que o aparelho mandou, se for uma data de verdade (é texto vindo de fora).
function relogio(valor: unknown): string | null {
  return typeof valor === 'string' && Number.isFinite(new Date(valor).getTime()) ? valor : null
}

async function puxar(sb: SupabaseClient, agora: number, papel: 'funcionario' | 'cliente', email: string, desde: Record<string, unknown>) {
  const tabelas = papel === 'funcionario' ? NOMES_DAS_TABELAS : NOMES_DAS_TABELAS.filter(t => TABELAS[t].escopoCliente)

  const consultas = tabelas.map(async tabela => {
    let consulta = sb.from(tabela).select('*').order('atualizado_em', { ascending: true }).limit(MAX_LINHAS_POR_TABELA_NA_VOLTA)
    const corte = relogio(desde[tabela])
    if (corte) consulta = consulta.gt('atualizado_em', corte)
    const coluna = TABELAS[tabela].escopoCliente
    if (papel === 'cliente' && coluna) consulta = consulta.eq(coluna, email)
    const { data, error } = await consulta
    conferir(error)
    return [tabela, data ?? []] as const
  })

  let consultaRemocoes = sb.from('remocoes').select('tabela, id, removido_em').order('removido_em', { ascending: true }).limit(MAX_LINHAS_POR_TABELA_NA_VOLTA)
  const corteRemocoes = relogio(desde.remocoes)
  if (corteRemocoes) consultaRemocoes = consultaRemocoes.gt('removido_em', corteRemocoes)
  if (papel === 'cliente') consultaRemocoes = consultaRemocoes.eq('cliente_email', email)

  const [linhasPorTabela, remocoes] = await Promise.all([Promise.all(consultas), consultaRemocoes])
  conferir(remocoes.error)
  return {
    tabelas: Object.fromEntries(linhasPorTabela) as RespostaDeSync['tabelas'],
    remocoes: (remocoes.data ?? []) as Remocao[],
    seguroAte: new Date(agora - FOLGA_MS).toISOString(),
  }
}

export async function POST(req: NextRequest) {
  const sb = supabaseServidor()
  if (!sb) return inativo('sem-configuracao')

  let corpo: PedidoDeSync
  try {
    corpo = await req.json()
  } catch {
    return NextResponse.json({ ativo: true, erro: 'corpo inválido' }, { status: 400 })
  }
  const papel = corpo?.papel
  if (papel !== 'funcionario' && papel !== 'cliente' && papel !== 'visitante') {
    return NextResponse.json({ ativo: true, erro: 'papel inválido' }, { status: 400 })
  }
  // Quem é, de verdade: o que o aparelho diz ser precisa bater com o cookie de sessão.
  // Exceção: enquanto as tabelas do login de verdade não existem no banco, vale o que o
  // aparelho diz, como era na etapa 1 (ver loginDeVerdadeAtivo).
  const semSessao = () => NextResponse.json({ ativo: true, erro: 'sem-sessao' }, { status: 401 })
  const exigirSessao = await loginDeVerdadeAtivo(sb)
  const emailDeclarado = normalizarEmail(corpo.email)
  const sessaoCliente = exigirSessao
    ? sessaoDaRequisicao(req, 'cliente')
    : emailDeclarado ? { email: emailDeclarado } : null
  let email = ''
  // O e-mail usado pra LER as linhas do cliente. Com o login de verdade é sempre o da
  // sessão (minúsculas). Sem ele, é o que o aparelho mandou, do jeito que mandou: o login
  // antigo não passava o e-mail pra minúsculas, e as linhas foram gravadas assim.
  let emailDeLeitura = ''
  if (papel === 'funcionario') {
    if (exigirSessao && !sessaoDaRequisicao(req, 'funcionario')) return semSessao()
  } else if (papel === 'cliente') {
    if (!sessaoCliente || sessaoCliente.email !== emailDeclarado) return semSessao()
    email = sessaoCliente.email
    emailDeLeitura = exigirSessao ? email : String(corpo.email ?? '').trim()
  }

  try {
    const agora = await horaCerta()
    const desvio = desvioDoAparelho(corpo.agora, agora)

    // "Apagar meus dados": só a própria conta, e só com a sessão dela. O pedido chega logo
    // depois de a tela deslogar (por isso vale pra qualquer papel declarado), mas o cookie
    // ainda está aqui — e sai junto, no fim, porque a conta deixou de existir.
    let apagouAPropriaConta = false
    for (const emailApagar of (Array.isArray(corpo.apagarClientes) ? corpo.apagarClientes : []).slice(0, 5)) {
      const alvo = normalizarEmail(emailApagar)
      if (!alvo) continue
      if (!exigirSessao) {
        await apagarCliente(sb, agora, String(emailApagar).trim())
      } else if (sessaoCliente && alvo === sessaoCliente.email) {
        await apagarCliente(sb, agora, alvo)
        apagouAPropriaConta = true
      }
    }
    const comSaida = <T extends NextResponse>(resposta: T): T => {
      if (apagouAPropriaConta) resposta.cookies.set(cookieDeSaida('cliente'))
      return resposta
    }

    const idsAgendamentos = corpo.remover?.agendamentos
    if (Array.isArray(idsAgendamentos) && idsAgendamentos.length > 0) {
      await removerAgendamentos(sb, agora, idsAgendamentos.filter(id => typeof id === 'string').slice(0, 100))
    }

    // Primeiro limpa e conta tudo; só depois grava — a conversa precisa saber quais
    // mensagens vieram junto (ver `gravar`).
    const lotes: [Tabela, Linha[]][] = []
    let total = 0
    for (const [nome, brutas] of Object.entries(corpo.gravar ?? {})) {
      if (!ehTabela(nome) || !Array.isArray(brutas)) continue
      const linhas = brutas
        .map(b => limpar(nome, b))
        .filter((l): l is Linha => l !== null && podeGravar(papel, email, nome, l))
        .map(l => {
          // Encerrar a conversa é do funcionário: a hora do encerramento vinda do cliente é
          // descartada (a coluna some do envio, então o valor guardado no banco não muda).
          if (nome !== 'conversas' || papel === 'funcionario') return l
          const { atendida_em: _descartada, ...resto } = l
          return resto as Linha
        })
      total += linhas.length
      if (total > MAX_LINHAS_POR_CHAMADA) {
        return NextResponse.json({ ativo: true, erro: 'linhas demais numa chamada' }, { status: 413 })
      }
      lotes.push([nome, acertarHoras(nome, linhas, desvio)])
    }
    const mensagensDoEnvio = lotes.find(([nome]) => nome === 'mensagens')?.[1] ?? []
    for (const [nome, linhas] of lotes) await gravar(sb, nome, linhas, mensagensDoEnvio)

    if (papel === 'visitante') return comSaida(NextResponse.json<RespostaDeSync>({ ativo: true }))
    const desde = corpo.desde && typeof corpo.desde === 'object' ? (corpo.desde as Record<string, unknown>) : {}
    return comSaida(NextResponse.json<RespostaDeSync>({ ativo: true, ...(await puxar(sb, agora, papel, emailDeLeitura, desde)) }))
  } catch (erro) {
    if (erro instanceof TabelasAusentes) return inativo('tabelas-ausentes')
    const mensagem = erro instanceof Error ? erro.message : 'erro desconhecido'
    console.error('[POST /api/sync]', mensagem)
    return NextResponse.json({ ativo: true, erro: mensagem }, { status: 500 })
  }
}

// Diagnóstico: abre no navegador (/api/sync) pra ver se o banco está ligado e quais
// tabelas existem. Não devolve dado nenhum, só a situação.
export async function GET() {
  const sb = supabaseServidor()
  if (!sb) return NextResponse.json({ ativo: false, motivo: 'sem-configuracao' })
  const faltando: string[] = []
  const erros: string[] = []
  await Promise.all(
    [...NOMES_DAS_TABELAS, 'remocoes'].map(async tabela => {
      // GET de verdade (e não HEAD): no HEAD o erro vem sem corpo e "tabela não existe"
      // passaria por sucesso.
      const { error } = await sb.from(tabela).select('id').limit(1)
      if (tabelaNaoExiste(error)) faltando.push(tabela)
      else if (error) erros.push(`${tabela}: ${error.message}`)
    })
  )
  if (faltando.length > 0) return NextResponse.json({ ativo: false, motivo: 'tabelas-ausentes', faltando: faltando.sort() })
  if (erros.length > 0) return NextResponse.json({ ativo: false, motivo: 'erro', erros }, { status: 500 })
  return NextResponse.json({ ativo: true })
}
