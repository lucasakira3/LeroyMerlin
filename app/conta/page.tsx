'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  UserCircle, Lock, CreditCard, MapPin, ShieldAlert, ChevronRight, Clock,
} from 'lucide-react'
import Card from '@/components/ui/Card'
import ProductListItem from '@/components/ProductListItem'
import { getUsuarioLogado } from '@/lib/clientAuth'
import { getHistoricoIds } from '@/lib/clientHistorico'
import { buscarProdutosPorIds } from '@/lib/produtosCliente'
import type { SearchResult } from '@/types/produto'

const CARDS = [
  { href: '/conta/perfil', titulo: 'Informações do Perfil', descricao: 'Dados pessoais e da conta.', icone: UserCircle },
  { href: '/conta/seguranca', titulo: 'Segurança', descricao: 'Senha e proteção da sua conta.', icone: Lock },
  { href: '/conta/cartoes', titulo: 'Cartões Salvos', descricao: 'Cartões salvos pra usar no checkout.', icone: CreditCard },
  { href: '/conta/enderecos', titulo: 'Endereços Salvos', descricao: 'Endereços salvos na sua conta.', icone: MapPin },
  { href: '/conta/privacidade', titulo: 'Privacidade', descricao: 'Exportar ou apagar seus dados.', icone: ShieldAlert },
]

export default function ContaPage() {
  const [historicoIds, setHistoricoIds] = useState<string[]>([])
  const [historico, setHistorico] = useState<SearchResult[] | null>(null)

  useEffect(() => {
    const usuario = getUsuarioLogado()
    if (!usuario) return
    const ids = getHistoricoIds().slice(0, 5)
    setHistoricoIds(ids)
    if (ids.length === 0) {
      setHistorico([])
      return
    }
    buscarProdutosPorIds(ids).then(produtos => {
      setHistorico(produtos.map(produto => ({ produto, score: 1 })))
    })
  }, [])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-gray-900 mb-4">Configurações da conta</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {CARDS.map(({ href, titulo, descricao, icone: Icone }) => (
            <Link key={href} href={href}>
              <Card hoverable padding="sm" className="h-full flex items-start gap-3 cursor-pointer">
                <Icone size={20} className="text-lm-green flex-shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900">{titulo}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{descricao}</p>
                </div>
                <ChevronRight size={16} className="text-gray-300 flex-shrink-0 mt-0.5" />
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {historicoIds.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Clock size={16} className="text-gray-400" /> Vistos recentemente
          </h2>
          {historico === null ? (
            <div className="space-y-2">
              {[0, 1, 2].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <div className="space-y-2">
              {historico.map(({ produto }, i) => (
                <ProductListItem
                  key={produto.id}
                  produto={produto}
                  href={`/produto/${produto.id}`}
                  className="animate-fade-in-up"
                  style={{ '--stagger-delay': `${i * 30}ms` } as React.CSSProperties}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
