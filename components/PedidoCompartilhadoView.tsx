'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Package, MapPin } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { decodificarPedido } from '@/lib/pedidoCompartilhado'

export default function PedidoCompartilhadoView() {
  const searchParams = useSearchParams()
  const d = searchParams.get('d')
  const pedido = d ? decodificarPedido(d) : null

  if (!pedido) {
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

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <PageHeader
          title="Pedido compartilhado"
          description={`Comprovante do pedido ${pedido.numero}`}
        />

        <Card className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Package size={16} className="text-lm-green" />
              <span className="font-mono text-sm font-semibold text-gray-900">{pedido.numero}</span>
            </div>
            <span className="text-xs text-gray-400">
              {new Date(pedido.data).toLocaleDateString('pt-BR')}
            </span>
          </div>

          <div className="space-y-1.5 mb-3">
            {pedido.itens.map((item) => (
              <div key={item.produtoId} className="flex items-center justify-between gap-2 text-sm">
                <span className="text-gray-700">{item.quantidade}× {item.nome}</span>
                <span className="text-gray-500 flex-shrink-0">
                  {(item.preco * item.quantidade).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-gray-500 pt-3 border-t border-gray-100">
            <MapPin size={12} />
            {pedido.metodo === 'retirada' ? `Retirada: ${pedido.loja}` : `Entrega: ${pedido.endereco}`}
          </div>

          <div className="flex items-center justify-between pt-3 mt-1 border-t border-gray-100">
            <span className="text-sm font-bold text-gray-900">Total</span>
            <span className="text-lg font-black text-lm-green">
              {pedido.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
        </Card>

        <Link href="/"><Button variant="ghost">Ir para a Leroy Merlin</Button></Link>
      </div>
    </main>
  )
}
