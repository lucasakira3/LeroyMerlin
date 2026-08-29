// Endereços salvos por e-mail, mesmo padrão de clientContas.ts/clientPedidos.ts. Só uma
// conveniência pro checkout (app/carrinho/page.tsx): selecionar um endereço salvo apenas
// preenche o campo de texto livre que já existia, não substitui a digitação manual.
const CHAVE = 'lm_enderecos_cliente'

export interface Endereco {
  id: string
  rotulo: string
  texto: string
  padrao: boolean
}

type Mapa = Record<string, Endereco[]>

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

export function getEnderecos(email: string): Endereco[] {
  return lerMapa()[email] ?? []
}

export function salvarEndereco(email: string, rotulo: string, texto: string): void {
  const mapa = lerMapa()
  const enderecos = mapa[email] ?? []
  const novo: Endereco = {
    id: Date.now().toString(36),
    rotulo: rotulo.trim() || 'Endereço',
    texto: texto.trim(),
    padrao: enderecos.length === 0,
  }
  mapa[email] = [...enderecos, novo]
  salvarMapa(mapa)
}

export function removerEndereco(email: string, id: string): void {
  const mapa = lerMapa()
  const enderecos = (mapa[email] ?? []).filter(e => e.id !== id)
  // Se o removido era o padrão, promove o primeiro que sobrou.
  if (enderecos.length > 0 && !enderecos.some(e => e.padrao)) {
    enderecos[0] = { ...enderecos[0], padrao: true }
  }
  mapa[email] = enderecos
  salvarMapa(mapa)
}

// Usado só pelo desfazer de remoção (ver components/EnderecosSalvos.tsx) — reinsere o
// objeto exato que foi removido, em vez de gerar um novo id como salvarEndereco faz.
export function restaurarEndereco(email: string, endereco: Endereco): void {
  const mapa = lerMapa()
  const enderecos = mapa[email] ?? []
  mapa[email] = [...enderecos, endereco]
  salvarMapa(mapa)
}

export function definirEnderecoPadrao(email: string, id: string): void {
  const mapa = lerMapa()
  const enderecos = mapa[email] ?? []
  mapa[email] = enderecos.map(e => ({ ...e, padrao: e.id === id }))
  salvarMapa(mapa)
}
