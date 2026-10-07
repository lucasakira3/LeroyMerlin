// Conexão com o Supabase usada SÓ no servidor (rotas em app/api). Usa a chave secreta, que
// passa por cima do RLS — por isso este arquivo nunca pode ser importado por um componente
// de tela: a chave iria junto pro navegador. `import 'server-only'` não é usado porque o
// projeto não tem esse pacote; a proteção é a variável não começar com NEXT_PUBLIC_ (o Next
// não a entrega ao navegador).
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let cliente: SupabaseClient | null | undefined
let desvioDoRelogio: { ms: number; medidoEm: number } | null = null
let loginDeVerdade: { ativo: boolean; conferidoEm: number } | null = null

// "Tabela não existe": o SQL daquela etapa ainda não foi rodado no Supabase. PGRST205 é o
// PostgREST dizendo que não conhece a tabela; 42P01 é o próprio Postgres.
export function tabelaNaoExiste(erro: { code?: string } | null | undefined): boolean {
  return erro?.code === 'PGRST205' || erro?.code === '42P01'
}

// null = variáveis não preenchidas (ex.: ainda não cadastradas na Vercel). Quem chama trata
// isso como "banco desligado" e o site segue só com os dados do aparelho.
export function supabaseServidor(): SupabaseClient | null {
  if (cliente !== undefined) return cliente
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const chave = process.env.SUPABASE_SECRET_KEY?.trim()
  cliente = url && chave
    ? createClient(url, chave, { auth: { persistSession: false, autoRefreshToken: false } })
    : null
  return cliente
}

// O login de verdade (etapa 2) está valendo? Está quando a tabela `credenciais` existe no
// banco — é ela que as rotas de login usam. Enquanto não existir, as rotas de login
// respondem "sem banco" e as telas caem no login antigo, só do aparelho; a sincronização
// precisa acompanhar e NÃO exigir sessão nesse caso, senão todo mundo seria deslogado em
// laço (entra pelo login antigo, o servidor não reconhece, desloga, entra de novo...).
// A resposta fica guardada por 1 minuto pra não custar uma consulta a mais por chamada.
export async function loginDeVerdadeAtivo(sb: SupabaseClient): Promise<boolean> {
  if (loginDeVerdade && Date.now() - loginDeVerdade.conferidoEm < 60 * 1000) return loginDeVerdade.ativo
  const { error } = await sb.from('credenciais').select('email').limit(1)
  // Erro que não seja "tabela não existe" (ex.: rede) não muda o que já se sabia.
  if (error && !tabelaNaoExiste(error)) return loginDeVerdade?.ativo ?? true
  loginDeVerdade = { ativo: !error, conferidoEm: Date.now() }
  return loginDeVerdade.ativo
}

// Que horas são de verdade, em milissegundos. Não dá pra confiar no relógio da máquina onde
// o servidor roda: o computador de desenvolvimento deste projeto estava 18s adiantado, e as
// horas gravadas no banco (carimbadas pelo próprio Postgres) ficavam "no passado" pra ele.
// A referência é o cabeçalho Date que o Supabase devolve; a diferença é medida uma vez e
// reaproveitada por 10 minutos. Se a medida falhar, vale o relógio local.
export async function horaCerta(): Promise<number> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, '')
  const chave = process.env.SUPABASE_SECRET_KEY?.trim()
  const vencido = !desvioDoRelogio || Date.now() - desvioDoRelogio.medidoEm > 10 * 60 * 1000
  if (vencido && url && chave) {
    let ms = desvioDoRelogio?.ms ?? 0
    try {
      const antes = Date.now()
      const res = await fetch(`${url}/rest/v1/`, { method: 'HEAD', headers: { apikey: chave, Authorization: `Bearer ${chave}` } })
      const la = Date.parse(res.headers.get('date') ?? '')
      // O cabeçalho só tem segundos: diferença menor que 2s é tratada como zero.
      const diferenca = la - (antes + Date.now()) / 2
      if (Number.isFinite(diferenca)) ms = Math.abs(diferenca) < 2000 ? 0 : diferenca
    } catch {
      // sem rede até o Supabase: a chamada ao banco logo em seguida vai falhar por conta própria
    }
    desvioDoRelogio = { ms, medidoEm: Date.now() }
  }
  return Date.now() + (desvioDoRelogio?.ms ?? 0)
}
