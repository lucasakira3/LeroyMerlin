import type { Perfil } from '@/types/perfil'

const CHAVE = 'lm_perfil_cliente'

type Mapa = Record<string, Perfil>

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

export function salvarPerfil(email: string, perfil: Perfil): void {
  const mapa = lerMapa()
  mapa[normalizar(email)] = perfil
  salvarMapa(mapa)
}

export function getPerfil(email: string): Perfil | null {
  return lerMapa()[normalizar(email)] ?? null
}

export function limparPerfil(email: string): void {
  const mapa = lerMapa()
  delete mapa[normalizar(email)]
  salvarMapa(mapa)
}
