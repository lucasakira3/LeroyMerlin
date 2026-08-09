'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Package } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import ProductCard from '@/components/ProductCard'
import ProductCardSkeleton from '@/components/ProductCardSkeleton'
import { getFavoritosIds } from '@/lib/clientFavoritos'
import { getHistoricoIds } from '@/lib/clientHistorico'
import { getUsuarioLogado, logoutUsuario, type UsuarioLogado } from '@/lib/clientAuth'
import { getPedidos, type Pedido } from '@/lib/clientPedidos'
import { buscarProdutosPorIds } from '@/lib/produtosCliente'
import type { SearchResult } from '@/types/produto'

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

  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{titulo}</h2>
      {produtos === null && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => <ProductCardSkeleton key={i} />)}
        </div>
      )}
      {produtos !== null && produtos.length === 0 && (
        <p className="text-sm text-gray-500 py-6">{mensagemVazia}</p>
      )}
      {produtos !== null && produtos.length > 0 && (
        <div className="space-y-3">
          {produtos.map((resultado, i) => (
            <div key={resultado.produto.id} className="animate-fade-in-up" style={{ '--stagger-delay': `${Math.min(i, 15) * 30}ms` } as React.CSSProperties}>
              <ProductCard result={resultado} />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function SecaoPedidos({ pedidos }: { pedidos: Pedido[] }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Meus pedidos</h2>
      {pedidos.length === 0 && (
        <p className="text-sm text-gray-500 py-6">Você ainda não fez nenhum pedido.</p>
      )}
      {pedidos.length > 0 && (
        <div className="space-y-3">
          {pedidos.map(pedido => (
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
