// Rascunho automático do Projeto Guiado: guarda a conversa, a lista gerada pela IA e o
// progresso do cliente a cada mudança, pra ele poder sair da tela (ou ir fazer login) e
// voltar sem perder nada nem gastar outra chamada da IA. É um rascunho só, por navegador —
// diferente de lib/clientProjetos.ts, que é a lista de projetos que o cliente escolheu
// SALVAR na conta ("Salvar projeto"). Sem backend: fica em localStorage.
import type { Projeto } from '@/components/ProjetoMosaico'

const CHAVE = 'lm_projeto_rascunho'

export interface MensagemRascunho {
  role: 'user' | 'ia'
  texto: string
}

// O que o cliente já fez dentro do resultado (components/ListaDeCompras.tsx).
export interface ProgressoProjeto {
  selecionados: string[]
  itensConcluidos: number[]
  loja: string
  // Id em Minha Conta > Projetos, se o cliente já clicou em "Salvar projeto".
  salvoId: string | null
}

export interface RascunhoProjeto {
  // E-mail de quem estava logado quando o rascunho foi gravado; null = sem login.
  dono: string | null
  comodos: string[]
  mensagens: MensagemRascunho[]
  resultado: Projeto | null
  progresso: ProgressoProjeto | null
  atualizadoEm: string
}

// Rascunho de outra conta não aparece. O feito SEM login é adotado por quem entrar depois:
// é o caminho de quem gera a lista, clica em "Entre para salvar o projeto" e volta logado.
export function lerRascunho(emailAtual: string | null): RascunhoProjeto | null {
  if (typeof window === 'undefined') return null
  try {
    const bruto = window.localStorage.getItem(CHAVE)
    if (!bruto) return null
    const dados = JSON.parse(bruto) as RascunhoProjeto
    if (!dados || !Array.isArray(dados.mensagens) || !Array.isArray(dados.comodos)) return null
    if (dados.resultado && !Array.isArray(dados.resultado.itens)) return null
    if (dados.dono && dados.dono !== emailAtual) return null
    return dados
  } catch {
    return null
  }
}

// Devolve false se o navegador recusar gravar (armazenamento cheio) — a tela só deixa de
// mostrar o aviso de "salvo automaticamente", sem quebrar nada.
export function salvarRascunho(rascunho: Omit<RascunhoProjeto, 'atualizadoEm'>): boolean {
  if (typeof window === 'undefined') return false
  try {
    window.localStorage.setItem(CHAVE, JSON.stringify({ ...rascunho, atualizadoEm: new Date().toISOString() }))
    return true
  } catch {
    return false
  }
}

export function limparRascunho(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(CHAVE)
}
