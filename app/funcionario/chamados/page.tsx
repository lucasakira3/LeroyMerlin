'use client'

import { useState } from 'react'
import { Search, Send, User, Clock, MessageSquare } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'

export default function ChamadosPage() {
  const [chamadoAtivo, setChamadoAtivo] = useState<number | null>(1)
  const [mensagem, setMensagem] = useState('')

  const chamados = [
    { id: 1, cliente: 'Carlos Santos', status: 'Aguardando', tempo: '5 min', setor: 'Tintas', msg: 'Preciso de ajuda para calcular a quantidade de tinta...' },
    { id: 2, cliente: 'Ana Costa', status: 'Em Atendimento', tempo: '12 min', setor: 'Jardinagem', msg: 'Onde ficam os adubos?' },
    { id: 3, cliente: 'Pedro Lima', status: 'Aguardando', tempo: '15 min', setor: 'Ferramentas', msg: 'A furadeira XYZ vem com broca?' },
  ]

  const chamadoSelecionado = chamados.find(c => c.id === chamadoAtivo)

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto h-[calc(100vh-4rem)] flex flex-col">
      <PageHeader
        title="Chamados"
        description="Atenda os chamados de dúvidas dos clientes em tempo real."
      />

      <div className="flex flex-col lg:flex-row flex-1 min-h-0 gap-4 lg:gap-6">
        {/* Sidebar de Chamados */}
        <div className="w-full lg:w-80 shrink-0 flex flex-col min-h-0 max-h-56 lg:max-h-none">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Buscar chamado..."
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-lm-green focus:ring-2 focus:ring-lm-green/30 transition-all"
            />
          </div>
          <div className="flex-1 overflow-auto space-y-2 pr-1">
            {chamados.map(chamado => (
              <Card
                key={chamado.id}
                padding="sm"
                hoverable
                onClick={() => setChamadoAtivo(chamado.id)}
                className={`cursor-pointer transition-colors ${
                  chamadoAtivo === chamado.id ? 'border-lm-green/40 shadow-soft-lg' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-1.5">
                  <span className="font-bold text-sm text-gray-900 truncate">{chamado.cliente}</span>
                  <span className="text-[10px] font-medium text-gray-400 flex items-center gap-1 shrink-0">
                    <Clock size={10} /> {chamado.tempo}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-1.5">
                  <Badge tone="green">{chamado.setor}</Badge>
                  {chamado.status === 'Aguardando' && (
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  )}
                </div>
                <p className="text-xs text-gray-500 line-clamp-1">{chamado.msg}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Área de Chat */}
        <Card padding="none" className="flex-1 flex flex-col overflow-hidden">
          {chamadoSelecionado ? (
            <>
              {/* Chat Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-lm-green/10 flex items-center justify-center text-lm-green">
                    <User size={20} />
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-900">{chamadoSelecionado.cliente}</h2>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      Setor: <span className="font-medium">{chamadoSelecionado.setor}</span>
                    </p>
                  </div>
                </div>
                <button className="text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl transition-colors">
                  Encerrar Chamado
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-auto p-6 space-y-4 bg-gray-50/50">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center">
                    <User size={16} />
                  </div>
                  <div className="max-w-[80%] flex flex-col items-start">
                    <div className="px-4 py-3 rounded-2xl text-sm leading-relaxed bg-gray-100 text-gray-800">
                      Olá! Estou no corredor 15 e não consigo achar a tinta Suvinil Fosca. Pode me ajudar?
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center">
                    <User size={16} />
                  </div>
                  <div className="max-w-[80%] flex flex-col items-start">
                    <div className="px-4 py-3 rounded-2xl text-sm leading-relaxed bg-gray-100 text-gray-800">
                      {chamadoSelecionado.msg}
                    </div>
                  </div>
                </div>
                {/* Mock system message */}
                <div className="text-center my-4">
                  <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                    Você assumiu este chamado
                  </span>
                </div>
              </div>

              {/* Chat Input */}
              <div className="p-4 bg-white border-t border-gray-100">
                <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-2 border border-gray-200 focus-within:border-lm-green focus-within:ring-2 focus-within:ring-lm-green/30 transition-all">
                  <input
                    type="text"
                    value={mensagem}
                    onChange={e => setMensagem(e.target.value)}
                    placeholder="Digite sua resposta..."
                    className="flex-1 bg-transparent border-none outline-none px-3 text-sm text-gray-700"
                  />
                  <button className="bg-lm-green hover:bg-lm-green/90 text-white p-2.5 rounded-xl transition-colors">
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 flex-col gap-3">
              <MessageSquare size={48} className="opacity-20" />
              <p>Selecione um chamado para iniciar o atendimento</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
