export interface InfoOferta {
  emOferta: boolean
  percentualDesconto: number
  precoOriginal: number
  precoComDesconto: number
}

// Nenhum desconto é persistido em lugar nenhum — "está em oferta" e "quanto de desconto"
// são 100% recalculados a partir do id do produto sempre que essa função roda, então o
// mesmo produto sempre tem o mesmo status/desconto (determinístico), sem precisar tocar
// em data/produtos.json.
const PERCENTUAIS_DESCONTO = [10, 15, 20, 25, 30]

export function getInfoOferta(id: string, preco: number): InfoOferta {
  const hash = id.split('').reduce((soma, c) => soma + c.charCodeAt(0), 0)
  const emOferta = hash % 5 === 0 // ~20% do catálogo

  if (!emOferta) {
    return { emOferta: false, percentualDesconto: 0, precoOriginal: preco, precoComDesconto: preco }
  }

  // IMPORTANTE: usa Math.floor(hash / 5), não hash % 5, pra escolher a faixa de desconto.
  // Todo hash que passa no `emOferta` acima já satisfaz hash % 5 === 0 por definição — usar
  // `% 5` de novo aqui faria o índice cair sempre em 0 (todo produto em oferta ficaria preso
  // nos mesmos 10%). Já foi um bug real em produção, achado só na revisão final de branch.
  const percentualDesconto = PERCENTUAIS_DESCONTO[Math.floor(hash / 5) % PERCENTUAIS_DESCONTO.length]
  const precoComDesconto = Math.round(preco * (1 - percentualDesconto / 100) * 100) / 100
  return { emOferta: true, percentualDesconto, precoOriginal: preco, precoComDesconto }
}
