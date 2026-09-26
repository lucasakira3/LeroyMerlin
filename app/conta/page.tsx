'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  UserCircle, Lock, CreditCard, MapPin, ShieldAlert, ChevronRight, Clock, Check, Heart, ShoppingBag,
} from 'lucide-react'
import Card from '@/components/ui/Card'
import ProductListItem from '@/components/ProductListItem'
import { getEnderecos } from '@/lib/clientEnderecos'
import { getCartoes } from '@/lib/clientCartoes'
import { getFavoritosIds } from '@/lib/clientFavoritos'
import { getPedidos } from '@/lib/clientPedidos'
import { getConta } from '@/lib/clientContas'
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

// Passos do "perfil completo" — cada um é um dado que o cliente realmente já preencheu
// (lê os mesmos armazenamentos das telas de Endereços, Cartões, Favoritos e Pedidos).
interface PassoPerfil { chave: string; rotulo: string; href: string; feito: boolean; icone: typeof MapPin }

export default function ContaPage() {
  const [passos, setPassos] = useState<PassoPerfil[]>([])
  const [nomeBoasVindas, setNomeBoasVindas] = useState('')
  const [historicoIds, setHistoricoIds] = useState<string[]>([])
  const [historico, setHistorico] = useState<SearchResult[] | null>(null)

  useEffect(() => {
    const usuario = getUsuarioLogado()
    if (!usuario) return
    setNomeBoasVindas((getConta(usuario.email)?.nome ?? usuario.nome ?? usuario.email).split(' ')[0])
    setPassos([
      { chave: 'endereco', rotulo: 'Salvar um endereço', href: '/conta/enderecos', feito: getEnderecos(usuario.email).length > 0, icone: MapPin },
      { chave: 'cartao', rotulo: 'Salvar um cartão', href: '/conta/cartoes', feito: getCartoes(usuario.email).length > 0, icone: CreditCard },
      { chave: 'favorito', rotulo: 'Favoritar um produto', href: '/produtos', feito: getFavoritosIds().length > 0, icone: Heart },
      { chave: 'pedido', rotulo: 'Fazer o primeiro pedido', href: '/ofertas', feito: getPedidos(usuario.email).length > 0, icone: ShoppingBag },
    ])
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
      {passos.length > 0 && (() => {
        const feitos = passos.filter(p => p.feito).length
        const pct = Math.round((feitos / passos.length) * 100)
        return (
          <div className="rounded-card bg-lm-green text-white p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-lm-yellow">Bem-vindo de volta</p>
                <h1 className="text-2xl font-black mt-0.5">Olá, {nomeBoasVindas}!</h1>
                <p className="text-sm text-white/80 mt-1">
                  {feitos === passos.length ? 'Seu perfil está completo. Bom proveito!' : 'Complete seu perfil para agilizar suas compras.'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black leading-none">{pct}%</p>
                <p className="text-[11px] text-white/70">{feitos} de {passos.length} passos</p>
              </div>
            </div>
            <div className="h-2 rounded-full bg-white/20 overflow-hidden mt-4">
              <div className="h-full rounded-full bg-lm-yellow transition-all duration-700" style={{ width: `${pct}%` }} />
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
              {passos.map(({ chave, rotulo, href, feito, icone: Icone }) => (
                <li key={chave}>
                  <Link
                    href={href}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                      feito ? 'bg-white/10 text-white/70' : 'bg-white/15 hover:bg-white/25'
                    }`}
                  >
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${feito ? 'bg-lm-yellow text-lm-dark' : 'bg-white/20'}`}>
                      {feito ? <Check size={14} strokeWidth={3} /> : <Icone size={13} />}
                    </span>
                    <span className={feito ? 'line-through decoration-white/40' : ''}>{rotulo}</span>
                    {!feito && <ChevronRight size={14} className="ml-auto flex-shrink-0" />}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )
      })()}

      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-5">Configurações da conta</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {CARDS.map(({ href, titulo, descricao, icone: Icone }) => (
            <Link key={href} href={href}>
              <Card hoverable padding="md" className="h-full flex items-start gap-4 cursor-pointer">
                <Icone size={26} className="text-lm-green flex-shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-base font-semibold text-gray-900">{titulo}</p>
                  <p className="text-sm text-gray-500 mt-1">{descricao}</p>
                </div>
                <ChevronRight size={18} className="text-gray-300 flex-shrink-0 mt-1" />
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
