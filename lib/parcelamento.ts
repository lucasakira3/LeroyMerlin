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

// Todas as opções de 1x até o máximo (mesma regra de MIN_VALOR_PARCELA/MAX_PARCELAS) —
// usado no formulário de pagamento com cartão (app/carrinho/page.tsx), onde o cliente
// escolhe quantas vezes parcelar, diferente de getParcelamento (que só devolve o máximo,
// usado nos "ou Nx de..." exibidos em preços soltos pela loja).
export function getOpcoesParcelamento(preco: number): Parcelamento[] {
  const max = Math.min(MAX_PARCELAS, Math.floor(preco / MIN_VALOR_PARCELA))
  if (max < 1) return [{ parcelas: 1, valorParcela: preco }]
  return Array.from({ length: max }, (_, i) => ({ parcelas: i + 1, valorParcela: preco / (i + 1) }))
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
