// Motor da sincronização com o Supabase — roda no navegador.
//
// A ideia: nenhuma tela mudou de jeito de ler ou gravar. Tudo continua indo pro localStorage,
// como sempre, e este motor fica ao lado espelhando: manda pro banco o que mudou aqui e traz
// o que mudou nos outros aparelhos. É isso que faz o pedido feito no celular do cliente
// aparecer no computador do funcionário.
//
// Duas consequências desse desenho:
//   • Plano B de graça: se o banco não responder (ou não estiver configurado), o site segue
//     funcionando só com os dados deste aparelho, como antes. O que não subiu fica esperando
//     e sobe no próximo ciclo que der certo.
//   • O motor descobre sozinho o que mudou: guarda a impressão digital de cada linha já
//     enviada (CHAVE_ENVIADOS) e reenvia só as que estão diferentes. Não depende de cada
//     tela lembrar de avisar — inclusive as que gravam direto no localStorage.
//
// Um ciclo = uma chamada a /api/sync (ver app/api/sync/route.ts).
import { CHAVES, type EstadoLocal, type ParteLocal, chaveDaLinha, estadoVazio, hashDaLinha, linhasLocais, mesclarRemoto } from './espelho'
import { NOMES_DAS_TABELAS, type Linha, type Lote, type PedidoDeSync, type RespostaDeSync, type Tabela } from './tabelas'

const CHAVE_ENVIADOS = 'lm_sync_enviados' // { "tabela:id": impressão digital da linha já em dia com o banco }
const CHAVE_CURSORES = 'lm_sync_cursores' // { escopo: { tabela: até que hora este aparelho já recebeu } }
const CHAVE_PENDENCIAS = 'lm_sync_pendencias' // o que foi apagado aqui e o banco ainda não sabe

const MAX_LINHAS_POR_CICLO = 300
const TEMPO_LIMITE_MS = 15000
// Banco não configurado ou sem tabelas: não adianta insistir a cada poucos segundos.
const PAUSA_QUANDO_INATIVO_MS = 5 * 60 * 1000

export type Escopo = { papel: 'funcionario' } | { papel: 'cliente'; email: string } | { papel: 'visitante' }
export type SituacaoSync = 'verificando' | 'conectado' | 'local'
export type ResultadoDoCiclo = 'ok' | 'inativo' | 'falhou' | 'ocupado'

interface Pendencias {
  remover: Partial<Record<Tabela, string[]>>
  apagarClientes: string[]
}

let rodando = false
let pediramDuranteOCiclo = false
let inativoAte = 0
let aplicandoRemoto = false
let situacao: SituacaoSync = 'verificando'

// ── localStorage ─────────────────────────────────────────────────────────────────────

function lerJSON<T>(chave: string, padrao: T): T {
  try {
    const bruto = window.localStorage.getItem(chave)
    return bruto ? (JSON.parse(bruto) as T) : padrao
  } catch {
    return padrao
  }
}

function gravarJSON(chave: string, valor: unknown): void {
  try {
    window.localStorage.setItem(chave, JSON.stringify(valor))
  } catch {
    // Armazenamento cheio: o ciclo seguinte tenta de novo.
  }
}

function objeto<T>(valor: unknown): Record<string, T> {
  return valor && typeof valor === 'object' && !Array.isArray(valor) ? (valor as Record<string, T>) : {}
}

function lista<T>(valor: unknown): T[] {
  return Array.isArray(valor) ? (valor as T[]) : []
}

function lerEstado(): EstadoLocal {
  const vazio = estadoVazio()
  return {
    pedidos: objeto(lerJSON(CHAVES.pedidos, vazio.pedidos)),
    status: objeto(lerJSON(CHAVES.status, vazio.status)),
    contas: objeto(lerJSON(CHAVES.contas, vazio.contas)),
    clientesRemotos: objeto(lerJSON(CHAVES.clientesRemotos, vazio.clientesRemotos)),
    ajuda: lista(lerJSON(CHAVES.ajuda, vazio.ajuda)),
    agendamentos: lista(lerJSON(CHAVES.agendamentos, vazio.agendamentos)),
    chamados: objeto(lerJSON(CHAVES.chamados, vazio.chamados)),
    conversas: objeto(lerJSON(CHAVES.conversas, vazio.conversas)),
  }
}

function lerPendencias(): Pendencias {
  const p = lerJSON<Partial<Pendencias>>(CHAVE_PENDENCIAS, {})
  return { remover: objeto(p.remover), apagarClientes: lista(p.apagarClientes) }
}

// ── o que as telas chamam ────────────────────────────────────────────────────────────

// Pede um ciclo já, em vez de esperar o próximo do relógio. Quem escuta é o
// components/Sincronizador.tsx.
export function pedirSincronizacao(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event('lm-sync-pedir'))
}

