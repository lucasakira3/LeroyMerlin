'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Scale, Trash2, ShoppingCart, MapPin } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import StarRating from '@/components/ui/StarRating'
import StockIndicator from '@/components/StockIndicator'
import SustainabilityBadge from '@/components/SustainabilityBadge'
import { getComparador, removerDoComparador, definirComparador } from '@/lib/clientComparador'
import { buscarProdutosPorIds, type ProdutoResolvido } from '@/lib/produtosCliente'
import { adicionarAoCarrinho } from '@/lib/clientCarrinho'
import { getMedia } from '@/lib/clientAvaliacoes'
import { getImagemCategoria } from '@/lib/categoriaImagens'
import ComparadorCardSkeleton from '@/components/ComparadorCardSkeleton'

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
          <PageHeader title="Comparar produtos" />
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

  const menorPreco = Math.min(...produtos.map(p => p.preco))
  const maiorEstoque = Math.max(...produtos.map(p => p.estoque))
  const RANK_SUSTENTABILIDADE: Record<string, number> = { 'Ouro': 3, 'Prata': 2, 'Bronze': 1, 'N/A': 0 }
  const maiorRankSustentabilidade = Math.max(...produtos.map(p => RANK_SUSTENTABILIDADE[p.sustentabilidade] ?? 0))
  const maiorMedia = Math.max(
    0,
    ...produtos.map(p => (getMedia(p.id).total > 0 ? getMedia(p.id).media : 0))
  )
  const destaque = produtos.length > 1
    ? 'ring-2 ring-lm-green bg-lm-green/5 -mx-2 px-2 py-1.5 rounded-lg'
    : ''

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <PageHeader title="Comparar produtos" description={`${produtos.length} de 3 produtos`} />

        <div className="overflow-x-auto">
          <div className="flex gap-4 min-w-full" style={{ minWidth: `${produtos.length * 220}px` }}>
            {produtos.map(produto => {
              const { media, total } = getMedia(produto.id)
              return (
                <Card key={produto.id} className="flex-1 min-w-[220px] relative">
                  <button
                    onClick={() => remover(produto.id)}
                    className="absolute top-3 right-3 text-gray-300 hover:text-red-500"
                    aria-label="Remover da comparação"
                  >
                    <Trash2 size={15} />
                  </button>

                  <img
                    src={getImagemCategoria(produto.categoria, produto.id)}
                    alt={produto.categoria}
                    className="w-full h-28 object-cover rounded-lg mb-3"
                  />

                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">{produto.categoria}</p>
                  <h3 className="text-sm font-bold text-gray-900 leading-snug mb-3 pr-6">{produto.produto}</h3>

                  <div className="flex items-center gap-1.5 text-lm-green mb-3">
                    <MapPin size={12} strokeWidth={2.5} />
                    <span className="text-xs font-bold">{produto.corredor}</span>
                  </div>

                  {(() => {
                    const venceuPreco = produto.preco === menorPreco && produtos.length > 1
                    const venceuEstoque = produto.estoque === maiorEstoque && maiorEstoque > 0 && produtos.length > 1
                    const venceuSustentabilidade =
                      (RANK_SUSTENTABILIDADE[produto.sustentabilidade] ?? 0) === maiorRankSustentabilidade &&
                      maiorRankSustentabilidade > 0 && produtos.length > 1
                    const venceuAvaliacao = total > 0 && media === maiorMedia && produtos.length > 1

                    return (
                      <>
                        <div className={`mb-3 ${venceuPreco ? destaque : ''}`}>
                          <p className="text-xl font-black text-lm-green">
                            {produto.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </p>
                          {venceuPreco && (
                            <span className="inline-block mt-1 text-[10px] font-semibold text-lm-green bg-lm-green/10 px-2 py-0.5 rounded-full">
                              Melhor preço
                            </span>
                          )}
                        </div>

                        <div className={`flex flex-wrap gap-1.5 mb-3 ${(venceuEstoque || venceuSustentabilidade) ? destaque : ''}`}>
                          <StockIndicator estoque={produto.estoque} />
                          <SustainabilityBadge sustentabilidade={produto.sustentabilidade} />
                        </div>

                        <div className="mb-3">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Complexidade</p>
                          <p className="text-xs text-gray-700">{produto.complexidade}</p>
                        </div>

                        <div className={`mb-3 ${venceuAvaliacao ? destaque : ''}`}>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Avaliação</p>
                          {total > 0 ? (
                            <div className="flex items-center gap-1.5">
                              <StarRating value={media} size={13} />
                              <span className="text-xs text-gray-500">{media.toFixed(1)} ({total})</span>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400 italic">Sem avaliações</p>
                          )}
                        </div>
                      </>
                    )
                  })()}

                  {produto.especificacoes && (
                    <div className="mb-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Especificações</p>
                      <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{produto.especificacoes}</p>
                    </div>
                  )}

                  {produto.tags && produto.tags.length > 0 && (
                    <div className="mb-4">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Tags</p>
                      <div className="flex flex-wrap gap-1">
                        {produto.tags.map(tag => (
                          <span key={tag} className="px-2 py-0.5 bg-gray-100 rounded-full text-[10px] text-gray-600">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => handleAdicionar(produto.id)}
                    disabled={produto.estoque === 0}
                    className="w-full flex items-center justify-center gap-1.5 bg-lm-green text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ShoppingCart size={13} />
                    {adicionadoId === produto.id ? 'Adicionado ✓' : 'Adicionar ao carrinho'}
                  </button>
                </Card>
              )
            })}
          </div>
        </div>
      </div>
    </main>
  )
}

export default function ComparadorPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <PageHeader title="Comparar produtos" />
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
