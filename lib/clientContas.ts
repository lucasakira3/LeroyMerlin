// Dados da conta do cliente guardados neste aparelho (nome e data de cadastro).
//
// A SENHA: desde o login de verdade (lib/authServidor.ts) ela é conferida no servidor e NÃO
// fica mais aqui — o campo `senha` fica vazio. Ele só é preenchido no plano B, quando o banco
// está fora do ar e o site cai no login antigo, só deste aparelho (aí sim em texto puro, como
// era antes; aceitável só por ser um MVP acadêmico). validarLogin serve só a esse plano B.
import { pedirSincronizacao } from './sync/motor'

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
  // Só o nome e a data de cadastro vão pro banco (pra o painel do funcionário mostrar quem
  // fez o pedido). A senha nunca sai do aparelho — ver linhasLocais em lib/sync/espelho.ts.
  pedirSincronizacao()
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

// Login conferido no servidor: a cópia local da senha (de quando o login era só local) sai.
export function esquecerSenhaLocal(email: string): void {
  const mapa = lerMapa()
  const chave = normalizar(email)
  if (!mapa[chave] || mapa[chave].senha === '') return
  mapa[chave] = { ...mapa[chave], senha: '' }
  salvarMapa(mapa)
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
