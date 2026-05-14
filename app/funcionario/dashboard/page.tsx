'use client'

import { Users, Package, MessageSquare, TrendingUp, AlertTriangle } from 'lucide-react'

export default function DashboardPage() {
  const stats = [
    { label: 'Clientes Ativos (Hoje)', value: '142', icon: Users, color: 'bg-blue-500' },
    { label: 'Alertas de Estoque', value: '12', icon: AlertTriangle, color: 'bg-red-500' },
    { label: 'Chamados em Espera', value: '5', icon: MessageSquare, color: 'bg-lm-orange' },
    { label: 'Produtos Cadastrados', value: '5.240', icon: Package, color: 'bg-lm-green' },
  ]

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-lm-dark">Visão Geral</h1>
        <p className="text-gray-500 mt-1">Bem-vindo ao painel de controle da loja.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
            <div className={`p-3 rounded-xl text-white ${stat.color} shadow-sm`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium">{stat.label}</p>
              <p className="text-2xl font-black text-lm-dark mt-1">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Atividades Recentes */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-lm-dark mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-lm-green" />
            Atividades Recentes
          </h2>
          <div className="space-y-4">
            {[
              { text: 'Novo chamado aberto no setor de Ferramentas.', time: 'Há 5 min' },
              { text: 'Estoque de "Furadeira Bosch" ajustado para 15.', time: 'Há 12 min' },
              { text: 'Cliente solicitou ajuda com Projeto Guiado (Cozinha).', time: 'Há 25 min' },
              { text: 'Novo produto cadastrado: "Tinta Acrílica Suvinil".', time: 'Há 1 hora' },
            ].map((act, i) => (
              <div key={i} className="flex justify-between items-start pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                <p className="text-sm text-gray-700">{act.text}</p>
                <span className="text-xs font-medium text-gray-400 whitespace-nowrap ml-4">{act.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Alertas Prioritários */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
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
                  <p className="text-xs text-red-600 mt-0.5">{alert.reason}</p>
                </div>
                <button className="text-xs font-bold text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors">
                  Resolver
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
