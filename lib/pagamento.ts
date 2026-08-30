// Cartão inteiramente fictício — projeto não tem gateway de pagamento real, não valida
// nem processa nada de verdade (nem checagem de Luhn). Só formata como um formulário real
// pra ficar coerente com o padrão de checkout de loja grande. Deliberadamente NUNCA guarda
// o número completo em lugar nenhum (nem localStorage) — só os 4 últimos dígitos vão pro
// Pedido, mesma prática de um recibo de compra real.
export type Bandeira = 'Visa' | 'Mastercard' | 'Elo' | 'American Express' | 'Cartão'

export function formatarNumeroCartao(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 16)
  return digitos.replace(/(\d{4})(?=\d)/g, '$1 ')
}

export function formatarValidade(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 4)
  if (digitos.length <= 2) return digitos
  return `${digitos.slice(0, 2)}/${digitos.slice(2)}`
}

export function formatarCvv(valor: string): string {
  return valor.replace(/\D/g, '').slice(0, 4)
}

// Heurística cosmética pelo primeiro dígito (padrão real de identificação de bandeira,
// mas aqui só decide qual nome mostrar — nenhuma bandeira real é consultada).
export function detectarBandeira(numeroCartao: string): Bandeira {
  const digitos = numeroCartao.replace(/\D/g, '')
  if (/^4/.test(digitos)) return 'Visa'
  if (/^5/.test(digitos)) return 'Mastercard'
  if (/^3/.test(digitos)) return 'American Express'
  if (/^6/.test(digitos)) return 'Elo'
  return 'Cartão'
}

export function cartaoValido(numeroCartao: string, validade: string, cvv: string, nome: string): boolean {
  const digitos = numeroCartao.replace(/\D/g, '')
  const validadeValida = /^\d{2}\/\d{2}$/.test(validade)
  return digitos.length >= 13 && digitos.length <= 16 && validadeValida && cvv.length >= 3 && nome.trim().length > 2
}
