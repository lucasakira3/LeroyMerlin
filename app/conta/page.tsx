'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Package } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import ProductCard from '@/components/ProductCard'
import ProductCardSkeleton from '@/components/ProductCardSkeleton'
import Pagination from '@/components/ui/Pagination'
import EntrevistaGuiada from '@/components/EntrevistaGuiada'
import { getFavoritosIds } from '@/lib/clientFavoritos'
import { getHistoricoIds } from '@/lib/clientHistorico'
import { getUsuarioLogado, logoutUsuario, type UsuarioLogado } from '@/lib/clientAuth'
import { getPedidos, type Pedido } from '@/lib/clientPedidos'
import { buscarProdutosPorIds } from '@/lib/produtosCliente'
import type { SearchResult } from '@/types/produto'

const PRODUTOS_POR_PAGINA = 8
const PEDIDOS_POR_PAGINA = 5

async function buscarProdutos(ids: string[]): Promise<SearchResult[]> {
  const produtos = await buscarProdutosPorIds(ids)
  return produtos.map((produto) => ({ produto, score: 1 }))
}

function SecaoProdutos({
  titulo,
  ids,
  mensagemVazia,
}: {
  titulo: string
  ids: string[]
  mensagemVazia: string
}) {
  const [produtos, setProdutos] = useState<SearchResult[] | null>(null)
  const [pagina, setPagina] = useState(1)

  useEffect(() => {
    let cancelado = false
    if (ids.length === 0) {
      setProdutos([])
      return
    }
    buscarProdutos(ids).then((resultado) => {
      if (!cancelado) setProdutos(resultado)
    })
    return () => {
      cancelado = true
    }
  }, [ids])

  useEffect(() => {
    setPagina(1)
  }, [ids])

  const totalPaginas = produtos ? Math.max(1, Math.ceil(produtos.length / PRODUTOS_POR_PAGINA)) : 1
  const produtosPaginados = produtos
    ? produtos.slice((pagina - 1) * PRODUTOS_POR_PAGINA, pagina * PRODUTOS_POR_PAGINA)
    : []

  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{titulo}</h2>
      {produtos === null && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[0, 1, 2].map((i) => <ProductCardSkeleton key={i} />)}
        </div>
      )}
      {produtos !== null && produtos.length === 0 && (
        <p className="text-sm text-gray-500 py-6">{mensagemVazia}</p>
      )}
      {produtos !== null && produtos.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {produtosPaginados.map(({ produto }, i) => (
              <ProductCard
                key={produto.id}
                produto={produto}
                href={`/produto/${produto.id}`}
                className="animate-fade-in-up"
                style={{ '--stagger-delay': `${Math.min(i, 15) * 30}ms` } as React.CSSProperties}
              />
            ))}
          </div>
          <Pagination page={pagina} totalPages={totalPaginas} onChange={setPagina} className="mt-4" />
        </>
      )}
    </section>
  )
}

function SecaoPedidos({ pedidos }: { pedidos: Pedido[] }) {
  const [pagina, setPagina] = useState(1)
  const totalPaginas = Math.max(1, Math.ceil(pedidos.length / PEDIDOS_POR_PAGINA))
  const pedidosPaginados = pedidos.slice((pagina - 1) * PEDIDOS_POR_PAGINA, pagina * PEDIDOS_POR_PAGINA)

  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Meus pedidos</h2>
      {pedidos.length === 0 && (
        <p className="text-sm text-gray-500 py-6">Você ainda não fez nenhum pedido.</p>
      )}
      {pedidos.length > 0 && (
        <div className="space-y-3">
          {pedidosPaginados.map(pedido => (
            <div key={pedido.numero} className="bg-white rounded-card shadow-soft border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Package size={15} className="text-lm-green" />
                  <span className="font-mono text-sm font-semibold text-gray-900">{pedido.numero}</span>
                </div>
                <span className="text-xs text-gray-400">{new Date(pedido.data).toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="space-y-1 mb-2">
                {pedido.itens.map(item => (
                  <p key={item.produtoId} className="text-sm text-gray-600">
                    {item.quantidade}× {item.nome}
                  </p>
                ))}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-500">
                  {pedido.metodo === 'retirada' ? `Retirada: ${pedido.loja}` : `Entrega: ${pedido.endereco}`}
                </span>
                <span className="text-sm font-bold text-gray-900">
                  {pedido.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination page={pagina} totalPages={totalPaginas} onChange={setPagina} className="mt-4" />
    </section>
  )
}

export default function ContaPage() {
  const router = useRouter()
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null)
  const [favoritosIds, setFavoritosIds] = useState<string[]>([])
  const [historicoIds, setHistoricoIds] = useState<string[]>([])
  const [pedidos, setPedidos] = useState<Pedido[]>([])

  useEffect(() => {
    const usuarioLogado = getUsuarioLogado()
    if (!usuarioLogado) {
      router.push('/funcionario/login')
      return
    }
    setUsuario(usuarioLogado)
    setFavoritosIds(getFavoritosIds())
    setHistoricoIds(getHistoricoIds())
    setPedidos(getPedidos(usuarioLogado.email))
  }, [router])

  const handleSair = () => {
    logoutUsuario()
    window.location.href = '/'
  }

  if (!usuario) {
    return null
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        <PageHeader
          title="Minha Conta"
          description={`Olá, ${usuario.nome ?? usuario.email}`}
          action={
            <Button variant="ghost" size="sm" onClick={handleSair}>
              <LogOut size={16} />
              Sair
            </Button>
          }
        />
        <EntrevistaGuiada email={usuario.email} />
        <SecaoPedidos pedidos={pedidos} />
        <SecaoProdutos
          titulo="Favoritos"
          ids={favoritosIds}
          mensagemVazia="Você ainda não favoritou nenhum produto."
        />
        <SecaoProdutos
          titulo="Vistos recentemente"
          ids={historicoIds}
          mensagemVazia="Nenhum produto visitado ainda — suas buscas vão aparecer aqui."
        />
      </div>
    </main>
  )
}
