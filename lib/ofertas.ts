export interface InfoOferta {
  emOferta: boolean
  percentualDesconto: number
  precoOriginal: number
  precoComDesconto: number
}

const PERCENTUAIS_DESCONTO = [10, 15, 20, 25, 30]

export function getInfoOferta(id: string, preco: number): InfoOferta {
  const hash = id.split('').reduce((soma, c) => soma + c.charCodeAt(0), 0)
  const emOferta = hash % 5 === 0 // ~20% do catálogo

  if (!emOferta) {
    return { emOferta: false, percentualDesconto: 0, precoOriginal: preco, precoComDesconto: preco }
  }

  const percentualDesconto = PERCENTUAIS_DESCONTO[Math.floor(hash / 5) % PERCENTUAIS_DESCONTO.length]
  const precoComDesconto = Math.round(preco * (1 - percentualDesconto / 100) * 100) / 100
  return { emOferta: true, percentualDesconto, precoOriginal: preco, precoComDesconto }
}
