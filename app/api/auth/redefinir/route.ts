import { NextRequest, NextResponse } from 'next/server'
import { loginDeVerdadeAtivo, supabaseServidor, tabelaNaoExiste } from '@/lib/supabaseServidor'
import { gerarHash, senhaValida } from '@/lib/servidor/senha'
import { cookieDeSessao } from '@/lib/servidor/sessao'
import { impressaoDaSenha, lerTokenDeRedefinicao } from '@/lib/servidor/redefinicao'
import { lerCorpo, recusar, semBanco, type RespostaAuth } from '@/lib/servidor/respostasAuth'
import { DEMO_EMAIL } from '@/lib/demoSeed'

export const dynamic = 'force-dynamic'

// "Esqueci minha senha", passo 2: quem abriu o link do e-mail escolhe a senha nova. Confere o
// vale do link (lib/servidor/redefinicao.ts), troca a senha e já deixa a pessoa logada — ela
// acabou de provar que recebe os e-mails daquele endereço.
//
// Com `{ token }` e sem `novaSenha`, só diz se o link ainda vale: a tela usa isso pra avisar
// "link vencido" logo ao abrir, em vez de deixar a pessoa digitar a senha à toa.
export async function POST(req: NextRequest) {
  const sb = supabaseServidor()
  if (!sb) return semBanco('sem-configuracao')
  if (!(await loginDeVerdadeAtivo(sb))) return semBanco('tabelas-ausentes')

  const corpo = await lerCorpo(req)
  const vale = lerTokenDeRedefinicao(corpo.token)
  if (!vale || vale.email === DEMO_EMAIL) return recusar('link_invalido', 400)

  const conta = await sb.from('credenciais').select('senha_hash').eq('email', vale.email).maybeSingle()
  if (tabelaNaoExiste(conta.error)) return semBanco('tabelas-ausentes')
  if (conta.error) return recusar('falha', 500)
  // Conta apagada depois do pedido, ou senha já trocada (por este link ou de outro jeito).
  if (!conta.data || impressaoDaSenha(conta.data.senha_hash as string) !== vale.impressao) {
    return recusar('link_invalido', 400)
  }

  if (corpo.novaSenha === undefined) return NextResponse.json<RespostaAuth>({ ativo: true, email: vale.email })
  if (!senhaValida(corpo.novaSenha)) return recusar('senha_invalida', 400)

  const troca = await sb.from('credenciais')
    .update({ senha_hash: gerarHash(corpo.novaSenha as string), atualizado_em: new Date().toISOString() })
    .eq('email', vale.email)
  if (troca.error) return recusar('falha', 500)

  const cookie = cookieDeSessao('cliente', vale.email)
  const resposta = NextResponse.json<RespostaAuth>({ ativo: true, email: vale.email })
  if (cookie) resposta.cookies.set(cookie)
  return resposta
}