// Apagar é a única coisa que o motor NÃO deduz sozinho: uma linha sumir do localStorage
// não quer dizer que o cliente apagou (pode ter sido a tela /demo regravando tudo). Só o
// que passa por aqui é apagado do banco.
export function registrarRemocao(tabela: Tabela, id: string): void {
  if (typeof window === 'undefined') return
  const pendencias = lerPendencias()
  pendencias.remover[tabela] = Array.from(new Set([...(pendencias.remover[tabela] ?? []), id]))
  gravarJSON(CHAVE_PENDENCIAS, pendencias)
  pedirSincronizacao()
}

// "Apagar meus dados" (lib/privacidadeDados.ts): apaga do banco tudo que é desse e-mail.
export function registrarApagamentoDeCliente(email: string): void {
  if (typeof window === 'undefined' || !email) return
  const pendencias = lerPendencias()
  pendencias.apagarClientes = Array.from(new Set([...pendencias.apagarClientes, email]))
  gravarJSON(CHAVE_PENDENCIAS, pendencias)
  pedirSincronizacao()
}

export function getSituacaoSync(): SituacaoSync {
  return situacao
}

// true enquanto o motor está avisando as telas do que chegou do banco — o Sincronizador usa
// pra não tratar esses avisos como "alguém mudou algo aqui, sincroniza de novo".
export function estaAplicandoRemoto(): boolean {
  return aplicandoRemoto
}

// Houve pedido de sincronização enquanto um ciclo rodava? (e zera a marca)
export function consumirPedidoPendente(): boolean {
  const havia = pediramDuranteOCiclo
  pediramDuranteOCiclo = false
  return havia
}

function mudarSituacao(nova: SituacaoSync): void {
  if (situacao === nova) return
  situacao = nova
  window.dispatchEvent(new Event('lm-sync-situacao'))
}

// ── o ciclo ──────────────────────────────────────────────────────────────────────────

function idDoEscopo(escopo: Escopo): string {
  return escopo.papel === 'cliente' ? `cliente:${escopo.email}` : escopo.papel
}

function impressoes(linhas: Record<Tabela, Linha[]>): Map<string, string> {
  const mapa = new Map<string, string>()
  for (const tabela of NOMES_DAS_TABELAS) {
    for (const linha of linhas[tabela]) mapa.set(chaveDaLinha(tabela, linha.id), hashDaLinha(linha))
  }
  return mapa
}

const EVENTOS_POR_PARTE: Record<ParteLocal, string | null> = {
  pedidos: 'lm-status-pedido-change',
  status: 'lm-status-pedido-change',
  clientesRemotos: 'lm-status-pedido-change',
  contas: null,
  ajuda: 'lm-ajuda-corredor-change',
  agendamentos: null,
  chamados: null,
  conversas: 'lm-conversa-especialista-change',
}

export async function sincronizar(escopo: Escopo): Promise<ResultadoDoCiclo> {
  if (typeof window === 'undefined') return 'inativo'
  if (rodando) {
    pediramDuranteOCiclo = true
    return 'ocupado'
  }
  if (Date.now() < inativoAte) return 'inativo'
  rodando = true
  try {
    return await ciclo(escopo)
  } catch {
    mudarSituacao('local')
    return 'falhou'
  } finally {
    rodando = false
  }
}

