'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ShoppingBag } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import StoreMap from '@/components/StoreMap'
import { decodificarLista } from '@/lib/listaCompartilhada'
import { buscarProdutosPorIds } from '@/lib/produtosCliente'
import type { SearchResult } from '@/types/produto'

export default function ListaCompartilhadaView() {
  const searchParams = useSearchParams()
  const d = searchParams.get('d')

  const [carregando, setCarregando] = useState(true)
  const [resultados, setResultados] = useState<SearchResult[]>([])
  const dados = d ? decodificarLista(d) : null

  useEffect(() => {
    if (!dados) {
      setCarregando(false)
      return
    }
    buscarProdutosPorIds(dados.produtoIds).then((produtos) => {
      setResultados(produtos.map((produto) => ({ produto, score: 1 })))
      setCarregando(false)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d])

  if (!dados) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-xl mx-auto px-4 py-10">
          <Card className="text-center">
            <p className="text-sm text-gray-600 mb-4">Este link parece inválido ou incompleto.</p>
            <Link href="/"><Button variant="primary">Ir para a home</Button></Link>
          </Card>
        </div>
      </main>
    )
  }

  const totalEstimado = resultados.reduce((soma, r) => soma + r.produto.preco, 0)

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <PageHeader title={dados.titulo} description={dados.loja} />

        <Card className="mb-5 flex items-start gap-2 bg-lm-green/5 border-lm-green/20">
          <ShoppingBag size={15} className="text-lm-green flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-600">
            Lista de materiais compartilhada por um cliente Leroy Merlin — clique num produto no mapa para localizá-lo ou adicione ao seu carrinho.
          </p>
        </Card>

        {carregando && <p className="text-sm text-gray-400">Carregando...</p>}

        {!carregando && resultados.length === 0 && (
          <Card className="text-center py-10">
            <p className="text-sm text-gray-500">Os produtos desta lista não estão mais disponíveis.</p>
          </Card>
        )}

        {!carregando && resultados.length > 0 && (
          <StoreMap resultados={resultados} loja={dados.loja} totalEstimado={totalEstimado} />
        )}
      </div>
    </main>
  )
}
