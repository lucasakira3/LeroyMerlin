// Login de verdade, do lado da tela: fala com as rotas app/api/auth/*, que conferem a senha
// no banco e entregam o cookie de sessão (lib/servidor/sessao.ts).
//
// As marcas de sempre no localStorage (`lm_usuario_logado`, `lm_funcionario_logado`)
// continuam existindo: é por elas que as telas sabem o que desenhar. Este arquivo cuida só
// da parte que o servidor confere.
//
// Plano B: quando a resposta é 'sem-banco' (Supabase não configurado, sem as tabelas da
// etapa 2, ou fora do ar), quem chama cai no login antigo — só deste aparelho, qualquer senha
// — pra o site não parar de funcionar. Nesse modo nada é sincronizado mesmo.
import type { RespostaAuth } from './authTipos'

export type ResultadoLogin =
  | { tipo: 'ok'; email: string; criado: boolean }
  | { tipo: 'senha_incorreta' }
  | { tipo: 'invalido'; mensagem: string }
  | { tipo: 'sem-banco' }

async function chamar(rota: string, corpo: unknown): Promise<{ status: number; dados: RespostaAuth } | null> {
  try {
    const res = await fetch(rota, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) })
    return { status: res.status, dados: (await res.json()) as RespostaAuth }
  } catch {
    return null
  }
}

function interpretar(resposta: { status: number; dados: RespostaAuth } | null): ResultadoLogin {
  // Sem resposta (sem internet) ou banco desligado: plano B.
  if (!resposta || !resposta.dados.ativo) return { tipo: 'sem-banco' }
  const { dados } = resposta
  if (dados.erro === 'senha_incorreta') return { tipo: 'senha_incorreta' }
  if (dados.erro === 'email_invalido') return { tipo: 'invalido', mensagem: 'Confira o e-mail digitado.' }
  if (dados.erro === 'senha_invalida') return { tipo: 'invalido', mensagem: 'A senha precisa ter pelo menos 4 caracteres.' }
  if (dados.erro || !dados.email) return { tipo: 'invalido', mensagem: 'Não foi possível entrar agora. Tente de novo.' }
  return { tipo: 'ok', email: dados.email, criado: dados.criado === true }
}

export async function entrarCliente(email: string, senha: string): Promise<ResultadoLogin> {
  return interpretar(await chamar('/api/auth/cliente', { email, senha }))
}

export async function entrarFuncionario(email: string, senha: string): Promise<ResultadoLogin> {
  return interpretar(await chamar('/api/auth/funcionario', { email, senha }))
}

// Apaga o cookie de sessão. Não espera a resposta: quem chama já está saindo da tela.
export function sairDoServidor(papel: 'cliente' | 'funcionario'): void {
  if (typeof window === 'undefined') return
  void fetch('/api/auth/sair', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ papel }),
    keepalive: true,
  }).catch(() => {})
}

export type ResultadoTrocaDeSenha = 'ok' | 'senha_incorreta' | 'senha_invalida' | 'sem_sessao' | 'sem-banco' | 'falha'

export async function trocarSenha(papel: 'cliente' | 'funcionario', senhaAtual: string, novaSenha: string): Promise<ResultadoTrocaDeSenha> {
  const resposta = await chamar('/api/auth/senha', { papel, senhaAtual, novaSenha })
  if (!resposta || !resposta.dados.ativo) return 'sem-banco'
  const erro = resposta.dados.erro
  if (!erro) return 'ok'
  return erro === 'senha_incorreta' || erro === 'senha_invalida' || erro === 'sem_sessao' ? erro : 'falha'
}
