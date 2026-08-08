'use client'

import { useEffect, useState } from 'react'
import { CalendarCheck, MapPin, Clock, Trash2, Tag, Check, X } from 'lucide-react'
import Card from './ui/Card'
import Badge from './ui/Badge'
import Button from './ui/Button'

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

const STATUS_TONE: Record<Agendamento['status'], 'green' | 'red'> = {
  confirmado: 'green',
  cancelado: 'red',
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
                : 'bg-white text-gray-500 border-gray-100 hover:border-lm-green/40'
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
          <Card
            key={ag.id}
            padding="sm"
            className={ag.status === 'cancelado' ? 'opacity-60' : ''}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-lm-dark">{ag.servicoLabel}</span>
                  <Badge tone={STATUS_TONE[ag.status]}>
                    {ag.status === 'confirmado' ? <Check size={11} /> : <X size={11} />}
                    {ag.status === 'confirmado' ? 'Confirmado' : 'Cancelado'}
                  </Badge>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">#{ag.id} · Criado em {ag.criadoEm}</p>
              </div>
              {ag.status === 'confirmado' && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => cancelar(ag.id)}
                >
                  <Trash2 size={11} /> Cancelar
                </Button>
              )}
              {ag.status === 'cancelado' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => remover(ag.id)}
                  className="border border-gray-200"
                >
                  Remover
                </Button>
              )}
            </div>

            {/* Detalhes */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <Detail icon={<MapPin size={12} />} label="Loja" value={ag.loja.split(' — ')[0]} />
              <Detail icon={<Clock size={12} />} label="Data e hora" value={`${ag.data} às ${ag.horario}`} />
              <Detail icon={<Tag size={12} />} label="Nome" value={ag.nome} />
            </div>

            {ag.observacao && (
              <p className="mt-2.5 text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
                <span className="font-medium">Obs:</span> {ag.observacao}
              </p>
            )}
          </Card>
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
