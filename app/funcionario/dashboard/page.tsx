'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Users, Package, MessageSquare, TrendingUp, AlertTriangle, BarChart3 } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import GraficoBarras from '@/components/GraficoBarras'
import { aplicarAjustes } from '@/lib/ajustesFuncionario'
import { getEstadoChamado } from '@/lib/chamadosFuncionario'
import { parseDataBR } from '@/lib/dataBr'
import type { Produto } from '@/types/produto'
import type { Agendamento } from '@/components/AgendamentosLista'

interface Pedido {
  numero: string
  data: string
  total: number
}

interface Atividade {
  texto: string
  quando: Date
}

interface AlertaEstoque {
  id: string
  nome: string
  categoria: string
  estoque: number
}

function tempoRelativo(data: Date): string {
  const diffMs = Date.now() - data.getTime()
  const min = Math.floor(diffMs / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `há ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `há ${h}h`
  return `há ${Math.floor(h / 24)}d`
}

export default function DashboardPage() {
  const [totalClientes, setTotalClientes] = useState(0)
  const [totalProdutos, setTotalProdutos] = useState<number | null>(null)
  const [alertasEstoque, setAlertasEstoque] = useState<AlertaEstoque[]>([])
  const [chamadosPendentes, setChamadosPendentes] = useState(0)
  const [atividades, setAtividades] = useState<Atividade[]>([])
  const [estoquePorCategoria, setEstoquePorCategoria] = useState<{ label: string; valor: number }[]>([])

  useEffect(() => {
    // Tudo abaixo é lido do mesmo localStorage já usado pelo lado do cliente — sem número
    // inventado, ver lib/clientContas.ts, lib/clientPedidos.ts, components/AgendamentosLista.tsx.
    const contas = JSON.parse(localStorage.getItem('lm_contas_cliente') ?? '{}')
    setTotalClientes(Object.keys(contas).length)

    const pedidosPorEmail: Record<string, Pedido[]> = JSON.parse(localStorage.getItem('lm_pedidos_cliente') ?? '{}')
    const todosPedidos = Object.values(pedidosPorEmail).flat()

    const agendamentos: Agendamento[] = JSON.parse(localStorage.getItem('lm_agendamentos') ?? '[]')
    const pendentes = agendamentos.filter(a => a.status === 'confirmado' && !getEstadoChamado(a.id).atendido)
    setChamadosPendentes(pendentes.length)

    const atividadesPedidos: Atividade[] = todosPedidos.map(p => ({
      texto: `Pedido ${p.numero} confirmado — ${p.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
      quando: new Date(p.data),
    }))
    const atividadesAgendamentos: Atividade[] = agendamentos.map(a => ({
      texto: `${a.nome} agendou ${a.servicoLabel.toLowerCase()} para ${a.data}`,
      quando: parseDataBR(a.criadoEm),
    }))
    setAtividades(
      [...atividadesPedidos, ...atividadesAgendamentos]
        .sort((a, b) => b.quando.getTime() - a.quando.getTime())
        .slice(0, 6)
    )

    fetch('/api/funcionario/produtos')
      .then(r => r.json())
      .then((produtos: Produto[]) => {
        setTotalProdutos(produtos.length)
        const comAjustes = produtos.map(p =>
          aplicarAjustes({ id: p.id, nome: p.produto, categoria: p.categoria, preco: p.preco, estoque: p.estoque })
        )
        const baixos = comAjustes
          .filter(p => p.estoque < 10)
          .sort((a, b) => a.estoque - b.estoque)
          .slice(0, 4)
        setAlertasEstoque(baixos)

        const somaPorCategoria = new Map<string, number>()
        for (const p of comAjustes) {
          somaPorCategoria.set(p.categoria, (somaPorCategoria.get(p.categoria) ?? 0) + p.estoque)
        }
        setEstoquePorCategoria(
          [...somaPorCategoria.entries()]
            .map(([label, valor]) => ({ label, valor }))
            .sort((a, b) => b.valor - a.valor)
        )
      })
  }, [])

  const stats = [
    { label: 'Clientes cadastrados', value: String(totalClientes), icon: Users, color: 'bg-blue-500', href: '/funcionario/clientes' },
    { label: 'Alertas de estoque', value: String(alertasEstoque.length), icon: AlertTriangle, color: 'bg-red-500', href: '/funcionario/produtos' },
    { label: 'Chamados pendentes', value: String(chamadosPendentes), icon: MessageSquare, color: 'bg-lm-orange', href: '/funcionario/chamados' },
    { label: 'Produtos no catálogo', value: totalProdutos !== null ? totalProdutos.toLocaleString('pt-BR') : '…', icon: Package, color: 'bg-lm-green', href: '/funcionario/produtos' },
  ]

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <PageHeader title="Visão Geral" description="Bem-vindo ao painel de controle da loja." />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, i) => (
          <Link key={i} href={stat.href}>
            <Card
              hoverable
              className="flex items-start gap-4 animate-fade-in-up"
              style={{ '--stagger-delay': `${i * 60}ms` } as React.CSSProperties}
            >
              <div className={`p-3 rounded-xl text-white ${stat.color} shadow-soft`}>
                <stat.icon size={24} />
              </div>
              <div>
                <p className="text-3xl font-semibold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Atividades Recentes */}
        <Card padding="none">
          <div className="p-6 pb-4">
            <h2 className="text-lg font-bold text-lm-dark flex items-center gap-2">
              <TrendingUp size={20} className="text-lm-green" />
              Atividades Recentes
            </h2>
          </div>
          <div>
            {atividades.length === 0 && (
              <EmptyState
                icon={TrendingUp}
                title="Nenhuma atividade ainda"
                description="Pedidos, agendamentos e chamados aparecem aqui conforme acontecem."
              />
            )}
            {atividades.map((act, i) => (
              <div
                key={i}
                className={`flex justify-between items-start gap-4 px-6 py-4 ${
                  i < atividades.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <p className="text-sm text-gray-700">{act.texto}</p>
                <span className="text-xs font-medium text-gray-400 whitespace-nowrap">{tempoRelativo(act.quando)}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Alertas de Estoque */}
        <Card>
          <h2 className="text-lg font-bold text-lm-dark mb-4 flex items-center gap-2">
            <AlertTriangle size={20} className="text-red-500" />
            Alertas de Estoque
          </h2>
          <div className="space-y-4">
            {alertasEstoque.length === 0 && (
              <p className="text-sm text-gray-500">Nenhum produto com estoque crítico no momento.</p>
            )}
            {alertasEstoque.map(alerta => (
              <div key={alerta.id} className="bg-red-50 rounded-xl p-4 border border-red-100 flex justify-between items-center gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-sm text-gray-800 truncate">{alerta.nome}</p>
                  <Badge tone="red" className="mt-1.5">
                    {alerta.estoque === 0 ? 'Sem estoque' : `Restam ${alerta.estoque}`}
                  </Badge>
                </div>
                <Link
                  href="/funcionario/produtos"
                  className="text-xs font-bold text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
                >
                  Ver
                </Link>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Estoque por Categoria */}
      <Card className="mt-6">
        <h2 className="text-lg font-bold text-lm-dark mb-4 flex items-center gap-2">
          <BarChart3 size={20} className="text-lm-green" />
          Estoque por Categoria
        </h2>
        {estoquePorCategoria.length === 0 ? (
          <p className="text-sm text-gray-500">Carregando...</p>
        ) : (
          <GraficoBarras dados={estoquePorCategoria} />
        )}
      </Card>
    </div>
  )
}
