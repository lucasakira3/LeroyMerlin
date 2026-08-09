const CHAVE = 'lm_usuario_logado'

export interface UsuarioLogado {
  email: string
  nome?: string
}

function ler(): UsuarioLogado | null {
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

export function loginUsuario(email: string, nome?: string): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(CHAVE, JSON.stringify({ email, nome }))
}

export function logoutUsuario(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(CHAVE)
}

export function getUsuarioLogado(): UsuarioLogado | null {
  return ler()
}
