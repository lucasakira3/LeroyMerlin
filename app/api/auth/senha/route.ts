import { NextRequest, NextResponse } from 'next/server'
import { loginDeVerdadeAtivo, supabaseServidor, tabelaNaoExiste } from '@/lib/supabaseServidor'
import { conferirSenha, gerarHash, senhaValida } from '@/lib/servidor/senha'
import { sessaoDaRequisicao } from '@/lib/servidor/sessao'
import { lerCorpo, recusar, semBanco, type RespostaAuth } from '@/lib/servidor/respostasAuth'
import { DEMO_EMAIL } from '@/lib/demoSeed'

export const dynamic = 'force-dynamic'

// Trocar a senha: a do próprio cliente (Minha conta › Segurança) ou a do painel do
// funcionário (barra lateral do painel). Nos dois casos precisa estar logado naquele papel
// E acertar a senha atual — estar logado não basta, pra quem pegar um aparelho destravado
// não conseguir trocar a senha e ficar com a conta.
export async function POST(req: NextRequest) {
  const sb = supabaseServidor()
  if (!sb) return semBanco('sem-configuracao')
  // Sem as tabelas de senha não existe senha pra trocar (nem sessão pra conferir): responde
  // "sem banco" antes de reclamar da sessão, pra tela dar o aviso certo.
  if (!(await loginDeVerdadeAtivo(sb))) return semBanco('tabelas-ausentes')

  const corpo = await lerCorpo(req)
  const papel = corpo.papel
  if (papel !== 'cliente' && papel !== 'funcionario') return recusar('falha', 400)
  const sessao = sessaoDaRequisicao(req, papel)
  if (!sessao) return recusar('sem_sessao', 401)
  if (typeof corpo.senhaAtual !== 'string' || !senhaValida(corpo.novaSenha)) return recusar('senha_invalida', 400)
  // A conta de demonstração (/demo) entra com uma senha fixa, escrita no código e mostrada
  // na tela. Se alguém a trocasse, o modo demo pararia de funcionar pra todo mundo.
  if (papel === 'cliente' && sessao.email === DEMO_EMAIL) return recusar('falha', 403)

  const tabela = papel === 'cliente' ? 'credenciais' : 'painel'
  const coluna = papel === 'cliente' ? 'email' : 'id'
  const valor = papel === 'cliente' ? sessao.email : true

  const atual = await sb.from(tabela).select('senha_hash').eq(coluna, valor).maybeSingle()
  if (tabelaNaoExiste(atual.error)) return semBanco('tabelas-ausentes')
  if (atual.error) return recusar('falha', 500)
  if (!atual.data || !conferirSenha(corpo.senhaAtual, atual.data.senha_hash as string)) return recusar('senha_incorreta', 401)

  const troca = await sb.from(tabela)
    .update({ senha_hash: gerarHash(corpo.novaSenha), atualizado_em: new Date().toISOString() })
    .eq(coluna, valor)
  if (troca.error) return recusar('falha', 500)
  return NextResponse.json<RespostaAuth>({ ativo: true })
}
