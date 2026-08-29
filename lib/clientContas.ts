// Cadastro de cliente sem backend: senha fica em texto puro no localStorage (aceitável só
// porque é um MVP local/acadêmico, nunca faria isso com dado real). validarLogin distingue
// 'nao_encontrada' de 'senha_incorreta' pra dar mensagem de erro específica no formulário.
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

// Só nome e senha são editáveis — email não, porque é a chave usada em clientPedidos.ts,
// clientAvaliacoes.ts, clientPerfil.ts e clientHistorico.ts; deixar trocar o email
// órfãozaria todo o histórico do cliente nesses outros mapas.
export function atualizarConta(email: string, dados: { nome?: string; senha?: string }): void {
  const mapa = lerMapa()
  const chave = normalizar(email)
  const atual = mapa[chave]
  if (!atual) return
  mapa[chave] = {
    ...atual,
    nome: dados.nome?.trim() || atual.nome,
    senha: dados.senha || atual.senha,
  }
  salvarMapa(mapa)
}
