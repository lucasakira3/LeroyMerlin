import type { Bandeira } from './pagamento'

// Carteira de cartões salvos, mesmo padrão de clientEnderecos.ts. Só guarda os 4 últimos
// dígitos + bandeira + nome impresso + validade — NUNCA o número completo (mesma regra de
// lib/pagamento.ts). Na prática isso significa que "usar um cartão salvo" no checkout só
// evita redigitar número/nome/validade; o CVV ainda é pedido de novo a cada compra, igual
// site grande de verdade faz.
const CHAVE = 'lm_cartoes_cliente'

export interface CartaoSalvo {
  id: string
  apelido: string
  bandeira: Bandeira
  ultimosDigitos: string
  nomeImpresso: string
  validade: string
  padrao: boolean
}

export type NovoCartaoSalvo = Omit<CartaoSalvo, 'id' | 'padrao'>

type Mapa = Record<string, CartaoSalvo[]>

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

export function getCartoes(email: string): CartaoSalvo[] {
  return lerMapa()[email] ?? []
}

export function salvarCartao(email: string, dados: NovoCartaoSalvo): CartaoSalvo {
  const mapa = lerMapa()
  const cartoes = mapa[email] ?? []
  const novo: CartaoSalvo = {
    ...dados,
    id: Date.now().toString(36),
    apelido: dados.apelido.trim() || `${dados.bandeira} final ${dados.ultimosDigitos}`,
    // O primeiro cartão salvo já nasce padrão, mesma lógica de clientEnderecos.ts.
    padrao: cartoes.length === 0,
  }
  mapa[email] = [...cartoes, novo]
  salvarMapa(mapa)
  return novo
}

export function removerCartao(email: string, id: string): void {
  const mapa = lerMapa()
  const cartoes = (mapa[email] ?? []).filter(c => c.id !== id)
  if (cartoes.length > 0 && !cartoes.some(c => c.padrao)) {
    cartoes[0] = { ...cartoes[0], padrao: true }
  }
  mapa[email] = cartoes
  salvarMapa(mapa)
}

export function definirCartaoPadrao(email: string, id: string): void {
  const mapa = lerMapa()
  const cartoes = mapa[email] ?? []
  mapa[email] = cartoes.map(c => ({ ...c, padrao: c.id === id }))
  salvarMapa(mapa)
}
