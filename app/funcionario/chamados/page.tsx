'use client'

import { useState } from 'react'
import { Search, Send, User, Clock, MessageSquare } from 'lucide-react'

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
    <div className="flex flex-col h-[calc(100vh-2rem)] m-4 overflow-hidden rounded-2xl shadow-sm border border-gray-100 bg-white max-w-6xl mx-auto">
      <div className="flex h-full">
        {/* Sidebar de Chamados */}
        <div className="w-80 border-r border-gray-100 flex flex-col bg-gray-50/50">
          <div className="p-4 border-b border-gray-100 bg-white">
            <h1 className="text-lg font-black text-lm-dark">Chamados</h1>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Buscar chamado..." 
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-lm-green focus:ring-1 focus:ring-lm-green"
              />
            </div>
          </div>
          <div className="flex-1 overflow-auto p-2 space-y-1">
            {chamados.map(chamado => (
              <button 
                key={chamado.id}
                onClick={() => setChamadoAtivo(chamado.id)}
                className={`w-full text-left p-3 rounded-xl transition-all ${
                  chamadoAtivo === chamado.id ? 'bg-white shadow-sm border border-gray-100' : 'hover:bg-gray-100/50 border border-transparent'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-sm text-lm-dark truncate">{chamado.cliente}</span>
                  <span className="text-[10px] font-medium text-gray-400 flex items-center gap-1">
                    <Clock size={10} /> {chamado.tempo}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs text-lm-green font-medium px-2 py-0.5 bg-lm-green/10 rounded-md">
                    {chamado.setor}
                  </span>
                  {chamado.status === 'Aguardando' && (
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  )}
                </div>
                <p className="text-xs text-gray-500 line-clamp-1">{chamado.msg}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Área de Chat */}
        <div className="flex-1 flex flex-col bg-white relative">
          {chamadoSelecionado ? (
            <>
              {/* Chat Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white z-10 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-lm-green/10 flex items-center justify-center text-lm-green">
                    <User size={20} />
                  </div>
                  <div>
                    <h2 className="font-bold text-lm-dark">{chamadoSelecionado.cliente}</h2>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      Setor: <span className="font-medium">{chamadoSelecionado.setor}</span>
                    </p>
                  </div>
                </div>
                <button className="text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors">
                  Encerrar Chamado
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-auto p-6 space-y-6 bg-gray-50/50">
                <div className="flex flex-col gap-4">
                  <div className="flex items-end gap-2 max-w-[80%]">
                    <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0 flex items-center justify-center"><User size={14} className="text-gray-500" /></div>
                    <div className="bg-white p-3 rounded-2xl rounded-bl-none shadow-sm border border-gray-100 text-sm text-gray-700">
                      Olá! Estou no corredor 15 e não consigo achar a tinta Suvinil Fosca. Pode me ajudar?
                    </div>
                  </div>
                  <div className="flex items-end gap-2 max-w-[80%]">
                    <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0 flex items-center justify-center"><User size={14} className="text-gray-500" /></div>
                    <div className="bg-white p-3 rounded-2xl rounded-bl-none shadow-sm border border-gray-100 text-sm text-gray-700">
                      {chamadoSelecionado.msg}
                    </div>
                  </div>
                  {/* Mock system message */}
                  <div className="text-center my-4">
                    <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                      Você assumiu este chamado
                    </span>
                  </div>
                </div>
              </div>

              {/* Chat Input */}
              <div className="p-4 bg-white border-t border-gray-100">
                <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-2 border border-gray-200 focus-within:border-lm-green focus-within:ring-1 focus-within:ring-lm-green transition-all">
                  <input 
                    type="text" 
                    value={mensagem}
                    onChange={e => setMensagem(e.target.value)}
                    placeholder="Digite sua resposta..." 
                    className="flex-1 bg-transparent border-none outline-none px-3 text-sm text-gray-700"
                  />
                  <button className="bg-lm-green hover:bg-[#007034] text-white p-2.5 rounded-xl transition-colors">
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
        </div>
      </div>
    </div>
  )
}
