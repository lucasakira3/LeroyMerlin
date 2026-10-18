import { NextRequest, NextResponse } from 'next/server'
import { loginDeVerdadeAtivo, supabaseServidor, tabelaNaoExiste } from '@/lib/supabaseServidor'
import { emailValido, normalizarEmail } from '@/lib/servidor/sessao'
import { criarTokenDeRedefinicao } from '@/lib/servidor/redefinicao'
import { emailConfigurado, enviarEmail } from '@/lib/servidor/email'
import { lerCorpo, recusar, semBanco, type RespostaAuth } from '@/lib/servidor/respostasAuth'
import { DEMO_EMAIL } from '@/lib/demoSeed'

export const dynamic = 'force-dynamic'

// "Esqueci minha senha", passo 1: manda pro e-mail um link pra criar uma senha nova (o link
// e o que ele carrega estão em lib/servidor/redefinicao.ts; a troca em si é em ../redefinir).
//
// A resposta é a MESMA exista a conta ou não ("se existir, enviamos"): senão esta tela
// serviria pra descobrir quais e-mails têm conta no site.
export async function POST(req: NextRequest) {
  const sb = supabaseServidor()
  if (!sb) return semBanco('sem-configuracao')
  if (!(await loginDeVerdadeAtivo(sb))) return semBanco('tabelas-ausentes')

  const corpo = await lerCorpo(req)
  const email = normalizarEmail(corpo.email)
  if (!emailValido(email)) return recusar('email_invalido', 400)
  if (!emailConfigurado()) return recusar('email_indisponivel', 503)

  const pronto = NextResponse.json<RespostaAuth>({ ativo: true })
  // A conta de demonstração tem senha fixa, mostrada na tela do /demo: não se redefine.
  if (email === DEMO_EMAIL) return pronto

  const conta = await sb.from('credenciais').select('senha_hash').eq('email', email).maybeSingle()
  if (tabelaNaoExiste(conta.error)) return semBanco('tabelas-ausentes')
  if (conta.error) return recusar('falha', 500)
  if (!conta.data) return pronto

  const token = criarTokenDeRedefinicao(email, conta.data.senha_hash as string)
  if (!token) return recusar('falha', 500)
  // O link aponta pro mesmo endereço por onde o pedido chegou (site publicado, prévia da
  // Vercel ou o computador de quem está testando).
  const link = `${req.nextUrl.origin}/redefinir-senha?token=${encodeURIComponent(token)}`

  try {
    await enviarEmail({
      para: email,
      assunto: 'Redefinir sua senha — Leroy Merlin',
      texto: [
        'Olá!',
        '',
        'Recebemos um pedido para redefinir a senha da sua conta no site da Leroy Merlin (projeto acadêmico FIAP).',
        'Abra o link abaixo para criar uma senha nova. Ele vale por 30 minutos e só funciona uma vez.',
        '',
        link,
        '',
        'Se não foi você que pediu, é só ignorar este e-mail: sua senha continua a mesma.',
      ].join('\n'),
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
          <div style="background: #00843d; color: #fff; padding: 20px 24px; border-radius: 12px 12px 0 0; font-size: 18px; font-weight: bold;">
            Leroy Merlin
          </div>
          <div style="border: 1px solid #e5e7eb; border-top: 0; border-radius: 0 0 12px 12px; padding: 24px;">
            <p style="margin: 0 0 12px;">Olá!</p>
            <p style="margin: 0 0 20px; line-height: 1.5;">Recebemos um pedido para redefinir a senha da sua conta. Toque no botão para criar uma senha nova.</p>
            <a href="${link}" style="display: inline-block; background: #00843d; color: #fff; text-decoration: none; font-weight: bold; padding: 12px 24px; border-radius: 10px;">Criar senha nova</a>
            <p style="margin: 20px 0 0; font-size: 13px; color: #4b5563; line-height: 1.5;">O link vale por 30 minutos e só funciona uma vez. Se não foi você que pediu, ignore este e-mail: sua senha continua a mesma.</p>
            <p style="margin: 16px 0 0; font-size: 12px; color: #6b7280;">Projeto acadêmico — FIAP Challenge 2026. Loja fictícia.</p>
          </div>
        </div>`,
    })
  } catch (erro) {
    console.error('[POST /api/auth/esqueci] envio falhou:', erro instanceof Error ? erro.message : erro)
    return recusar('falha', 502)
  }
  return pronto
}
