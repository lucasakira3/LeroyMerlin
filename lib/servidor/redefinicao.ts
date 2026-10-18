// Link de "Esqueci minha senha".
//
// O link leva um "vale" assinado pelo servidor dizendo: este e-mail pode trocar a senha até tal
// hora. Não precisa de tabela nova no banco:
//   - a assinatura usa uma chave derivada da SUPABASE_SECRET_KEY, então ninguém fabrica um vale;
//   - vale por 30 minutos;
//   - leva uma "impressão" da senha atual (um resumo do que está guardado no banco, não a senha).
//     Quando a senha é trocada, a impressão muda e o mesmo link para de funcionar — ou seja,
//     cada link só serve uma vez, e um link antigo não serve depois de a pessoa trocar a senha.
import { createHmac, timingSafeEqual } from 'crypto'

const VALIDADE_MS = 30 * 60 * 1000

function chave(): Buffer | null {
  const segredo = process.env.SUPABASE_SECRET_KEY?.trim()
  return segredo ? createHmac('sha256', segredo).update('lm-redefinir-senha-v1').digest() : null
}

function assinar(conteudo: string, k: Buffer): string {
  return createHmac('sha256', k).update(conteudo).digest('base64url')
}

// Resumo curto do que está guardado no banco pra senha atual (já é um hash scrypt).
export function impressaoDaSenha(senhaHash: string): string {
  const k = chave()
  return k ? createHmac('sha256', k).update(`senha:${senhaHash}`).digest('base64url').slice(0, 22) : ''
}

export function criarTokenDeRedefinicao(email: string, senhaHash: string, agora = Date.now()): string | null {
  const k = chave()
  if (!k) return null
  const conteudo = Buffer.from(JSON.stringify({
    t: 'redefinir', e: email, x: agora + VALIDADE_MS, f: impressaoDaSenha(senhaHash),
  })).toString('base64url')
  return `${conteudo}.${assinar(conteudo, k)}`
}

// Devolve e-mail e impressão se o vale é autêntico e está no prazo. Conferir a impressão contra
// a senha guardada AGORA é com quem chama (precisa ler o banco).
export function lerTokenDeRedefinicao(token: unknown, agora = Date.now()): { email: string; impressao: string } | null {
  const k = chave()
  if (!k || typeof token !== 'string') return null
  const [conteudo, assinatura] = token.split('.')
  if (!conteudo || !assinatura) return null
  const esperada = Buffer.from(assinar(conteudo, k))
  const recebida = Buffer.from(assinatura)
  if (esperada.length !== recebida.length || !timingSafeEqual(esperada, recebida)) return null
  try {
    const dados = JSON.parse(Buffer.from(conteudo, 'base64url').toString('utf8'))
    if (dados.t !== 'redefinir' || typeof dados.e !== 'string' || typeof dados.x !== 'number' || typeof dados.f !== 'string') return null
    if (dados.x < agora) return null
    return { email: dados.e, impressao: dados.f }
  } catch {
    return null
  }
}
