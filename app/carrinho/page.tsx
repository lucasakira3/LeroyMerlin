'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Minus, Plus, Trash2, ShoppingCart, MapPin, CheckCircle2 } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { getCarrinho, atualizarQuantidade, removerDoCarrinho, limparCarrinho, type CartItem } from '@/lib/clientCarrinho'
import { salvarPedido, gerarNumeroPedido, type Pedido, type ItemPedido } from '@/lib/clientPedidos'
import { getUsuarioLogado } from '@/lib/clientAuth'
import { buscarProdutosPorIds, type ProdutoResolvido } from '@/lib/produtosCliente'
import { clearProductHistory } from '@/lib/hooks/useProductTracker'
import { getImagemCategoria } from '@/lib/categoriaImagens'

const LOJAS = [
  'Interlagos — São Paulo/SP',
  'Osasco — Osasco/SP',
  'Aricanduva — São Paulo/SP',
  'Santo André — Santo André/SP',
  'Guarulhos — Guarulhos/SP',
  'Campinas — Campinas/SP',
  'Alphaville — Barueri/SP',
  'São Bernardo do Campo — SBC/SP',
  'Sorocaba — Sorocaba/SP',
  'Belo Horizonte Norte — BH/MG',
  'Barra da Tijuca — Rio de Janeiro/RJ',
  'Curitiba — Curitiba/PR',
  'Porto Alegre — Porto Alegre/RS',
  'Brasília — DF',
  'Goiânia — Goiânia/GO',
]

async function buscarProdutos(ids: string[]): Promise<Record<string, ProdutoResolvido>> {
  const produtos = await buscarProdutosPorIds(ids)
  const mapa: Record<string, ProdutoResolvido> = {}
  for (const p of produtos) mapa[p.id] = p
  return mapa
}

