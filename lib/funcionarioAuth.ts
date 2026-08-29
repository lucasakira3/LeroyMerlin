// Sessão do funcionário — mesmo padrão "fake auth por design" de lib/clientAuth.ts
// (é um MVP acadêmico, sem backend). Antes desta sessão, o login de funcionário não
// persistia nada: qualquer e-mail/senha "entrava" e a área inteira ficava acessível
// direto por URL sem sessão nenhuma. Isso pelo menos torna Sair/Entrar reais.
const CHAVE = 'lm_funcionario_logado'

export interface FuncionarioLogado {
  email: string
}

export function loginFuncionario(email: string): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(CHAVE, JSON.stringify({ email }))
}

export function logoutFuncionario(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(CHAVE)
}

export function getFuncionarioLogado(): FuncionarioLogado | null {
  if (typeof window === 'undefined') return null
  try {
    const bruto = window.localStorage.getItem(CHAVE)
    if (!bruto) return null
    const dados = JSON.parse(bruto)
    if (!dados || typeof dados.email !== 'string') return null
    return dados
  } catch {
    return null
  }
}
