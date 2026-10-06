// Clientes que o painel do funcionário conhece: os que se cadastraram NESTE navegador
// (lib/clientContas.ts) mais os que vieram do banco, cadastrados em outros aparelhos
// (lib/sync). Antes do Supabase só existia a primeira lista, e por isso o pedido feito no
// celular do cliente aparecia no painel sem nome.
const CHAVE_CONTAS = 'lm_contas_cliente'
const CHAVE_REMOTOS = 'lm_clientes_remotos'

export interface ClienteConhecido {
  nome: string
  criadoEm: string
}

function ler(chave: string): Record<string, { nome?: string; criadoEm?: string }> {
  if (typeof window === 'undefined') return {}
  try {
    const dados = JSON.parse(window.localStorage.getItem(chave) ?? '{}')
    return dados && typeof dados === 'object' && !Array.isArray(dados) ? dados : {}
  } catch {
    return {}
  }
}

// Chave = e-mail em minúsculas. Quando o mesmo cliente está nas duas listas, vale a conta
// deste navegador.
export function getClientesConhecidos(): Record<string, ClienteConhecido> {
  const juntos: Record<string, ClienteConhecido> = {}
  for (const origem of [ler(CHAVE_REMOTOS), ler(CHAVE_CONTAS)]) {
    for (const [email, conta] of Object.entries(origem)) {
      juntos[email] = { nome: conta?.nome || email, criadoEm: conta?.criadoEm ?? '' }
    }
  }
  return juntos
}

export function nomeDoCliente(clientes: Record<string, ClienteConhecido>, email: string): string {
  return clientes[email.trim().toLowerCase()]?.nome ?? clientes[email]?.nome ?? email
}
