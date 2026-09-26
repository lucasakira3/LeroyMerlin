// Projetos guiados salvos pelo cliente (Minha Conta > Projetos), sem backend: mapa por e-mail
// em localStorage, mesmo padrão de clientPedidos.ts. Guarda o resultado COMPLETO do
// /api/projeto (incluindo os produtos sugeridos) mais o progresso do cliente — quais
// produtos escolheu em cada item e quais etapas do road map já concluiu — pra ele poder
// sair da tela do Projeto Guiado e voltar depois sem perder nada nem gastar outra chamada
// da IA. O resultado é um instantâneo: preço/estoque não são atualizados depois de salvar.
import type { Projeto } from '@/components/ProjetoMosaico'

const CHAVE = 'lm_projetos_cliente'

export interface ProjetoSalvo {
  id: string
  titulo: string
  descricao: string
  criadoEm: string
  atualizadoEm: string
  loja: string
  projeto: Projeto
  selecionados: string[]
  // Progresso POR ITEM: posições em projeto.itens já marcadas como feitas. A etapa do road
  // map fica concluída quando todos os itens dela estão aqui. (Projetos salvos antes desta
  // versão guardavam `etapasConcluidas`; sem `itensConcluidos` eles abrem sem progresso.)
  itensConcluidos?: number[]
}

type Mapa = Record<string, ProjetoSalvo[]>

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

// Devolve false se o navegador recusar gravar (cota do localStorage cheia — o resultado da
// IA é grande), pra tela poder avisar em vez de fingir que salvou.
function salvarMapa(mapa: Mapa): boolean {
  if (typeof window === 'undefined') return false
  try {
    window.localStorage.setItem(CHAVE, JSON.stringify(mapa))
  } catch {
    return false
  }
  window.dispatchEvent(new Event('lm-projetos-change'))
  return true
}

export function getProjetos(email: string): ProjetoSalvo[] {
  const lista = lerMapa()[normalizar(email)] ?? []
  return [...lista].sort((a, b) => b.atualizadoEm.localeCompare(a.atualizadoEm))
}

export function getProjeto(email: string, id: string): ProjetoSalvo | null {
  return (lerMapa()[normalizar(email)] ?? []).find(p => p.id === id) ?? null
}

export function salvarProjeto(
  email: string,
  dados: Pick<ProjetoSalvo, 'titulo' | 'descricao' | 'loja' | 'projeto' | 'selecionados' | 'itensConcluidos'>
): ProjetoSalvo | null {
  const mapa = lerMapa()
  const chave = normalizar(email)
  const agora = new Date().toISOString()
  // Id no padrão Date.now() do projeto (crypto.randomUUID quebra fora de contexto seguro)
  const novo: ProjetoSalvo = { ...dados, id: Date.now().toString(36), criadoEm: agora, atualizadoEm: agora }
  mapa[chave] = [novo, ...(mapa[chave] ?? [])]
  return salvarMapa(mapa) ? novo : null
}

// Chamado a cada mudança de escolha/etapa concluída na tela do projeto salvo — e também
// quando o cliente pede uma mudança pelo chat do projeto (components/ProjetoChat.tsx), aí
// `projeto` vem junto com a lista já atualizada pela IA.
export function atualizarProgresso(
  email: string,
  id: string,
  dados: Partial<Pick<ProjetoSalvo, 'selecionados' | 'itensConcluidos' | 'loja' | 'projeto'>>
): void {
  const mapa = lerMapa()
  const chave = normalizar(email)
  const lista = mapa[chave] ?? []
  const idx = lista.findIndex(p => p.id === id)
  if (idx === -1) return
  lista[idx] = { ...lista[idx], ...dados, atualizadoEm: new Date().toISOString() }
  mapa[chave] = lista
  salvarMapa(mapa)
}

export function removerProjeto(email: string, id: string): void {
  const mapa = lerMapa()
  const chave = normalizar(email)
  mapa[chave] = (mapa[chave] ?? []).filter(p => p.id !== id)
  salvarMapa(mapa)
}

// Números do cartão na lista: itens e etapas do road map (uma etapa está concluída quando
// todos os itens dela estão feitos) e o total dos produtos escolhidos.
export function resumoProjeto(p: ProjetoSalvo) {
  const feitos = new Set(p.itensConcluidos ?? [])
  const porEtapa = new Map<number, { total: number; feitos: number }>()
  p.projeto.itens.forEach((item, indice) => {
    if (!item.etapa_nome) return
    const ordem = item.etapa_ordem ?? 1
    const e = porEtapa.get(ordem) ?? { total: 0, feitos: 0 }
    e.total += 1
    if (feitos.has(indice)) e.feitos += 1
    porEtapa.set(ordem, e)
  })
  const etapas = Array.from(porEtapa.values())
  const concluidas = etapas.filter(e => e.feitos === e.total).length
  const itensTotal = etapas.reduce((s, e) => s + e.total, 0)
  const itensFeitos = etapas.reduce((s, e) => s + e.feitos, 0)
  const escolhidos = new Set(p.selecionados)
  const total = p.projeto.itens
    .flatMap(i => i.resultados)
    .filter((r, idx, arr) => escolhidos.has(r.produto.id) && arr.findIndex(x => x.produto.id === r.produto.id) === idx)
    .reduce((soma, r) => soma + (((r.produto as any).preco as number | undefined) ?? 0), 0)
  return { totalEtapas: etapas.length, concluidas, itensTotal, itensFeitos, materiais: p.projeto.itens.length, total }
}
