// Sessão de quem fez login, do lado do servidor.
//
// Depois de conferir a senha, o servidor entrega ao navegador um "crachá": um cookie com
// quem é a pessoa (papel + e-mail) e até quando vale, assinado com uma chave que só o
// servidor tem. A cada chamada o navegador devolve o cookie sozinho, e o servidor confere a
// assinatura — se alguém alterar o e-mail dentro do cookie, a assinatura não bate.
//
// O cookie é `httpOnly`: o JavaScript da página não consegue ler nem copiar. Por isso as
// telas continuam usando as marcas de sempre no localStorage (`lm_usuario_logado`,
// `lm_funcionario_logado`) pra saber o que desenhar; quem decide o que cada um pode ler e
// gravar no banco é este cookie, não aquelas marcas.
//
// Dois cookies, um por papel: o mesmo navegador pode estar logado como cliente e como
// funcionário ao mesmo tempo (é assim que o time demonstra os dois lados em duas abas).
import { createHmac, timingSafeEqual } from 'crypto'
import type { NextRequest } from 'next/server'

export type PapelLogado = 'cliente' | 'funcionario'

const COOKIE: Record<PapelLogado, string> = {
  cliente: 'lm_sessao_cliente',
  funcionario: 'lm_sessao_funcionario',
}
const VALIDADE_S = 30 * 24 * 60 * 60

export function normalizarEmail(email: unknown): string {
  return typeof email === 'string' ? email.trim().toLowerCase() : ''
}

export function emailValido(email: string): boolean {
  return email.length <= 200 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// A chave da assinatura é derivada da chave secreta do Supabase, pra não exigir mais uma
// variável de ambiente. Sem a chave secreta não há banco nem login de verdade.
function chave(): Buffer | null {
  const segredo = process.env.SUPABASE_SECRET_KEY?.trim()
  return segredo ? createHmac('sha256', segredo).update('lm-sessao-v1').digest() : null
}

function assinar(conteudo: string, chaveDaAssinatura: Buffer): string {
  return createHmac('sha256', chaveDaAssinatura).update(conteudo).digest('base64url')
}

export function criarToken(papel: PapelLogado, email: string, agora = Date.now()): string | null {
  const k = chave()
  if (!k) return null
  const conteudo = Buffer.from(JSON.stringify({ p: papel, e: email, x: Math.floor(agora / 1000) + VALIDADE_S })).toString('base64url')
  return `${conteudo}.${assinar(conteudo, k)}`
}

export function lerToken(token: string | undefined, papel: PapelLogado, agora = Date.now()): { email: string } | null {
  const k = chave()
  if (!k || !token) return null
  const [conteudo, assinatura] = token.split('.')
  if (!conteudo || !assinatura) return null
  const esperada = Buffer.from(assinar(conteudo, k))
  const recebida = Buffer.from(assinatura)
  if (esperada.length !== recebida.length || !timingSafeEqual(esperada, recebida)) return null
  try {
    const dados = JSON.parse(Buffer.from(conteudo, 'base64url').toString('utf8'))
    if (dados.p !== papel || typeof dados.e !== 'string' || typeof dados.x !== 'number') return null
    if (dados.x * 1000 < agora) return null
    return { email: dados.e }
  } catch {
    return null
  }
}

export function sessaoDaRequisicao(req: NextRequest, papel: PapelLogado): { email: string } | null {
  return lerToken(req.cookies.get(COOKIE[papel])?.value, papel)
}

const OPCOES = {
  httpOnly: true,
  sameSite: 'lax' as const,
  // Em desenvolvimento o site roda em http://localhost, onde cookie `secure` não é aceito.
  secure: process.env.NODE_ENV === 'production',
  path: '/',
}

// Pra usar com `resposta.cookies.set(...)`.
export function cookieDeSessao(papel: PapelLogado, email: string) {
  const token = criarToken(papel, email)
  return token ? { name: COOKIE[papel], value: token, ...OPCOES, maxAge: VALIDADE_S } : null
}

export function cookieDeSaida(papel: PapelLogado) {
  return { name: COOKIE[papel], value: '', ...OPCOES, maxAge: 0 }
}
