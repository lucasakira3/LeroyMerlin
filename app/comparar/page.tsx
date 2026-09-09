'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Scale } from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { getComparador, removerDoComparador, definirComparador } from '@/lib/clientComparador'
import { buscarProdutosPorIds, type ProdutoResolvido } from '@/lib/produtosCliente'
import { adicionarAoCarrinho } from '@/lib/clientCarrinho'
import ComparadorCardSkeleton from '@/components/ComparadorCardSkeleton'
import ComparadorResultado from '@/components/ComparadorResultado'

function ComparadorContent() {
  const [ids, setIds] = useState<string[]>([])
  const [produtos, setProdutos] = useState<ProdutoResolvido[] | null>(null)
  const [adicionadoId, setAdicionadoId] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const idsParam = searchParams.get('ids')

  useEffect(() => {
    let atuais = getComparador()
    if (idsParam) {
      const queryIds = idsParam.split(',').map(id => id.trim()).filter(Boolean)
      if (queryIds.length > 0) {
        definirComparador(queryIds)
        atuais = queryIds
      }
    }
    setIds(atuais)
    if (atuais.length === 0) {
      setProdutos([])
      return
    }
    buscarProdutosPorIds(atuais).then(setProdutos)
  }, [idsParam])

  function remover(produtoId: string) {
    removerDoComparador(produtoId)
    const novosIds = ids.filter(id => id !== produtoId)
    setIds(novosIds)
    setProdutos(prev => prev?.filter(p => p.id !== produtoId) ?? null)
  }

  function handleAdicionar(produtoId: string) {
    adicionarAoCarrinho(produtoId)
    setAdicionadoId(produtoId)
    setTimeout(() => setAdicionadoId(prev => prev === produtoId ? null : prev), 1500)
  }

  if (produtos === null) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="overflow-x-auto">
            <div className="flex gap-4 min-w-full">
              {[0, 1, 2].map(i => <ComparadorCardSkeleton key={i} />)}
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (produtos.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-xl mx-auto px-4 py-10">
          <Card className="text-center py-10">
            <Scale size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-4">Nenhum produto selecionado pra comparar.</p>
            <Link href="/produtos"><Button variant="primary">Ver produtos</Button></Link>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <ComparadorResultado
          produtos={produtos}
          onRemover={remover}
          onAdicionarCarrinho={handleAdicionar}
          adicionadoId={adicionadoId}
        />
      </div>
    </main>
  )
}

export default function ComparadorPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="overflow-x-auto">
            <div className="flex gap-4 min-w-full">
              {[0, 1, 2].map(i => <ComparadorCardSkeleton key={i} />)}
            </div>
          </div>
        </div>
      </main>
    }>
      <ComparadorContent />
    </Suspense>
  )
}
