'use client'

import { useEffect, useState } from 'react'
import { CalendarCheck, MapPin, Clock, Trash2, Tag } from 'lucide-react'

export interface Agendamento {
  id: string
  servico: string
  servicoLabel: string
  loja: string
  data: string
  horario: string
  nome: string
  telefone: string
  email: string
  observacao: string
  criadoEm: string
  status: 'confirmado' | 'cancelado'
}

const STATUS_STYLE = {
  confirmado: 'bg-lm-green/10 text-lm-green border-lm-green/20',
  cancelado:  'bg-red-50 text-red-500 border-red-200',
}

export function salvarAgendamento(ag: Omit<Agendamento, 'id' | 'criadoEm' | 'status'>) {
  const existentes: Agendamento[] = JSON.parse(localStorage.getItem('lm_agendamentos') ?? '[]')
  const novo: Agendamento = {
    ...ag,
    id: `AG-${Date.now()}`,
    criadoEm: new Date().toLocaleString('pt-BR'),
    status: 'confirmado',
  }
  localStorage.setItem('lm_agendamentos', JSON.stringify([novo, ...existentes]))
  return novo
}

export default function AgendamentosLista() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [filtro, setFiltro] = useState<'todos' | 'confirmado' | 'cancelado'>('todos')

  useEffect(() => {
    const dados = JSON.parse(localStorage.getItem('lm_agendamentos') ?? '[]')
    setAgendamentos(dados)
  }, [])

  function cancelar(id: string) {
    const atualizados = agendamentos.map(a =>
      a.id === id ? { ...a, status: 'cancelado' as const } : a
    )
    setAgendamentos(atualizados)
    localStorage.setItem('lm_agendamentos', JSON.stringify(atualizados))
  }

  function remover(id: string) {
    const atualizados = agendamentos.filter(a => a.id !== id)
    setAgendamentos(atualizados)
    localStorage.setItem('lm_agendamentos', JSON.stringify(atualizados))
  }

  const filtrados = agendamentos.filter(a => filtro === 'todos' || a.status === filtro)

  return (
    <div>
      {/* Filtros */}
      <div className="flex gap-2 mb-5">
        {(['todos', 'confirmado', 'cancelado'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              filtro === f
                ? 'bg-lm-green text-white border-lm-green'
                : 'bg-white text-gray-500 border-gray-200 hover:border-lm-green/40'
            }`}
          >
            {f === 'todos' ? 'Todos' : f === 'confirmado' ? 'Confirmados' : 'Cancelados'}
            <span className="ml-1.5 opacity-70">
              ({f === 'todos' ? agendamentos.length : agendamentos.filter(a => a.status === f).length})
            </span>
          </button>
        ))}
      </div>

      {/* Lista vazia */}
      {filtrados.length === 0 && (
        <div className="text-center py-14 text-gray-400">
          <CalendarCheck size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">Nenhum agendamento {filtro !== 'todos' ? `${filtro}` : 'encontrado'}</p>
          <p className="text-xs mt-1">
            {agendamentos.length === 0
              ? 'Agende sua primeira visita pela aba "Novo Agendamento"'
              : 'Tente outro filtro'}
          </p>
        </div>
      )}

      {/* Cards de agendamento */}
      <div className="space-y-3">
        {filtrados.map(ag => (
          <div
            key={ag.id}
            className={`bg-white border rounded-xl p-4 ${
              ag.status === 'cancelado' ? 'opacity-60 border-gray-200' : 'border-gray-200 shadow-sm'
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-lm-dark">{ag.servicoLabel}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLE[ag.status]}`}>
                    {ag.status === 'confirmado' ? '✓ Confirmado' : '✗ Cancelado'}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">#{ag.id} · Criado em {ag.criadoEm}</p>
              </div>
              {ag.status === 'confirmado' && (
                <button
                  onClick={() => cancelar(ag.id)}
                  className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1 border border-red-200 rounded-lg px-2 py-1 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={11} /> Cancelar
                </button>
              )}
              {ag.status === 'cancelado' && (
                <button
                  onClick={() => remover(ag.id)}
                  className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg px-2 py-1 hover:bg-gray-50 transition-colors"
                >
                  Remover
                </button>
              )}
            </div>

            {/* Detalhes */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <Detail icon={<MapPin size={12} />} label="Loja" value={ag.loja.split(' — ')[0]} />
              <Detail icon={<Clock size={12} />} label="Data e hora" value={`${ag.data} às ${ag.horario}`} />
              <Detail icon={<Tag size={12} />} label="Nome" value={ag.nome} />
            </div>

            {ag.observacao && (
              <p className="mt-2.5 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                <span className="font-medium">Obs:</span> {ag.observacao}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-1.5">
      <span className="text-gray-400 mt-0.5 flex-shrink-0">{icon}</span>
      <div>
        <p className="text-[10px] text-gray-400">{label}</p>
        <p className="text-xs font-semibold text-gray-700 leading-tight">{value}</p>
      </div>
    </div>
  )
}
