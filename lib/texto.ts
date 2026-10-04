// Tira acentos e caixa pra comparar texto digitado com texto do catálogo: "nivel" acha
// "Nível", "LM-0007" acha "lm-0007". Usado nas buscas do painel do funcionário.
export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}
