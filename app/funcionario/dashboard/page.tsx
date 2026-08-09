'use client'

import { Users, Package, MessageSquare, TrendingUp, AlertTriangle } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'

export default function DashboardPage() {
  const stats = [
    { label: 'Clientes Ativos (Hoje)', value: '142', icon: Users, color: 'bg-blue-500' },
    { label: 'Alertas de Estoque', value: '12', icon: AlertTriangle, color: 'bg-red-500' },
    { label: 'Chamados em Espera', value: '5', icon: MessageSquare, color: 'bg-lm-orange' },
    { label: 'Produtos Cadastrados', value: '5.240', icon: Package, color: 'bg-lm-green' },
  ]

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <PageHeader title="Visão Geral" description="Bem-vindo ao painel de controle da loja." />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, i) => (
          <Card key={i} className="flex items-start gap-4 animate-fade-in-up" style={{ '--stagger-delay': `${i * 60}ms` } as React.CSSProperties}>
            <div className={`p-3 rounded-xl text-white ${stat.color} shadow-soft`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-3xl font-semibold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
            </div>
          </Card>
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
            {[
              { text: 'Novo chamado aberto no setor de Ferramentas.', time: 'Há 5 min' },
              { text: 'Estoque de "Furadeira Bosch" ajustado para 15.', time: 'Há 12 min' },
              { text: 'Cliente solicitou ajuda com Projeto Guiado (Cozinha).', time: 'Há 25 min' },
              { text: 'Novo produto cadastrado: "Tinta Acrílica Suvinil".', time: 'Há 1 hora' },
            ].map((act, i, arr) => (
              <div
                key={i}
                className={`flex justify-between items-start px-6 py-4 ${
                  i < arr.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <p className="text-sm text-gray-700">{act.text}</p>
                <span className="text-xs font-medium text-gray-400 whitespace-nowrap ml-4">{act.time}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Alertas Prioritários */}
        <Card>
          <h2 className="text-lg font-bold text-lm-dark mb-4 flex items-center gap-2">
            <AlertTriangle size={20} className="text-red-500" />
            Alertas Prioritários
          </h2>
          <div className="space-y-4">
            {[
              { item: 'Cimento CP II 50kg', reason: 'Estoque Crítico (Restam 2)' },
              { item: 'Piso Cerâmico 60x60', reason: 'Divergência de prateleira reportada' },
              { item: 'Chamado #492', reason: 'Cliente aguardando há mais de 15 min' },
            ].map((alert, i) => (
              <div key={i} className="bg-red-50 rounded-xl p-4 border border-red-100 flex justify-between items-center">
                <div>
                  <p className="font-bold text-sm text-gray-800">{alert.item}</p>
                  <Badge tone="red" className="mt-1.5">{alert.reason}</Badge>
                </div>
                <button className="text-xs font-bold text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors">
                  Resolver
                </button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
