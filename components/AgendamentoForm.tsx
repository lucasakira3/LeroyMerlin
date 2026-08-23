'use client'

import { useState } from 'react'
import { CalendarCheck, CheckCircle2, ChevronRight } from 'lucide-react'
import { salvarAgendamento } from './AgendamentosLista'
import { getUsuarioLogado } from '@/lib/clientAuth'
import { adicionarNotificacao } from '@/lib/clientNotificacoes'
import Button from './ui/Button'
import Card from './ui/Card'

const lojas = [
  'Interlagos — São Paulo/SP',
  'Osasco — Osasco/SP',
  'Aricanduva — São Paulo/SP',
  'Santo André — Santo André/SP',
  'Guarulhos — Guarulhos/SP',
  'Campinas — Campinas/SP',
  'Alphaville — Barueri/SP',
  'São Bernardo — São Bernardo do Campo/SP',
  'Sorocaba — Sorocaba/SP',
  'Belo Horizonte — BH/MG',
  'Rio de Janeiro — RJ',
  'Curitiba — PR',
  'Porto Alegre — RS',
  'Brasília — DF',
  'Goiânia — GO',
]

const servicos = [
  { id: 'banheiro', label: 'Projeto de Banheiro', desc: 'Planejamento de renovação completa' },
  { id: 'cozinha', label: 'Projeto de Cozinha', desc: 'Design e escolha de móveis e revestimentos' },
  { id: 'eletrica', label: 'Consultoria Elétrica', desc: 'Instalações e dimensionamento' },
  { id: 'hidraulica', label: 'Consultoria Hidráulica', desc: 'Encanamentos e acabamentos' },
  { id: 'piso', label: 'Piso e Revestimento', desc: 'Escolha e cálculo de materiais' },
  { id: 'pintura', label: 'Consultoria de Pintura', desc: 'Cores, texturas e tintas adequadas' },
  { id: 'jardim', label: 'Paisagismo e Jardim', desc: 'Projeto de áreas externas' },
  { id: 'geral', label: 'Dúvida Geral de Obra', desc: 'Orientação para reforma em geral' },
]

const horarios = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00']

function diasDisponiveis() {
  const dias = []
  const hoje = new Date()
  for (let i = 1; i <= 14; i++) {
    const d = new Date(hoje)
    d.setDate(hoje.getDate() + i)
    if (d.getDay() !== 0) { // sem domingo
      dias.push(d)
    }
  }
  return dias.slice(0, 10)
}

