'use client'

import { useState } from 'react'
import AgendamentoForm from '@/components/AgendamentoForm'
import AgendamentosLista from '@/components/AgendamentosLista'
import { CalendarPlus, CalendarCheck } from 'lucide-react'

export default function AgendamentoPage() {
  const [aba, setAba] = useState<'novo' | 'consultar'>('novo')

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Tabs da página */}
      <div className="flex gap-1 mb-6 bg-white border border-gray-200 rounded-xl p-1 w-fit shadow-sm">
        <button
          onClick={() => setAba('novo')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            aba === 'novo'
              ? 'bg-lm-green text-white shadow-sm'
              : 'text-gray-500 hover:text-lm-green'
          }`}
        >
          <CalendarPlus size={15} />
          Novo Agendamento
        </button>
        <button
          onClick={() => setAba('consultar')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            aba === 'consultar'
              ? 'bg-lm-green text-white shadow-sm'
              : 'text-gray-500 hover:text-lm-green'
          }`}
        >
          <CalendarCheck size={15} />
          Meus Agendamentos
        </button>
      </div>

      {aba === 'novo' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <div className="mb-6">
              <h1 className="text-xl font-bold text-lm-dark">Agendar visita presencial</h1>
              <p className="text-sm text-gray-500 mt-1">
                Converse com um especialista na loja mais próxima. Atendimento gratuito, sem compromisso.
              </p>
            </div>
            <AgendamentoForm onConfirmado={() => setAba('consultar')} />
          </div>

          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
              <h2 className="text-sm font-bold text-lm-dark mb-3">O que esperar da visita</h2>
              <ul className="space-y-3">
                {[
                  { titulo: 'Consultor dedicado', desc: 'Especialista na área do seu projeto' },
                  { titulo: 'Sem custo', desc: 'Atendimento 100% gratuito na loja' },
                  { titulo: 'Orçamento na hora', desc: 'Estimativa de materiais e serviços' },
                  { titulo: 'Instaladores', desc: '+3.900 instaladores credenciados' },
                ].map(item => (
                  <li key={item.titulo} className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-lm-green mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-lm-dark">{item.titulo}</p>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-lm-yellow/20 border border-lm-yellow/40 rounded-lg p-4">
              <p className="text-xs font-semibold text-lm-dark mb-1">Precisa de ajuda agora?</p>
              <p className="text-xs text-gray-600 mb-3">Fale com um especialista pelo WhatsApp.</p>
              <a href="https://wa.me/551140071380" target="_blank" rel="noopener noreferrer"
                className="text-xs font-bold text-lm-green underline">Abrir WhatsApp →</a>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-lm-dark">Meus Agendamentos</h2>
            <p className="text-sm text-gray-500 mt-1">Consulte, acompanhe e cancele suas visitas agendadas.</p>
          </div>
          <AgendamentosLista />
        </div>
      )}
    </div>
  )
}
