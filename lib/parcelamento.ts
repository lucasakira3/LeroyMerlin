// Parcelamento "sem juros" simulado — o projeto não tem integração de pagamento real,
// então isto é só um cálculo determinístico a partir do preço, seguindo o mesmo princípio
// das outras derivações do app (nunca inventa um valor por produto). Regra: até 10x,
// sempre garantindo parcela mínima de R$10 (abaixo disso, produtos muito baratos como uma
// lixa de R$2,90 não exibem parcelamento).
const MIN_VALOR_PARCELA = 10
const MAX_PARCELAS = 10

export interface Parcelamento {
  parcelas: number
  valorParcela: number
}

export function getParcelamento(preco: number): Parcelamento | null {
  const parcelas = Math.min(MAX_PARCELAS, Math.floor(preco / MIN_VALOR_PARCELA))
  if (parcelas < 2) return null
  return { parcelas, valorParcela: preco / parcelas }
}

export function formatarParcelamento(preco: number): string | null {
  const parcelamento = getParcelamento(preco)
  if (!parcelamento) return null
  const valorStr = parcelamento.valorParcela.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
  return `ou ${parcelamento.parcelas}x de ${valorStr} sem juros`
}