export default function AgendamentoForm({ onConfirmado }: { onConfirmado?: () => void }) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    servico: '',
    loja: '',
    data: '',
    horario: '',
    nome: '',
    telefone: '',
    email: '',
    observacao: '',
  })
  const [confirmado, setConfirmado] = useState(false)

  const set = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }))

  const diasOpts = diasDisponiveis()

  if (confirmado) {
    const servico = servicos.find((s) => s.id === form.servico)
    return (
      <div className="max-w-lg mx-auto text-center py-16 px-4">
        <CheckCircle2 size={56} className="text-lm-green mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-lm-dark mb-2">Visita agendada!</h2>
        <p className="text-gray-500 mb-6">Você receberá uma confirmação por e-mail e SMS.</p>

        <Card padding="sm" className="text-left space-y-3 mb-6">
          <Row label="Serviço" value={servico?.label ?? form.servico} />
          <Row label="Loja" value={form.loja} />
          <Row label="Data" value={`${form.data} às ${form.horario}`} />
          <Row label="Nome" value={form.nome} />
          <Row label="Contato" value={form.telefone || form.email} />
        </Card>

        <button
          onClick={() => { setConfirmado(false); setStep(1); setForm({ servico: '', loja: '', data: '', horario: '', nome: '', telefone: '', email: '', observacao: '' }) }}
          className="text-sm text-lm-green underline"
        >
          Fazer novo agendamento
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2, 3].map((n) => (
          <div key={n} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              step > n ? 'bg-lm-green text-white' : step === n ? 'bg-lm-green text-white ring-4 ring-lm-green/20' : 'bg-gray-200 text-gray-500'
            }`}>{step > n ? '✓' : n}</div>
            {n < 3 && <div className={`h-0.5 w-12 ${step > n ? 'bg-lm-green' : 'bg-gray-200'}`} />}
          </div>
        ))}
        <span className="ml-2 text-xs text-gray-500">
          {step === 1 ? 'Serviço e loja' : step === 2 ? 'Data e horário' : 'Seus dados'}
        </span>
      </div>

      {/* Step 1 — Serviço + Loja */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-lm-dark mb-3">Qual serviço você precisa?</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {servicos.map((s) => (
                <button
                  key={s.id}
                  onClick={() => set('servico', s.id)}
                  className={`text-left p-3 rounded-xl border transition-all ${
                    form.servico === s.id
                      ? 'border-lm-green bg-lm-green/5 ring-1 ring-lm-green'
                      : 'border-gray-200 bg-white hover:border-lm-green/40'
                  }`}
                >
                  <p className="text-sm font-medium text-lm-dark">{s.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-lm-dark mb-3">Qual loja?</h3>
            <select
              value={form.loja}
              onChange={(e) => set('loja', e.target.value)}
              className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-lm-green/30 bg-white"
            >
              <option value="">Selecione uma loja...</option>
              {lojas.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          <Button
            disabled={!form.servico || !form.loja}
            onClick={() => setStep(2)}
            className="w-full h-12"
          >
            Continuar <ChevronRight size={16} />
          </Button>
        </div>
      )}

      {/* Step 2 — Data + Horário */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-lm-dark mb-3">Escolha uma data</h3>
            <div className="grid grid-cols-5 gap-2">
              {diasOpts.map((d) => {
                const iso = d.toISOString().split('T')[0]
                const label = d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })
                return (
                  <button
                    key={iso}
                    onClick={() => set('data', label)}
                    className={`p-2 rounded-xl border text-center text-xs transition-all ${
                      form.data === label
                        ? 'border-lm-green bg-lm-green/10 text-lm-green font-semibold ring-1 ring-lm-green'
                        : 'border-gray-200 bg-white hover:border-lm-green/40'
                    }`}
                  >
                    {label.replace(',', '')}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-lm-dark mb-3">Horário preferido</h3>
            <div className="grid grid-cols-4 gap-2">
              {horarios.map((h) => (
                <button
                  key={h}
                  onClick={() => set('horario', h)}
                  className={`py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    form.horario === h
                      ? 'border-lm-green bg-lm-green text-white'
                      : 'border-gray-200 bg-white hover:border-lm-green/40'
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setStep(1)} className="flex-1 h-12 border border-gray-200">
              Voltar
            </Button>
            <Button
              disabled={!form.data || !form.horario}
              onClick={() => setStep(3)}
              className="flex-1 h-12"
            >
              Continuar <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3 — Dados pessoais */}
      {step === 3 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-lm-dark">Seus dados para confirmação</h3>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Nome completo *</label>
            <input
              type="text"
              value={form.nome}
              onChange={(e) => set('nome', e.target.value)}
              placeholder="João da Silva"
              className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-lm-green/30 bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Telefone / WhatsApp</label>
              <input
                type="tel"
                value={form.telefone}
                onChange={(e) => set('telefone', e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-lm-green/30 bg-white"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">E-mail</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="joao@email.com"
                className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-lm-green/30 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Observações (opcional)</label>
            <textarea
              value={form.observacao}
              onChange={(e) => set('observacao', e.target.value)}
              placeholder="Descreva brevemente o que precisa..."
              rows={3}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-lm-green/30 resize-none bg-white"
            />
          </div>

          {/* Resumo */}
          <div className="bg-lm-green/5 border border-lm-green/20 rounded-xl p-4 space-y-1.5">
            <p className="text-xs font-semibold text-lm-green mb-2">Resumo do agendamento</p>
            <Row label="Serviço" value={servicos.find((s) => s.id === form.servico)?.label ?? ''} />
            <Row label="Loja" value={form.loja} />
            <Row label="Data/hora" value={`${form.data} às ${form.horario}`} />
          </div>

          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setStep(2)} className="flex-1 h-12 border border-gray-200">
              Voltar
            </Button>
            <Button
              disabled={!form.nome || (!form.telefone && !form.email)}
              onClick={() => {
                salvarAgendamento({
                  servico: form.servico,
                  servicoLabel: servicos.find(s => s.id === form.servico)?.label ?? form.servico,
                  loja: form.loja,
                  data: form.data,
                  horario: form.horario,
                  nome: form.nome,
                  telefone: form.telefone,
                  email: form.email,
                  observacao: form.observacao,
                })
                const usuarioLogado = getUsuarioLogado()
                if (usuarioLogado) {
                  try {
                    adicionarNotificacao(usuarioLogado.email, {
                      tipo: 'agendamento',
                      titulo: 'Visita agendada',
                      mensagem: `Sua visita em ${form.loja} foi confirmada para ${form.data} às ${form.horario}.`,
                      href: '/agendamento',
                    })
                  } catch {}
                }
                setConfirmado(true)
                setTimeout(() => onConfirmado?.(), 2000)
              }}
              className="flex-1 h-12"
            >
              <CalendarCheck size={16} /> Confirmar visita
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-lm-dark">{value}</span>
    </div>
  )
}
