'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Package, RotateCcw, Share2, Store } from 'lucide-react'
import Pagination from '@/components/ui/Pagination'
import PedidoTimeline from '@/components/PedidoTimeline'
import { getUsuarioLogado } from '@/lib/clientAuth'
import { getPedidos, type Pedido } from '@/lib/clientPedidos'
import { getStatusPedido } from '@/lib/statusPedido'
import { linkPedidoCompartilhado } from '@/lib/pedidoCompartilhado'
import { adicionarAoCarrinho } from '@/lib/clientCarrinho'
import { showToast } from '@/lib/toast'

const STATUS_COR: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-700',
  amber: 'bg-amber-100 text-amber-700',
  purple: 'bg-purple-100 text-purple-700',
  green: 'bg-green-100 text-green-700',
}

const PEDIDOS_POR_PAGINA = 5

export default function PedidosPage() {
  const router = useRouter()
  const [pedidos, setPedidos] = useState<Pedido[] | null>(null)
  const [pagina, setPagina] = useState(1)
  const [linkCopiadoId, setLinkCopiadoId] = useState<string | null>(null)

  useEffect(() => {
    const usuario = getUsuarioLogado()
    if (!usuario) return
    setPedidos(getPedidos(usuario.email))
  }, [])

  const totalPaginas = Math.max(1, Math.ceil((pedidos?.length ?? 0) / PEDIDOS_POR_PAGINA))
  const pedidosPaginados = (pedidos ?? []).slice((pagina - 1) * PEDIDOS_POR_PAGINA, pagina * PEDIDOS_POR_PAGINA)

  function comprarDeNovo(pedido: Pedido) {
    for (const item of pedido.itens) {
      adicionarAoCarrinho(item.produtoId, item.quantidade)
    }
    showToast(`${pedido.itens.length} ${pedido.itens.length === 1 ? 'item adicionado' : 'itens adicionados'} ao carrinho`)
    router.push('/carrinho')
  }

  async function compartilharPedido(pedido: Pedido) {
    try {
      await navigator.clipboard.writeText(linkPedidoCompartilhado(pedido))
      setLinkCopiadoId(pedido.numero)
      setTimeout(() => setLinkCopiadoId(null), 1500)
    } catch {
      showToast('Não foi possível copiar o link. Tente novamente.')
    }
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-4">Meus pedidos</h1>

      {pedidos === null && (
        <div className="space-y-3">
          {[0, 1].map(i => <div key={i} className="h-40 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      )}

      {pedidos !== null && pedidos.length === 0 && (
        <p className="text-sm text-gray-500 py-6">Você ainda não fez nenhum pedido.</p>
      )}

      {pedidos !== null && pedidos.length > 0 && (
        <div className="space-y-3">
          {pedidosPaginados.map(pedido => {
            const status = getStatusPedido(pedido)
            return (
              <div key={pedido.numero} className="bg-white rounded-card shadow-soft border border-gray-400 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Package size={15} className="text-lm-green" />
                    <span className="font-mono text-sm font-semibold text-gray-900">{pedido.numero}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COR[status.cor]}`}>
                      {status.label}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">{new Date(pedido.data).toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="space-y-1 mb-3">
                  {pedido.itens.map(item => (
                    <p key={item.produtoId} className="text-sm text-gray-600">{item.quantidade}× {item.nome}</p>
                  ))}
                </div>
                <div className="mb-3 px-1">
                  <PedidoTimeline etapas={status.etapas} etapaAtual={status.etapa} previsoes={status.previsoes} />
                </div>
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 mb-2">
                  {pedido.metodo === 'retirada' ? (
                    <Store size={14} className="text-lm-green flex-shrink-0" />
                  ) : (
                    <MapPin size={14} className="text-lm-green flex-shrink-0" />
                  )}
                  <span className="text-xs text-gray-700 font-medium">
                    {pedido.metodo === 'retirada' ? `Retirada: ${pedido.loja}` : `Entrega: ${pedido.endereco}`}
                  </span>
                </div>
                <div className="flex items-center justify-end pt-2 border-t border-gray-400">
                  <span className="text-sm font-bold text-gray-900">
                    {pedido.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
                {pedido.pagamento && (
                  <p className="text-xs text-gray-500 pt-1.5">
                    {pedido.pagamento.metodo === 'cartao'
                      ? `${pedido.pagamento.bandeira} final ${pedido.pagamento.ultimosDigitos}${pedido.pagamento.parcelas && pedido.pagamento.parcelas > 1 ? ` · ${pedido.pagamento.parcelas}x` : ''}`
                      : pedido.pagamento.metodo === 'pix' ? 'Pix' : 'Boleto bancário'}
                  </p>
                )}
                <div className="flex items-center gap-3 pt-2 mt-2 border-t border-gray-400">
                  <button
                    type="button"
                    onClick={() => comprarDeNovo(pedido)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-lm-green hover:underline"
                  >
                    <RotateCcw size={13} /> Comprar de novo
                  </button>
                  <button
                    type="button"
                    onClick={() => compartilharPedido(pedido)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-lm-green transition-colors"
                  >
                    <Share2 size={13} />
                    {linkCopiadoId === pedido.numero ? 'Link copiado ✓' : 'Compartilhar'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Pagination page={pagina} totalPages={totalPaginas} onChange={setPagina} className="mt-4" />
    </div>
  )
}
