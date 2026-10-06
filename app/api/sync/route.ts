import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { supabaseServidor } from '@/lib/supabaseServidor'
import {
  NOMES_DAS_TABELAS, TABELAS, ehTabela,
  type Linha, type PedidoDeSync, type Remocao, type RespostaDeSync, type Tabela,
} from '@/lib/sync/tabelas'

// Porta única entre o site e o Supabase (ver lib/sync/motor.ts, que é quem chama).
// Cada chamada faz, nesta ordem: apaga o que o aparelho pediu pra apagar, grava o que mudou
// nele, e devolve o que mudou nos outros aparelhos desde a última vez.
//
// LIMITE CONHECIDO: o login do site ainda é de mentira (qualquer senha entra), então esta
// rota não tem como conferir quem está chamando — quem souber o endereço consegue ler e
// gravar como "funcionario". É o mesmo nível de proteção do resto do MVP; fecha quando o
// login virar de verdade (etapa 2). Enquanto isso, o que dá pra garantir aqui: só as tabelas
// e colunas da lista, e tamanho limitado por chamada.
export const dynamic = 'force-dynamic'

const MAX_LINHAS_POR_CHAMADA = 600
const MAX_LINHAS_POR_TABELA_NA_VOLTA = 500
const MAX_TAMANHO_DA_LINHA = 100_000
// O servidor devolve também o que mudou nos 3s ANTES do relógio do aparelho: uma gravação
// que ainda estava sendo concluída quando ele perguntou da última vez não se perde. Receber
// a mesma linha duas vezes não tem efeito (ver lib/sync/espelho.ts).
const FOLGA_MS = 3000

type Erro = { code?: string; message?: string } | null

function tabelaNaoExiste(erro: Erro): boolean {
  return erro?.code === 'PGRST205' || erro?.code === '42P01'
}

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

async function registrarRemocoes(sb: SupabaseClient, remocoes: { tabela: string; id: string; cliente_email: string | null }[]) {
  if (remocoes.length === 0) return
  const { error } = await sb.from('remocoes').upsert(
    remocoes.map(r => ({ ...r, removido_em: new Date().toISOString() })),
    { onConflict: 'tabela,id' }
  )
  conferir(error)
}

// "Apagar meus dados": some com o que é desse e-mail e deixa o aviso pros outros aparelhos
// apagarem a cópia deles. Apaga o mesmo que lib/privacidadeDados.ts já apagava no aparelho
// (pedidos, conversa e conta); os agendamentos ficam, como lá.
async function apagarCliente(sb: SupabaseClient, email: string) {
  const idCliente = email.trim().toLowerCase()
  const pedidos = await sb.from('pedidos').delete().eq('cliente_email', email).select('id')
  conferir(pedidos.error)
  conferir((await sb.from('pedidos_status').delete().eq('cliente_email', email)).error)
  conferir((await sb.from('mensagens').delete().eq('cliente_email', email)).error)
  conferir((await sb.from('conversas').delete().eq('id', email)).error)
  conferir((await sb.from('clientes').delete().eq('id', idCliente)).error)

  await registrarRemocoes(sb, [
    ...(pedidos.data ?? []).map(p => ({ tabela: 'pedidos', id: p.id as string, cliente_email: email })),
    { tabela: 'conversas', id: email, cliente_email: email },
    { tabela: 'clientes', id: idCliente, cliente_email: email },
  ])
}

async function removerAgendamentos(sb: SupabaseClient, ids: string[]) {
  const apagados = await sb.from('agendamentos').delete().in('id', ids).select('id, cliente_email')
  conferir(apagados.error)
  conferir((await sb.from('chamados').delete().in('id', ids)).error)
  const emailPorId = new Map((apagados.data ?? []).map(a => [a.id as string, (a.cliente_email as string | null) ?? null]))
  // Registra mesmo o que não estava mais no banco: outro aparelho ainda pode ter a cópia.
  await registrarRemocoes(sb, ids.map(id => ({ tabela: 'agendamentos', id, cliente_email: emailPorId.get(id) ?? null })))
}

