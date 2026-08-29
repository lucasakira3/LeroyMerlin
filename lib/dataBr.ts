// components/AgendamentosLista.tsx grava `criadoEm` via `new Date().toLocaleString('pt-BR')`
// ("DD/MM/AAAA, HH:mm:ss"), não ISO — `new Date(criadoEm)` direto vira "Invalid Date"
// (confirmado testando: o parser nativo do navegador não reconhece esse formato).
// Usado no lado do funcionário pra poder ordenar/comparar esse campo cronologicamente.
export function parseDataBR(str: string): Date {
  const [dataParte, horaParte] = str.split(', ')
  const [dia, mes, ano] = dataParte.split('/').map(Number)
  const [h, m, s] = (horaParte ?? '0:0:0').split(':').map(Number)
  return new Date(ano, mes - 1, dia, h || 0, m || 0, s || 0)
}
