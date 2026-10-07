import { NextRequest, NextResponse } from 'next/server'
import { supabaseServidor, tabelaNaoExiste } from '@/lib/supabaseServidor'
import { conferirSenha, gerarHash, senhaValida } from '@/lib/servidor/senha'
import { cookieDeSessao, emailValido, normalizarEmail } from '@/lib/servidor/sessao'
import { lerCorpo, recusar, semBanco, type RespostaAuth } from '@/lib/servidor/respostasAuth'

export const dynamic = 'force-dynamic'

// Entrar como cliente. Continua sem tela de cadastro, como sempre foi no site: o primeiro
// login com um e-mail novo cria a conta com a senha digitada. A diferença é que, daí em
// diante, só aquela senha entra — antes qualquer senha entrava, e bastava digitar o e-mail
// de outra pessoa pra ver os pedidos dela.
//
// Sem limite de tentativas por enquanto (MVP): quem quiser pode testar senhas à vontade.
export async function POST(req: NextRequest) {
  const sb = supabaseServidor()
  if (!sb) return semBanco('sem-configuracao')

  const corpo = await lerCorpo(req)
  const email = normalizarEmail(corpo.email)
  const senha = corpo.senha
  if (!emailValido(email)) return recusar('email_invalido', 400)
  if (!senhaValida(senha)) return recusar('senha_invalida', 400)

  const existente = await sb.from('credenciais').select('senha_hash').eq('email', email).maybeSingle()
  if (tabelaNaoExiste(existente.error)) return semBanco('tabelas-ausentes')
  if (existente.error) return recusar('falha', 500)

  let criado = false
  if (existente.data) {
    if (!conferirSenha(senha, existente.data.senha_hash as string)) return recusar('senha_incorreta', 401)
  } else {
    const novo = await sb.from('credenciais').insert({ email, senha_hash: gerarHash(senha) })
    if (novo.error) {
      // Dois logins do mesmo e-mail novo ao mesmo tempo: o outro criou primeiro. Vale a
      // senha dele; confere a deste contra ela.
      const agora = await sb.from('credenciais').select('senha_hash').eq('email', email).maybeSingle()
      if (!agora.data || !conferirSenha(senha, agora.data.senha_hash as string)) return recusar('senha_incorreta', 401)
    } else {
      criado = true
    }
  }

  const cookie = cookieDeSessao('cliente', email)
  if (!cookie) return semBanco('sem-configuracao')
  const resposta = NextResponse.json<RespostaAuth>({ ativo: true, email, criado })
  resposta.cookies.set(cookie)
  return resposta
}