async function gravar(sb: SupabaseClient, tabela: Tabela, linhas: Linha[]) {
  if (linhas.length === 0) return
  let aceitas = linhas

  // O que foi apagado não volta só porque um aparelho antigo ainda tinha a cópia.
  if (tabela === 'pedidos' || tabela === 'agendamentos') {
    const apagadas = await sb.from('remocoes').select('id').eq('tabela', tabela).in('id', linhas.map(l => l.id))
    conferir(apagadas.error)
    const ids = new Set((apagadas.data ?? []).map(r => r.id as string))
    aceitas = linhas.filter(l => !ids.has(l.id))
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

function desdeComFolga(valor: unknown): string | null {
  const t = typeof valor === 'string' ? new Date(valor).getTime() : NaN
  return Number.isFinite(t) ? new Date(t - FOLGA_MS).toISOString() : null
}

async function puxar(sb: SupabaseClient, papel: 'funcionario' | 'cliente', email: string, desde: Record<string, unknown>) {
  const tabelas = papel === 'funcionario' ? NOMES_DAS_TABELAS : NOMES_DAS_TABELAS.filter(t => TABELAS[t].escopoCliente)

  const consultas = tabelas.map(async tabela => {
    let consulta = sb.from(tabela).select('*').order('atualizado_em', { ascending: true }).limit(MAX_LINHAS_POR_TABELA_NA_VOLTA)
    const corte = desdeComFolga(desde[tabela])
    if (corte) consulta = consulta.gt('atualizado_em', corte)
    const coluna = TABELAS[tabela].escopoCliente
    if (papel === 'cliente' && coluna) consulta = consulta.eq(coluna, email)
    const { data, error } = await consulta
    conferir(error)
    return [tabela, data ?? []] as const
  })

  let consultaRemocoes = sb.from('remocoes').select('tabela, id, removido_em').order('removido_em', { ascending: true }).limit(MAX_LINHAS_POR_TABELA_NA_VOLTA)
  const corteRemocoes = desdeComFolga(desde.remocoes)
  if (corteRemocoes) consultaRemocoes = consultaRemocoes.gt('removido_em', corteRemocoes)
  if (papel === 'cliente') consultaRemocoes = consultaRemocoes.eq('cliente_email', email)

  const [linhasPorTabela, remocoes] = await Promise.all([Promise.all(consultas), consultaRemocoes])
  conferir(remocoes.error)
  return {
    tabelas: Object.fromEntries(linhasPorTabela) as RespostaDeSync['tabelas'],
    remocoes: (remocoes.data ?? []) as Remocao[],
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
  const email = typeof corpo.email === 'string' ? corpo.email.slice(0, 300) : ''
  if (papel === 'cliente' && !email) {
    return NextResponse.json({ ativo: true, erro: 'cliente sem e-mail' }, { status: 400 })
  }

  try {
    for (const emailApagar of (Array.isArray(corpo.apagarClientes) ? corpo.apagarClientes : []).slice(0, 5)) {
      if (typeof emailApagar === 'string' && emailApagar.trim()) await apagarCliente(sb, emailApagar)
    }

    const idsAgendamentos = corpo.remover?.agendamentos
    if (Array.isArray(idsAgendamentos) && idsAgendamentos.length > 0) {
      await removerAgendamentos(sb, idsAgendamentos.filter(id => typeof id === 'string').slice(0, 100))
    }

    let total = 0
    for (const [nome, brutas] of Object.entries(corpo.gravar ?? {})) {
      if (!ehTabela(nome) || !Array.isArray(brutas)) continue
      const linhas = brutas.map(b => limpar(nome, b)).filter((l): l is Linha => l !== null)
      total += linhas.length
      if (total > MAX_LINHAS_POR_CHAMADA) {
        return NextResponse.json({ ativo: true, erro: 'linhas demais numa chamada' }, { status: 413 })
      }
      await gravar(sb, nome, linhas)
    }

    if (papel === 'visitante') return NextResponse.json<RespostaDeSync>({ ativo: true })
    const desde = corpo.desde && typeof corpo.desde === 'object' ? (corpo.desde as Record<string, unknown>) : {}
    return NextResponse.json<RespostaDeSync>({ ativo: true, ...(await puxar(sb, papel, email, desde)) })
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
