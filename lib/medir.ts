// Régua virtual: sem sensor de profundidade (LiDAR/ARKit/ARCore) acessível pelo navegador,
// não dá pra medir distância real só apontando a câmera — o app pede pra colocar um objeto
// de tamanho MUNDIALMENTE PADRONIZADO do lado do que quer medir, e a IA estima por
// comparação visual (regra de três entre o tamanho conhecido do objeto e o do resto da
// foto). Aproximado, não substitui fita métrica — ver disclaimer em components/ReguaVirtual.tsx.
export interface ObjetoReferencia {
  id: string
  label: string
  larguraCm: number
  alturaCm: number
}

export const OBJETOS_REFERENCIA: ObjetoReferencia[] = [
  { id: 'folha_a4', label: 'Folha de papel A4', larguraCm: 21, alturaCm: 29.7 },
  { id: 'cartao', label: 'Cartão (crédito/débito)', larguraCm: 8.56, alturaCm: 5.4 },
  { id: 'moeda_1real', label: 'Moeda de R$1', larguraCm: 2.7, alturaCm: 2.7 },
]

export function getObjetoReferencia(id: string): ObjetoReferencia | undefined {
  return OBJETOS_REFERENCIA.find(o => o.id === id)
}

export interface MedicaoResponse {
  identificado: boolean
  largura_cm: number | null
  altura_cm: number | null
  area_m2: number | null
  explicacao: string
}
