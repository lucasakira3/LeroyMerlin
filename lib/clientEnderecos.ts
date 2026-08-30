// Endereços salvos por e-mail, mesmo padrão de clientContas.ts/clientPedidos.ts.
// Estruturado (CEP/rua/número/bairro/cidade/UF) em vez de um campo de texto livre único —
// combina com o formulário de checkout que usa lib/cep.ts pra autocompletar via ViaCEP.
const CHAVE = 'lm_enderecos_cliente'

export interface Endereco {
  id: string
  rotulo: string
  cep: string
  rua: string
  numero: string
  complemento?: string
  bairro: string
  cidade: string
  uf: string
  padrao: boolean
}

export type NovoEndereco = Omit<Endereco, 'id' | 'padrao'>

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

export function salvarEndereco(email: string, dados: NovoEndereco): Endereco {
  const mapa = lerMapa()
  const enderecos = mapa[email] ?? []
  const novo: Endereco = {
    ...dados,
    id: Date.now().toString(36),
    rotulo: dados.rotulo.trim() || 'Endereço',
    padrao: enderecos.length === 0,
  }
  mapa[email] = [...enderecos, novo]
  salvarMapa(mapa)
  return novo
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

// Uma linha de exibição — usada nos chips do checkout, no card de /conta e como
// instantâneo salvo em Pedido.endereco (que continua sendo só uma string, não o objeto
// estruturado, porque um pedido é um retrato do que foi digitado na hora da compra).
export function formatarEndereco(e: Pick<Endereco, 'rua' | 'numero' | 'complemento' | 'bairro' | 'cidade' | 'uf' | 'cep'>): string {
  const linha1 = `${e.rua}, ${e.numero}${e.complemento ? ` - ${e.complemento}` : ''}`
  const linha2 = `${e.bairro}, ${e.cidade}/${e.uf} - CEP ${e.cep}`
  return `${linha1}, ${linha2}`
}
