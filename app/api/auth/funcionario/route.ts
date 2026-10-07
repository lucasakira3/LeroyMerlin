import { NextRequest, NextResponse } from 'next/server'
import { supabaseServidor, tabelaNaoExiste } from '@/lib/supabaseServidor'
import { conferirSenha, gerarHash, senhaValida } from '@/lib/servidor/senha'
import { cookieDeSessao, emailValido, normalizarEmail } from '@/lib/servidor/sessao'
import { lerCorpo, recusar, semBanco, type RespostaAuth } from '@/lib/servidor/respostasAuth'

export const dynamic = 'force-dynamic'

// Entrar no painel do funcionário. O painel tem UMA senha, compartilhada por quem trabalha
// na loja; o e-mail só identifica quem está usando (aparece na barra lateral).
//
// Primeiro acesso: enquanto ninguém definiu a senha do painel, a senha digitada no primeiro
// login passa a ser ela. Assim o time escolhe a senha na própria tela, sem precisar mexer no
// banco. Pra trocar depois: "Trocar senha do painel" na barra lateral (app/api/auth/senha).
// Se a senha for esquecida, apagar a linha da tabela `painel` no Supabase faz o próximo
// login defini-la de novo.
export async function POST(req: NextRequest) {
  const sb = supabaseServidor()
  if (!sb) return semBanco('sem-configuracao')

  const corpo = await lerCorpo(req)
  const email = normalizarEmail(corpo.email)
  const senha = corpo.senha
  if (!emailValido(email)) return recusar('email_invalido', 400)
  if (!senhaValida(senha)) return recusar('senha_invalida', 400)

  const painel = await sb.from('painel').select('senha_hash').eq('id', true).maybeSingle()
  if (tabelaNaoExiste(painel.error)) return semBanco('tabelas-ausentes')
  if (painel.error) return recusar('falha', 500)

  let criado = false
  if (painel.data) {
    if (!conferirSenha(senha, painel.data.senha_hash as string)) return recusar('senha_incorreta', 401)
  } else {
    const nova = await sb.from('painel').insert({ id: true, senha_hash: gerarHash(senha) })
    if (nova.error) {
      // Outra pessoa definiu a senha no mesmo instante: vale a dela.
      const agora = await sb.from('painel').select('senha_hash').eq('id', true).maybeSingle()
      if (!agora.data || !conferirSenha(senha, agora.data.senha_hash as string)) return recusar('senha_incorreta', 401)
    } else {
      criado = true
    }
  }

  const cookie = cookieDeSessao('funcionario', email)
  if (!cookie) return semBanco('sem-configuracao')
  const resposta = NextResponse.json<RespostaAuth>({ ativo: true, email, criado })
  resposta.cookies.set(cookie)
  return resposta
}