async function ciclo(escopo: Escopo): Promise<ResultadoDoCiclo> {
  const linhas = linhasLocais(lerEstado())
  const atuais = impressoes(linhas)
  const enviados = lerJSON<Record<string, string>>(CHAVE_ENVIADOS, {})
  const cursores = lerJSON<Record<string, Record<string, string>>>(CHAVE_CURSORES, {})
  const pendencias = lerPendencias()

  // Linha que este aparelho já tinha em dia e sumiu daqui sem ter sido apagada de propósito
  // (ex.: a tela /demo regravou tudo): esquece a marca e pede a tabela inteira de novo, que
  // ela volta. A lista de pedidos de ajuda fica de fora porque ela mesma descarta os antigos.
  let cursoresMudaram = false
  for (const chave of Object.keys(enviados)) {
    if (atuais.has(chave)) continue
    delete enviados[chave]
    const tabela = chave.slice(0, chave.indexOf(':'))
    if (tabela === 'ajuda_corredor') continue
    for (const porEscopo of Object.values(cursores)) {
      if (porEscopo[tabela]) {
        delete porEscopo[tabela]
        cursoresMudaram = true
      }
    }
  }
  if (cursoresMudaram) gravarJSON(CHAVE_CURSORES, cursores)

  // O que mudou aqui desde o último envio.
  const gravar: Lote = {}
  const enviadasAgora: [string, string][] = []
  let total = 0
  for (const tabela of NOMES_DAS_TABELAS) {
    for (const linha of linhas[tabela]) {
      if (total >= MAX_LINHAS_POR_CICLO) break
      const chave = chaveDaLinha(tabela, linha.id)
      const impressao = atuais.get(chave)!
      if (enviados[chave] === impressao) continue
      ;(gravar[tabela] ??= []).push(linha)
      enviadasAgora.push([chave, impressao])
      total++
    }
  }

  const temRemocao = Object.values(pendencias.remover).some(ids => (ids?.length ?? 0) > 0) || pendencias.apagarClientes.length > 0
  // Visitante não recebe nada: sem o que mandar, nem chama o servidor.
  if (escopo.papel === 'visitante' && total === 0 && !temRemocao) {
    gravarJSON(CHAVE_ENVIADOS, enviados)
    return 'ok'
  }

  const idEscopo = idDoEscopo(escopo)
  const pedido: PedidoDeSync = {
    papel: escopo.papel,
    email: escopo.papel === 'cliente' ? escopo.email : undefined,
    agora: new Date().toISOString(),
    desde: cursores[idEscopo] ?? {},
    gravar,
    remover: pendencias.remover,
    apagarClientes: pendencias.apagarClientes,
  }

  const controle = new AbortController()
  const relogio = window.setTimeout(() => controle.abort(), TEMPO_LIMITE_MS)
  let resposta: RespostaDeSync
  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pedido),
      signal: controle.signal,
    })
    if (!res.ok) {
      mudarSituacao('local')
      return 'falhou'
    }
    resposta = (await res.json()) as RespostaDeSync
  } finally {
    window.clearTimeout(relogio)
  }

  if (!resposta.ativo) {
    inativoAte = Date.now() + PAUSA_QUANDO_INATIVO_MS
    mudarSituacao('local')
    return 'inativo'
  }

  // Deu certo: o que foi enviado está em dia, e as remoções pedidas foram feitas.
  for (const [chave, impressao] of enviadasAgora) enviados[chave] = impressao
  const pendenciasAgora = lerPendencias()
  for (const tabela of Object.keys(pendencias.remover) as Tabela[]) {
    const feitas = new Set(pendencias.remover[tabela])
    pendenciasAgora.remover[tabela] = (pendenciasAgora.remover[tabela] ?? []).filter(id => !feitas.has(id))
  }
  pendenciasAgora.apagarClientes = pendenciasAgora.apagarClientes.filter(e => !pendencias.apagarClientes.includes(e))
  gravarJSON(CHAVE_PENDENCIAS, pendenciasAgora)

  // Junta o que veio dos outros aparelhos. Lê o estado de novo: o cliente pode ter mexido em
  // algo enquanto a chamada estava no ar.
  const tabelas = resposta.tabelas ?? {}
  const remocoes = resposta.remocoes ?? []
  const fresco = lerEstado()
  const antes = impressoes(linhasLocais(fresco))
  const { estado: novo, alteradas } = mesclarRemoto(fresco, tabelas, remocoes)
  for (const parte of alteradas) gravarJSON(CHAVES[parte], novo[parte])

  // Linha que veio do banco e não tinha mudança local esperando passa a contar como "em
  // dia" — senão este aparelho mandaria de volta, no próximo ciclo, o que acabou de receber.
  const depois = alteradas.length > 0 ? impressoes(linhasLocais(novo)) : antes
  for (const tabela of NOMES_DAS_TABELAS) {
    for (const linha of tabelas[tabela] ?? []) {
      const chave = chaveDaLinha(tabela, linha.id)
      const tinhaMudancaLocal = antes.has(chave) && antes.get(chave) !== enviados[chave]
      const impressao = depois.get(chave)
      if (impressao && !tinhaMudancaLocal) enviados[chave] = impressao
    }
  }
  for (const remocao of remocoes) delete enviados[chaveDaLinha(remocao.tabela, remocao.id)]
  gravarJSON(CHAVE_ENVIADOS, enviados)

  // Avança o relógio de cada tabela até a última linha recebida (o servidor manda em
  // ordem), mas nunca além de `seguroAte` — ver o comentário desse campo em tabelas.ts.
  const cursoresAgora = lerJSON<Record<string, Record<string, string>>>(CHAVE_CURSORES, {})
  const doEscopo = (cursoresAgora[idEscopo] ??= {})
  const avancar = (tabela: string, ultima: string | undefined) => {
    if (!ultima) return
    const ate = resposta.seguroAte && Date.parse(resposta.seguroAte) < Date.parse(ultima) ? resposta.seguroAte : ultima
    const atual = doEscopo[tabela]
    if (!atual || Date.parse(ate) > Date.parse(atual)) doEscopo[tabela] = ate
  }
  for (const tabela of NOMES_DAS_TABELAS) {
    const recebidas = tabelas[tabela]
    avancar(tabela, recebidas?.[recebidas.length - 1]?.atualizado_em)
  }
  avancar('remocoes', remocoes[remocoes.length - 1]?.removido_em)
  gravarJSON(CHAVE_CURSORES, cursoresAgora)

  mudarSituacao('conectado')

  if (alteradas.length > 0) {
    const eventos = new Set<string>(['lm-sync-change'])
    for (const parte of alteradas) {
      const evento = EVENTOS_POR_PARTE[parte]
      if (evento) eventos.add(evento)
    }
    aplicandoRemoto = true
    try {
      for (const evento of eventos) window.dispatchEvent(new Event(evento))
    } finally {
      aplicandoRemoto = false
    }
  }
  return 'ok'
}
