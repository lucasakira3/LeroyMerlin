'use client'

import { Fragment, useEffect, useMemo, useState } from 'react'
import { Search, ChevronDown, ChevronUp, Package } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'

interface ContaCliente {
  nome: string
  senha: string
  criadoEm: string
}

interface ItemPedido {
  produtoId: string
  nome: string
  preco: number
  quantidade: number
}

interface Pedido {
  numero: string
  data: string
  itens: ItemPedido[]
  total: number
}

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

  useEffect(() => {
    // Dado real, não inventado: agrega as contas (lib/clientContas.ts) com os pedidos
    // (lib/clientPedidos.ts) já salvos neste navegador — sem endpoint dedicado porque as
    // duas chaves de localStorage já têm tudo que essa tela precisa mostrar.
    const contas: Record<string, ContaCliente> = JSON.parse(localStorage.getItem('lm_contas_cliente') ?? '{}')
    const pedidosPorEmail: Record<string, Pedido[]> = JSON.parse(localStorage.getItem('lm_pedidos_cliente') ?? '{}')

    const resumo: ClienteResumo[] = Object.entries(contas).map(([email, conta]) => {
      const pedidos = pedidosPorEmail[email] ?? []
      const totalGasto = pedidos.reduce((soma, p) => soma + p.total, 0)
      const status: ClienteResumo['status'] = pedidos.length === 0 ? 'Novo' : totalGasto >= 500 ? 'VIP' : 'Ativo'
      return { email, nome: conta.nome, criadoEm: conta.criadoEm, pedidos, totalGasto, status }
    })

    setClientes(resumo)
  }, [])

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
    <div className="p-8 max-w-6xl mx-auto">
      <PageHeader
        title="Clientes"
        description={`${clientes.length} conta${clientes.length === 1 ? '' : 's'} cadastrada${clientes.length === 1 ? '' : 's'} neste navegador.`}
      />

      <Card padding="none">
        <div className="p-4 border-b border-gray-100 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por nome ou e-mail..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-lm-green focus:ring-1 focus:ring-lm-green transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-bold">
                  <button onClick={() => handleSort('nome')} className="flex items-center gap-1.5 hover:text-lm-green transition-colors">
                    Nome <SortIcon ativo={sortKey === 'nome'} dir={sortDir} />
                  </button>
                </th>
                <th className="p-4 font-bold">Contato</th>
                <th className="p-4 font-bold text-center">
                  <button onClick={() => handleSort('pedidos')} className="flex items-center gap-1.5 mx-auto hover:text-lm-green transition-colors">
                    Pedidos <SortIcon ativo={sortKey === 'pedidos'} dir={sortDir} />
                  </button>
                </th>
                <th className="p-4 font-bold text-right">
                  <button onClick={() => handleSort('totalGasto')} className="flex items-center gap-1.5 ml-auto hover:text-lm-green transition-colors">
                    Total gasto <SortIcon ativo={sortKey === 'totalGasto'} dir={sortDir} />
                  </button>
                </th>
                <th className="p-4 font-bold text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {ordenados.map(cliente => (
                <Fragment key={cliente.email}>
                  <tr
                    onClick={() => setExpandidoEmail(e => (e === cliente.email ? null : cliente.email))}
                    className="hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 cursor-pointer"
                  >
                    <td className="p-4">
                      <p className="font-bold text-lm-dark">{cliente.nome}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Cadastrado em {new Date(cliente.criadoEm).toLocaleDateString('pt-BR')}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-gray-700">{cliente.email}</p>
                    </td>
                    <td className="p-4 text-center">
                      <Badge tone="gray">{cliente.pedidos.length}</Badge>
                    </td>
                    <td className="p-4 text-right font-medium text-sm text-gray-700">
                      {cliente.totalGasto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="p-4 text-center">
                      <Badge tone={STATUS_TONE[cliente.status]}>{cliente.status}</Badge>
                    </td>
                  </tr>
                  {expandidoEmail === cliente.email && (
                    <tr key={`${cliente.email}-detalhe`}>
                      <td colSpan={5} className="p-4 bg-gray-50 border-b border-gray-100">
                        {cliente.pedidos.length === 0 ? (
                          <p className="text-sm text-gray-500">Nenhum pedido ainda.</p>
                        ) : (
                          <div className="space-y-2">
                            {cliente.pedidos.map(pedido => (
                              <div key={pedido.numero} className="flex items-center justify-between bg-white rounded-xl border border-gray-100 px-4 py-2.5">
                                <div className="flex items-center gap-2">
                                  <Package size={14} className="text-lm-green" />
                                  <span className="font-mono text-xs font-semibold text-gray-700">{pedido.numero}</span>
                                  <span className="text-xs text-gray-400">
                                    {new Date(pedido.data).toLocaleDateString('pt-BR')} · {pedido.itens.length} item{pedido.itens.length > 1 ? 's' : ''}
                                  </span>
                                </div>
                                <span className="text-sm font-bold text-gray-900">
                                  {pedido.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </span>
                              </div>
                            ))}
                          </div>
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
