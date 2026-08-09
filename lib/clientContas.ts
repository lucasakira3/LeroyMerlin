const CHAVE = 'lm_contas_cliente'

export interface ContaCliente {
  nome: string
  senha: string
  criadoEm: string
}

type Mapa = Record<string, ContaCliente>

function normalizar(email: string): string {
  return email.trim().toLowerCase()
}

function lerMapa(): Mapa {
  if (typeof window === 'undefined') return {}
  try {
    const bruto = window.localStorage.getItem(CHAVE)
    if (!bruto) return {}
    const dados = JSON.parse(bruto)
    if (!dados || typeof dados !== 'object' || Array.isArray(dados)) return {}
    return dados
  } catch {
    return {}
  }
}

function salvarMapa(mapa: Mapa): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(CHAVE, JSON.stringify(mapa))
}

export function contaExiste(email: string): boolean {
  const mapa = lerMapa()
  return normalizar(email) in mapa
}

export function criarConta(nome: string, email: string, senha: string): void {
  const mapa = lerMapa()
  mapa[normalizar(email)] = { nome, senha, criadoEm: new Date().toISOString() }
  salvarMapa(mapa)
}

export function validarLogin(email: string, senha: string): 'ok' | 'nao_encontrada' | 'senha_incorreta' {
  const conta = lerMapa()[normalizar(email)]
  if (!conta) return 'nao_encontrada'
  if (conta.senha !== senha) return 'senha_incorreta'
  return 'ok'
}

export function getConta(email: string): ContaCliente | null {
  return lerMapa()[normalizar(email)] ?? null
}
