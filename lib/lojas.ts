// Lojas disponíveis nos seletores. A planta é a mesma em todas (50 corredores) e o catálogo
// é único, então escolher a loja muda o rótulo do mapa, não o estoque — igual à busca do cliente.
export const LOJAS = [
  'Interlagos — São Paulo/SP',
  'Osasco — Osasco/SP',
  'Aricanduva — São Paulo/SP',
  'Santo André — Santo André/SP',
  'Guarulhos — Guarulhos/SP',
  'Campinas — Campinas/SP',
  'Alphaville — Barueri/SP',
  'São Bernardo do Campo — SBC/SP',
  'Sorocaba — Sorocaba/SP',
  'Belo Horizonte Norte — BH/MG',
  'Barra da Tijuca — Rio de Janeiro/RJ',
  'Curitiba — Curitiba/PR',
  'Porto Alegre — Porto Alegre/RS',
  'Brasília — DF',
  'Goiânia — Goiânia/GO',
]

// Loja em que o funcionário está trabalhando — lembrada entre visitas pra não escolher toda vez.
const CHAVE_LOJA_FUNCIONARIO = 'lm_loja_funcionario'

export function getLojaFuncionario(): string {
  if (typeof window === 'undefined') return LOJAS[0]
  const salva = window.localStorage.getItem(CHAVE_LOJA_FUNCIONARIO)
  return salva && LOJAS.includes(salva) ? salva : LOJAS[0]
}

export function salvarLojaFuncionario(loja: string): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(CHAVE_LOJA_FUNCIONARIO, loja)
}
