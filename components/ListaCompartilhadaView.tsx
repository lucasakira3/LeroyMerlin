'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ShoppingBag } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import StoreMap from '@/components/StoreMap'
import PlantaCasa from '@/components/PlantaCasa'
import ProjetoTimeline from '@/components/ProjetoTimeline'
import ProdutoDrawer from '@/components/ProdutoDrawer'
import { decodificarLista } from '@/lib/listaCompartilhada'
import { buscarProdutosPorIds } from '@/lib/produtosCliente'
import type { ItemProjeto } from '@/components/ProjetoMosaico'
import type { SearchResult } from '@/types/produto'

export default function ListaCompartilhadaView() {
  const searchParams = useSearchParams()
  const d = searchParams.get('d')

  const [carregando, setCarregando] = useState(true)
  const [itens, setItens] = useState<ItemProjeto[]>([])
  const [aba, setAba] = useState<'visao-geral' | 'lista-completa' | 'mapa'>('visao-geral')
  const [itensConcluidos, setItensConcluidos] = useState<Set<number>>(new Set())
  const [produtoDrawer, setProdutoDrawer] = useState<SearchResult['produto'] | null>(null)
  const dados = d ? decodificarLista(d) : null

  useEffect(() => {
    if (!dados) {
      setCarregando(false)
      return
    }
    buscarProdutosPorIds(dados.itens.map(i => i.produtoId)).then((produtos) => {
      const porId = new Map(produtos.map(p => [p.id, p]))
      const itensResolvidos: ItemProjeto[] = dados.itens.flatMap((item) => {
        const produto = porId.get(item.produtoId)
        if (!produto) return []
        return [{
          material: item.material,
          categoria: item.categoria,
          quantidade: item.quantidade,
          prioridade: item.prioridade,
          observacao: item.observacao,
          comodo: item.comodo,
          etapa_ordem: item.etapa_ordem,
          etapa_nome: item.etapa_nome,
          resultados: [{ produto, score: 1 }],
        }]
      })
      setItens(itensResolvidos)
      setCarregando(false)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d])

  function alternarItem(indice: number) {
    setItensConcluidos(prev => {
      const next = new Set(prev)
      next.has(indice) ? next.delete(indice) : next.add(indice)
      return next
    })
  }

  if (!dados) {
    return (
      <main className="flex-1">
        <div className="max-w-xl mx-auto px-4 py-10">
          <Card className="text-center">
            <p className="text-sm text-gray-600 mb-4">Este link parece inválido ou incompleto.</p>
            <Link href="/"><Button variant="primary">Ir para a home</Button></Link>
          </Card>
        </div>
      </main>
    )
  }

  const selecionados = new Set(itens.flatMap(i => i.resultados.map(r => r.produto.id)))
  const mapResultados: SearchResult[] = itens.flatMap(i => i.resultados)
  const totalEstimado = mapResultados.reduce((soma, r) => soma + ((r.produto as any).preco ?? 0), 0)

  return (
    <main className="flex-1">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <PageHeader title={dados.titulo} description={dados.loja} />

        <Card className="mb-5 flex items-start gap-2 bg-lm-green/5 border-lm-green/20">
          <ShoppingBag size={15} className="text-lm-green flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-600">
            {dados.resumo || 'Lista de materiais compartilhada por um cliente Leroy Merlin.'} Veja a planta, o passo a passo ou o mapa da loja, e adicione ao seu carrinho.
          </p>
        </Card>

        {carregando && <p className="text-base text-gray-600">Carregando...</p>}

        {!carregando && itens.length === 0 && (
          <Card className="text-center py-10">
            <p className="text-base text-gray-700">Os produtos desta lista não estão mais disponíveis.</p>
          </Card>
        )}

        {!carregando && itens.length > 0 && (
          <>
            <div className="flex rounded-xl bg-gray-100 p-1 mb-5">
              <button
                type="button"
                onClick={() => setAba('visao-geral')}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  aba === 'visao-geral' ? 'bg-white text-lm-green shadow-soft' : 'text-gray-700 hover:text-gray-700'
                }`}
              >
                Visão geral
              </button>
              <button
                type="button"
                onClick={() => setAba('lista-completa')}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  aba === 'lista-completa' ? 'bg-white text-lm-green shadow-soft' : 'text-gray-700 hover:text-gray-700'
                }`}
              >
                Lista completa
              </button>
              <button
                type="button"
                onClick={() => setAba('mapa')}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  aba === 'mapa' ? 'bg-white text-lm-green shadow-soft' : 'text-gray-700 hover:text-gray-700'
                }`}
              >
                Mapa
              </button>
            </div>

            {aba === 'visao-geral' && (
              <PlantaCasa
                itens={itens}
                selecionados={selecionados}
                onSelecionarProduto={setProdutoDrawer}
                onVerMais={() => setAba('lista-completa')}
              />
            )}

            {aba === 'lista-completa' && (
              <ProjetoTimeline
                itens={itens}
                selecionados={selecionados}
                itensConcluidos={itensConcluidos}
                onAlternarItem={alternarItem}
                onSelecionarProduto={setProdutoDrawer}
              />
            )}

            {aba === 'mapa' && (
              <StoreMap
                resultados={mapResultados}
                loja={dados.loja}
                totalEstimado={totalEstimado}
                onSelect={setProdutoDrawer}
              />
            )}
          </>
        )}

        <ProdutoDrawer produto={produtoDrawer} onClose={() => setProdutoDrawer(null)} />
      </div>
    </main>
  )
}
