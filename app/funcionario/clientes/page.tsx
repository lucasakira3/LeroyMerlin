'use client'

import { Fragment, useEffect, useMemo, useState } from 'react'
import { Search, ChevronDown, ChevronUp, Store, Truck } from 'lucide-react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import { getStatusPedido, STATUS_PEDIDO_COR } from '@/lib/statusPedido'
import type { Pedido } from '@/lib/clientPedidos'
import { getClientesConhecidos } from '@/lib/clientesConhecidos'
import { useAoSincronizar } from '@/lib/hooks/useAoSincronizar'

interface ClienteResumo {
  email: string
  nome: string
  criadoEm: string
  pedidos: Pedido[]
  totalGasto: number
  status: 'Novo' | 'Ativo' | 'VIP'
}

type SortKey = 'nome' | 'pedidos' | 'totalGasto'
type SortDir = 'asc' | 'desc'

const STATUS_TONE = { Novo: 'gray', Ativo: 'green', VIP: 'yellow' } as const

function SortIcon({ ativo, dir }: { ativo: boolean; dir: SortDir }) {
  return ativo ? (dir === 'asc' ? <ChevronUp size={13} className="text-lm-green" /> : <ChevronDown size={13} className="text-lm-green" />) : null
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<ClienteResumo[]>([]);
  const [busca, setBusca] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('nome')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [expandidoEmail, setExpandidoEmail] = useState<string | null>(null)

  function carregar() {
    // Dado real, não inventado: agrega os clientes conhecidos (cadastrados neste navegador
    // ou vindos do banco, ver lib/clientesConhecidos.ts) com os pedidos (lib/clientPedidos.ts).
    const contas = getClientesConhecidos()
    const pedidosPorEmail: Record<string, Pedido[]> = JSON.parse(localStorage.getItem('lm_pedidos_cliente') ?? '{}')

    const resumo: ClienteResumo[] = Object.entries(contas).map(([email, conta]) => {
      const pedidos = [...(pedidosPorEmail[email] ?? [])].sort((a, b) => b.data.localeCompare(a.data))
      const totalGasto = pedidos.reduce((soma, p) => soma + p.total, 0)
      const status: ClienteResumo['status'] = pedidos.length === 0 ? 'Novo' : totalGasto >= 500 ? 'VIP' : 'Ativo'
      return { email, nome: conta.nome, criadoEm: conta.criadoEm, pedidos, totalGasto, status }
    })

    setClientes(resumo)
  }
  useEffect(carregar, [])
  // Cliente novo ou pedido novo feito em outro aparelho.
  useAoSincronizar(carregar)

  const filtrados = clientes.filter(c =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) || c.email.toLowerCase().includes(busca.toLowerCase())
  )

  const ordenados = useMemo(() => {
    const sinal = sortDir === 'asc' ? 1 : -1
    return [...filtrados].sort((a, b) => {
      if (sortKey === 'nome') return a.nome.localeCompare(b.nome, 'pt-BR') * sinal
      if (sortKey === 'pedidos') return (a.pedidos.length - b.pedidos.length) * sinal
      return (a.totalGasto - b.totalGasto) * sinal
    })
  }, [filtrados, sortKey, sortDir])

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(dir => (dir === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      <Card padding="none">
        <div className="p-4 border-b border-gray-200 dark:border-gray-500 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
            <input
              type="text"
              placeholder="Buscar por nome ou e-mail..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 dark:border-gray-500 rounded-xl text-sm outline-none focus:border-lm-green focus:ring-1 focus:ring-lm-green transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              {/* `uppercase` repetido nos botões: o Tailwind zera o text-transform de <button>,
                  então o da linha não chega neles e o cabeçalho ficava metade em maiúsculas. */}
              <tr className="bg-gray-50 text-gray-700 text-xs sm:text-sm uppercase tracking-wider">
                <th className="px-3 py-4 sm:p-4 font-bold max-md:w-full">
                  <button onClick={() => handleSort('nome')} className="flex items-center gap-1.5 uppercase hover:text-lm-green transition-colors">
                    Nome <SortIcon ativo={sortKey === 'nome'} dir={sortDir} />
                  </button>
                </th>
                <th className="p-4 font-bold hidden md:table-cell">Contato</th>
                <th className="px-3 py-4 sm:p-4 font-bold text-center">
                  <button onClick={() => handleSort('pedidos')} className="flex items-center gap-1.5 mx-auto uppercase hover:text-lm-green transition-colors">
                    Pedidos <SortIcon ativo={sortKey === 'pedidos'} dir={sortDir} />
                  </button>
                </th>
                <th className="px-3 py-4 sm:p-4 font-bold text-right">
                  <button onClick={() => handleSort('totalGasto')} className="flex items-center gap-1.5 ml-auto uppercase text-right hover:text-lm-green transition-colors">
                    Total gasto <SortIcon ativo={sortKey === 'totalGasto'} dir={sortDir} />
                  </button>
                </th>
                <th className="p-4 font-bold text-center hidden sm:table-cell">Status</th>
              </tr>
            </thead>
            {/* Linha divisória entre as linhas (divide-y), não embaixo de cada uma: assim a
                última não soma a própria borda com a do cartão. */}
            <tbody className="divide-y divide-gray-200 dark:divide-gray-500">
              {ordenados.map(cliente => (
                <Fragment key={cliente.email}>
                  <tr
                    onClick={() => setExpandidoEmail(e => (e === cliente.email ? null : cliente.email))}
                    aria-expanded={expandidoEmail === cliente.email}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="px-3 py-4 sm:p-4">
                      {/* Em tela estreita as colunas Contato e Status somem e o conteúdo delas
                          vem pra cá, pra tabela caber sem rolagem lateral. */}
                      <p className="font-bold text-lm-dark flex flex-wrap items-center gap-x-2 gap-y-1">
                        {cliente.nome}
                        <Badge tone={STATUS_TONE[cliente.status]} className="sm:hidden">{cliente.status}</Badge>
                      </p>
                      <p className="text-sm text-gray-700 mt-0.5 break-all md:hidden">{cliente.email}</p>
                      <p className="text-sm text-gray-700 mt-0.5">
                        Cadastrado em {new Date(cliente.criadoEm).toLocaleDateString('pt-BR')}
                      </p>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <p className="text-sm text-gray-700 break-all">{cliente.email}</p>
                    </td>
                    <td className="px-3 py-4 sm:p-4 text-center">
                      <Badge tone="gray">{cliente.pedidos.length}</Badge>
                    </td>
                    <td className="px-3 py-4 sm:p-4 text-right font-medium text-sm text-gray-700">
                      {cliente.totalGasto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="p-4 text-center hidden sm:table-cell">
                      <Badge tone={STATUS_TONE[cliente.status]}>{cliente.status}</Badge>
                    </td>
                  </tr>
                  {expandidoEmail === cliente.email && (
                    <tr key={`${cliente.email}-detalhe`}>
                      <td colSpan={5} className="p-3 sm:p-4 bg-gray-50">
                        <p className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">
                          Pedidos de {cliente.nome}
                        </p>
                        {cliente.pedidos.length === 0 ? (
                          <p className="text-base text-gray-700">Nenhum pedido ainda.</p>
                        ) : (
                          // Mesma linha de pedido da tela Pedidos (ícone, número + status, resumo,
                          // total). `flex-wrap` + `min-w-0` fazem o conteúdo quebrar de linha em vez
                          // de empurrar a largura da tabela.
                          <ul className="rounded-xl border border-gray-200 dark:border-gray-500 bg-white divide-y divide-gray-200 dark:divide-gray-500 overflow-hidden">
                            {cliente.pedidos.map(pedido => {
                              const status = getStatusPedido(pedido)
                              const totalItens = pedido.itens.length
                              return (
                                <li key={pedido.numero} className="flex flex-wrap items-center gap-x-3 gap-y-2 p-3 sm:px-4">
                                  <span className="w-9 h-9 rounded-lg bg-lm-green/10 text-lm-green flex items-center justify-center flex-shrink-0">
                                    {pedido.metodo === 'retirada' ? <Store size={18} /> : <Truck size={18} />}
                                  </span>
                                  <span className="min-w-0 flex-1">
                                    <span className="flex items-center gap-2 flex-wrap">
                                      <span className="font-mono text-sm font-semibold text-gray-900">{pedido.numero}</span>
                                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_PEDIDO_COR[status.cor]}`}>{status.label}</span>
                                    </span>
                                    <span className="block text-sm text-gray-700">
                                      {new Date(pedido.data).toLocaleDateString('pt-BR')} · {totalItens} {totalItens === 1 ? 'item' : 'itens'} · {pedido.metodo === 'retirada' ? 'Retirada na loja' : 'Entrega'}
                                    </span>
                                  </span>
                                  <span className="text-sm font-bold text-gray-900">
                                    {pedido.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                  </span>
                                </li>
                              )
                            })}
                          </ul>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {ordenados.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      icon={Search}
                      title="Nenhum cliente encontrado"
                      description={busca ? 'Tente buscar por outro nome ou e-mail.' : 'Ainda não há contas cadastradas.'}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
