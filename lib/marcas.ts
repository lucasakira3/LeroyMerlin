// Não há dado real de marca/fabricante no catálogo mock — essas marcas são só pra dar
// realismo visual ao produto (mesma decisão de projeto de getImagemCategoria/lib/ofertas.ts:
// nada aqui é persistido, é derivado deterministicamente do id do produto).
const MARCAS: Record<string, string[]> = {
  ferramenta: ['Tramontina', 'Vonder', 'Stanley', 'Bosch', 'Makita', 'Gedore'],
  elétric:    ['Tramontina', 'Pial', 'Schneider', 'Siemens', 'ABB'],
  hidráulic:  ['Tigre', 'Amanco', 'Deca', 'Docol', 'Lorenzetti'],
  pintura:    ['Suvinil', 'Coral', 'Sherwin-Williams', 'Eucatex'],
  jardim:     ['Tramontina', 'Husqvarna', 'Gardena', 'Vonder'],
  iluminaç:   ['Osram', 'Philips', 'Taschibra', 'Intelbras'],
  cerâmic:    ['Portobello', 'Eliane', 'Ceusa', 'Incepa'],
  piso:       ['Portobello', 'Eliane', 'Incepa', 'Roca'],
  banheiro:   ['Deca', 'Docol', 'Roca', 'Celite'],
  madeira:    ['Eucatex', 'Tábua Brasil', 'Madex'],
  construç:   ['Votorantim', 'Holcim', 'Votoran', 'Lafarge'],
}

// Hash simples do id (soma dos char codes) escolhe sempre a mesma marca pro mesmo produto,
// então a marca não "pisca" trocando a cada re-render — determinístico, não aleatório.
export function getMarca(categoria: string, id: string): string {
  const lower = categoria.toLowerCase()
  const key = Object.keys(MARCAS).find(k => lower.includes(k))
  const lista = key ? MARCAS[key] : ['Leroy Merlin', 'Vonder', 'Tramontina']
  const hash = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return lista[hash % lista.length]
}

// Chuta a unidade de venda (L, kg, m², etc.) a partir de palavras-chave no nome do
// produto — não é um campo real do catálogo, só estética do card/drawer.
export function getUnidade(nomeProduto: string): string {
  const n = nomeProduto.toLowerCase()
  if (/m²|m2/.test(n))       return 'm²'
  if (/\bkg\b/.test(n))       return 'kg'
  if (/\bl\b|litro/.test(n))  return 'L'
  if (/rolo/.test(n))          return 'rolo'
  if (/caixa|cx\./.test(n))   return 'cx'
  if (/saco/.test(n))          return 'saco'
  if (/metro|ml/.test(n))      return 'm'
  return 'un'
}
