import type { SearchResult } from '@/types/produto'

export async function buscarProdutos(query: string, limit = 12): Promise<{ resultados: SearchResult[]; queryProcessada: string }> {
  const q = query.trim()
  if (!q) return { resultados: [], queryProcessada: '' }

  try {
    const res = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: q, limit }),
    })
    if (!res.ok) throw new Error('Erro na busca')
    const data = await res.json()
    return { resultados: data.resultados, queryProcessada: data.query_processada || q }
  } catch (err) {
    console.error('Erro ao buscar:', err)
    return { resultados: [], queryProcessada: q }
  }
}
