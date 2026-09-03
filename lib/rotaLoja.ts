import { getCorredorRowIndex } from '@/components/StoreMap'

// Rota de Compra Inteligente (ver docs/backlog-fluxo-loja-fisica.md, Grupo A, item 1):
// dado o conjunto de corredores que o cliente precisa visitar, devolve a ordem de
// visita que minimiza idas e vindas pela loja. Usa o padrão "S-shape" (serpentine)
// de picking de armazém — percorre a 1ª fileira de corredores em ordem crescente e,
// ao trocar de fileira, percorre a 2ª em ordem decrescente, formando um "S" contínuo
// em vez de zigue-zague. O(n log n), sem precisar resolver um TSP.
export interface ParadaRota {
  corredorNormalizado: string
  row: 1 | 2
  idx: number
}

export function calcularRota(corredores: string[]): ParadaRota[] {
  const paradas = corredores
    .map(c => ({ corredorNormalizado: c, pos: getCorredorRowIndex(c) }))
    .filter((p): p is { corredorNormalizado: string; pos: { row: 1 | 2; idx: number } } => p.pos !== null)
    .map(p => ({ corredorNormalizado: p.corredorNormalizado, row: p.pos.row, idx: p.pos.idx }))

  const unicos = Array.from(new Map(paradas.map(p => [p.corredorNormalizado, p])).values())

  return unicos.sort((a, b) =>
    a.row !== b.row ? a.row - b.row : a.row === 1 ? a.idx - b.idx : b.idx - a.idx
  )
}