export default function CarrinhoPage() {
  const [itens, setItens] = useState<CartItem[]>([])
  const [produtos, setProdutos] = useState<Record<string, ProdutoResolvido> | null>(null)
  const [usuario, setUsuario] = useState<{ email: string } | null>(null)
  const [metodo, setMetodo] = useState<'retirada' | 'entrega'>('retirada')
  const [loja, setLoja] = useState(LOJAS[0])
  const [endereco, setEndereco] = useState('')
  const [pedidoConfirmado, setPedidoConfirmado] = useState<Pedido | null>(null)

  useEffect(() => {
    setUsuario(getUsuarioLogado())
    const carrinho = getCarrinho()
    setItens(carrinho)
    if (carrinho.length === 0) {
      setProdutos({})
      return
    }
    buscarProdutos(carrinho.map(i => i.produtoId)).then(setProdutos)
  }, [])

  function recarregarCarrinho() {
    setItens(getCarrinho())
  }

  function mudarQuantidade(produtoId: string, delta: number) {
    const item = itens.find(i => i.produtoId === produtoId)
    const produto = produtos?.[produtoId]
    if (!item || !produto) return
    const nova = Math.min(item.quantidade + delta, produto.estoque)
    atualizarQuantidade(produtoId, Math.max(0, nova))
    recarregarCarrinho()
  }

  function remover(produtoId: string) {
    removerDoCarrinho(produtoId)
    recarregarCarrinho()
  }

  const itensResolvidos = produtos
    ? itens
        .map(item => ({ item, produto: produtos[item.produtoId] }))
        .filter((x): x is { item: CartItem; produto: ProdutoResolvido } => x.produto !== undefined)
    : []

  const total = itensResolvidos.reduce((soma, { item, produto }) => soma + (produto.preco ?? 0) * item.quantidade, 0)

  function confirmarPedido() {
    if (!usuario) return
    if (metodo === 'retirada' && !loja) return
    if (metodo === 'entrega' && !endereco.trim()) return

    const itensPedido: ItemPedido[] = itensResolvidos.map(({ item, produto }) => ({
      produtoId: produto.id,
      nome: produto.produto,
      preco: produto.preco,
      quantidade: item.quantidade,
    }))

    const pedido: Pedido = {
      numero: gerarNumeroPedido(),
      data: new Date().toISOString(),
      itens: itensPedido,
      metodo,
      loja: metodo === 'retirada' ? loja : undefined,
      endereco: metodo === 'entrega' ? endereco.trim() : undefined,
      total,
    }

    salvarPedido(usuario.email, pedido)
    limparCarrinho()
    clearProductHistory()
    setPedidoConfirmado(pedido)
  }

  if (pedidoConfirmado) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-xl mx-auto px-4 py-10">
          <Card className="text-center">
            <CheckCircle2 size={40} className="text-lm-green mx-auto mb-3" />
            <h1 className="text-xl font-bold text-gray-900 mb-1">Pedido confirmado!</h1>
            <p className="text-sm text-gray-500 mb-4">Número do pedido: <span className="font-mono font-semibold text-gray-700">{pedidoConfirmado.numero}</span></p>

            <div className="text-left bg-gray-50 rounded-xl p-4 mb-4 space-y-1.5">
              {pedidoConfirmado.itens.map(i => (
                <div key={i.produtoId} className="flex justify-between text-sm">
                  <span className="text-gray-600">{i.quantidade}× {i.nome}</span>
                  <span className="font-medium text-gray-900">
                    {(i.preco * i.quantidade).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              ))}
              <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-bold text-sm">
                <span>Total</span>
                <span>{pedidoConfirmado.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
            </div>

            <p className="text-xs text-gray-500 mb-6">
              {pedidoConfirmado.metodo === 'retirada'
                ? `Retirada em: ${pedidoConfirmado.loja}`
                : `Entrega em: ${pedidoConfirmado.endereco}`}
            </p>

            <div className="flex gap-3 justify-center">
              <Link href="/conta"><Button variant="secondary">Ver meus pedidos</Button></Link>
              <Link href="/"><Button variant="primary">Continuar comprando</Button></Link>
            </div>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <PageHeader title="Carrinho" description={itens.length > 0 ? `${itens.length} ${itens.length === 1 ? 'item' : 'itens'}` : undefined} />

        {produtos === null && <p className="text-sm text-gray-400">Carregando...</p>}

        {produtos !== null && itensResolvidos.length === 0 && (
          <Card className="text-center py-10">
            <ShoppingCart size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-4">Seu carrinho está vazio.</p>
            <Link href="/"><Button variant="primary">Ver produtos</Button></Link>
          </Card>
        )}

        {itensResolvidos.length > 0 && (
          <>
            <div className="space-y-3 mb-6">
              {itensResolvidos.map(({ item, produto }) => (
                <Card key={produto.id} padding="sm" className="flex items-center gap-3">
                  <img
                    src={getImagemCategoria(produto.categoria)}
                    alt={produto.categoria}
                    className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{produto.produto}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1 text-xs text-lm-green font-bold">
                        <MapPin size={10} /> {produto.corredor}
                      </span>
                      <span className="text-xs text-gray-400">{produto.estoque} disp.</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => mudarQuantidade(produto.id, -1)}
                      className="w-6 h-6 rounded-md border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50"
                      aria-label="Diminuir quantidade"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="text-sm font-medium w-5 text-center">{item.quantidade}</span>
                    <button
                      onClick={() => mudarQuantidade(produto.id, 1)}
                      disabled={item.quantidade >= produto.estoque}
                      className="w-6 h-6 rounded-md border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label="Aumentar quantidade"
                    >
                      <Plus size={12} />
                    </button>
                  </div>

                  <span className="text-sm font-bold text-gray-900 w-20 text-right flex-shrink-0">
                    {(produto.preco * item.quantidade).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>

                  <button
                    onClick={() => remover(produto.id)}
                    className="text-gray-300 hover:text-red-500 flex-shrink-0"
                    aria-label="Remover do carrinho"
                  >
                    <Trash2 size={16} />
                  </button>
                </Card>
              ))}
            </div>

            <Card className="mb-6">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-gray-900">Total</span>
                <span className="text-xl font-black text-lm-green">
                  {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            </Card>

            {!usuario && (
              <Card className="text-center">
                <p className="text-sm text-gray-600 mb-3">Faça login para finalizar o pedido.</p>
                <Link href="/funcionario/login"><Button variant="primary">Fazer login</Button></Link>
              </Card>
            )}

            {usuario && (
              <Card>
                <h3 className="text-sm font-bold text-gray-900 mb-3">Finalizar pedido</h3>

                <div className="flex rounded-xl bg-gray-100 p-1 mb-4">
                  <button
                    type="button"
                    onClick={() => setMetodo('retirada')}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      metodo === 'retirada' ? 'bg-white text-lm-green shadow-soft' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Retirar na loja
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetodo('entrega')}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      metodo === 'entrega' ? 'bg-white text-lm-green shadow-soft' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Entrega em casa
                  </button>
                </div>

                {metodo === 'retirada' ? (
                  <select
                    value={loja}
                    onChange={e => setLoja(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-lm-green/30 bg-white mb-4"
                  >
                    {LOJAS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                ) : (
                  <textarea
                    value={endereco}
                    onChange={e => setEndereco(e.target.value)}
                    placeholder="Endereço completo (rua, número, bairro, cidade)"
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-lm-green/30 resize-none bg-white mb-4"
                  />
                )}

                <Button
                  variant="primary"
                  className="w-full"
                  onClick={confirmarPedido}
                  disabled={metodo === 'entrega' && !endereco.trim()}
                >
                  Confirmar pedido
                </Button>
              </Card>
            )}
          </>
        )}
      </div>
    </main>
  )
}
