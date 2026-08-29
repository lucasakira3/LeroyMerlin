import { NextResponse } from 'next/server'
import { carregarProdutos } from '@/lib/produtos'

// Rota separada de /api/categoria/[slug] de propósito: aquela corta em 300 resultados
// (pensada pra navegação por categoria do cliente), mas a tela de estoque do funcionário
// precisa enxergar o catálogo inteiro (1000 produtos) pra fazer busca/ordenação/paginação
// de verdade. Sem embeddings (payload maior, não usado nessa tela).
export async function GET() {
  const produtos = await carregarProdutos()
  const resultado = produtos.map(({ embedding: _e, embedding_text: _et, ...rest }) => rest)
  return NextResponse.json(resultado)
}
