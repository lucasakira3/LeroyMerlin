'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, Send, User, Clock, MapPin, MessageSquare, Bell, Check } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import type { Agendamento } from '@/components/AgendamentosLista'
import { getEstadoChamado, adicionarNota, marcarAtendido } from '@/lib/chamadosFuncionario'
import { getPedidosAjuda, marcarAjudaAtendida, type PedidoAjuda } from '@/lib/ajudaCorredor'
import { parseDataBR } from '@/lib/dataBr'

function tempoRelativo(iso: string): string {
  const diffMin = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (diffMin < 1) return 'agora'
  if (diffMin < 60) return `há ${diffMin}min`
  return `há ${Math.floor(diffMin / 60)}h`
}

function PedidosAjudaCorredor() {
  const [pedidos, setPedidos] = useState<PedidoAjuda[]>([])

  useEffect(() => {
    const atualizar = () => setPedidos(getPedidosAjuda())
    atualizar()
    window.addEventListener('lm-ajuda-corredor-change', atualizar)
    return () => window.removeEventListener('lm-ajuda-corredor-change', atualizar)
  }, [])

  const pendentes = pedidos.filter(p => !p.atendido)
  if (pendentes.length === 0) return null

  return (
    <div className="mb-4 bg-lm-yellow/10 border border-lm-yellow/40 rounded-2xl p-4">
      <h3 className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
        <Bell size={13} /> Pedidos de ajuda no corredor ({pendentes.length})
      </h3>
      <div className="flex flex-wrap gap-2">
        {pendentes.map(p => (
          <div key={p.id} className="flex items-center gap-3 bg-white border border-amber-200 rounded-xl px-3 py-2 text-xs">
            <div>
              <p className="font-bold text-gray-900">{p.corredor} {p.clienteNome ? `· ${p.clienteNome}` : ''}</p>
              <p className="text-gray-500 truncate max-w-[220px]">{p.produtoNome}</p>
              <p className="text-gray-400">{tempoRelativo(p.criadoEm)}</p>
            </div>
            <button
              onClick={() => marcarAjudaAtendida(p.id)}
              className="flex items-center gap-1 bg-lm-green text-white font-semibold px-2.5 py-1.5 rounded-lg hover:bg-green-700 transition-colors flex-shrink-0"
            >
              <Check size={12} /> Atender
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ChamadosPage() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[] | null>(null)
  const [chamadoAtivoId, setChamadoAtivoId] = useState<string | null>(null)
  const [busca, setBusca] = useState('')
  const [mensagem, setMensagem] = useState('')
  // Incrementado a cada nota/atendimento pra forçar releitura de chamadosFuncionario,
  // que lê direto do localStorage fora do ciclo normal de estado do React.
  const [versao, setVersao] = useState(0)

  useEffect(() => {
    const dados: Agendamento[] = JSON.parse(localStorage.getItem('lm_agendamentos') ?? '[]')
    setAgendamentos(dados)
  }, [])

  // Agendamento cancelado pelo cliente não é uma fila de atendimento — não entra aqui.
  const fila = useMemo(() => {
    if (!agendamentos) return []
    return agendamentos
      .filter(a => a.status === 'confirmado')
      .filter(a => a.nome.toLowerCase().includes(busca.toLowerCase()) || a.servicoLabel.toLowerCase().includes(busca.toLowerCase()) || a.loja.toLowerCase().includes(busca.toLowerCase()))
      .sort((a, b) => parseDataBR(b.criadoEm).getTime() - parseDataBR(a.criadoEm).getTime())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agendamentos, busca, versao])

  const chamadoSelecionado = fila.find(a => a.id === chamadoAtivoId) ?? null
  const estadoSelecionado = chamadoSelecionado ? getEstadoChamado(chamadoSelecionado.id) : null

  function enviarNota() {
    if (!chamadoSelecionado || !mensagem.trim()) return
    adicionarNota(chamadoSelecionado.id, mensagem.trim())
    setMensagem('')
    setVersao(v => v + 1)
  }

  function encerrarChamado() {
    if (!chamadoSelecionado) return
    marcarAtendido(chamadoSelecionado.id, true)
    setVersao(v => v + 1)
    setChamadoAtivoId(null)
  }

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto h-[calc(100vh-4rem)] flex flex-col">
      <PageHeader
        title="Chamados"
        description="Fila de agendamentos de visita pendentes de atendimento."
      />

      <PedidosAjudaCorredor />

      <div className="flex flex-col lg:flex-row flex-1 min-h-0 gap-4 lg:gap-6">
        {/* Sidebar de Chamados */}
        <div className="w-full lg:w-80 shrink-0 flex flex-col min-h-0 max-h-56 lg:max-h-none">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Buscar por nome, serviço ou loja..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-lm-green focus:ring-2 focus:ring-lm-green/30 transition-all"
            />
          </div>
          <div className="flex-1 overflow-auto space-y-2 pr-1">
            {agendamentos === null && (
              <p className="text-sm text-gray-400 text-center py-6">Carregando...</p>
            )}
            {agendamentos !== null && fila.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">Nenhum agendamento pendente.</p>
            )}
            {fila.map(ag => {
              const estado = getEstadoChamado(ag.id)
              return (
                <Card
                  key={ag.id}
                  padding="sm"
                  hoverable
                  onClick={() => setChamadoAtivoId(ag.id)}
                  className={`cursor-pointer transition-colors ${
                    chamadoAtivoId === ag.id ? 'border-lm-green/40 shadow-soft-lg' : ''
                  } ${estado.atendido ? 'opacity-60' : ''}`}
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <span className="font-bold text-sm text-gray-900 truncate">{ag.nome}</span>
                    <span className="text-[10px] font-medium text-gray-400 flex items-center gap-1 shrink-0">
                      <Clock size={10} /> {ag.data}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-1.5">
                    <Badge tone="green">{ag.servicoLabel}</Badge>
                    {!estado.atendido && (
                      <span className="w-2 h-2 rounded-full bg-red-500" title="Aguardando" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-1">
                    {ag.observacao || 'Sem observações'}
                  </p>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Detalhe do chamado */}
        <Card padding="none" className="flex-1 flex flex-col overflow-hidden">
          {chamadoSelecionado && estadoSelecionado ? (
            <>
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-lm-green/10 flex items-center justify-center text-lm-green">
                    <User size={20} />
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-900">{chamadoSelecionado.nome}</h2>
                    <p className="text-xs text-gray-500 flex items-center gap-2">
                      <span>{chamadoSelecionado.servicoLabel}</span>
                      <span className="flex items-center gap-1"><MapPin size={11} /> {chamadoSelecionado.loja.split(' — ')[0]}</span>
                      <span>{chamadoSelecionado.data} às {chamadoSelecionado.horario}</span>
                    </p>
                  </div>
                </div>
                {!estadoSelecionado.atendido && (
                  <button
                    onClick={encerrarChamado}
                    className="text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl transition-colors flex-shrink-0"
                  >
                    Encerrar Chamado
                  </button>
                )}
                {estadoSelecionado.atendido && (
                  <Badge tone="green" className="flex-shrink-0">Atendido</Badge>
                )}
              </div>

              <div className="flex-1 overflow-auto p-6 space-y-4 bg-gray-50/50">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center">
                    <User size={16} />
                  </div>
                  <div className="max-w-[80%] flex flex-col items-start">
                    <div className="px-4 py-3 rounded-2xl text-sm leading-relaxed bg-gray-100 text-gray-800">
                      {chamadoSelecionado.observacao || 'Cliente agendou visita sem deixar observações.'}
                    </div>
                  </div>
                </div>

                {estadoSelecionado.notas.map((nota, i) => (
                  <div key={i} className="flex gap-3 justify-end">
                    <div className="max-w-[80%] flex flex-col items-end">
                      <div className="px-4 py-3 rounded-2xl text-sm leading-relaxed bg-lm-green text-white">
                        {nota.texto}
                      </div>
                      <span className="text-[10px] text-gray-400 mt-1">
                        {new Date(nota.data).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-white border-t border-gray-100">
                <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-2 border border-gray-200 focus-within:border-lm-green focus-within:ring-2 focus-within:ring-lm-green/30 transition-all">
                  <input
                    type="text"
                    value={mensagem}
                    onChange={e => setMensagem(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && enviarNota()}
                    placeholder="Adicionar nota de atendimento..."
                    className="flex-1 bg-transparent border-none outline-none px-3 text-sm text-gray-700"
                  />
                  <button
                    onClick={enviarNota}
                    disabled={!mensagem.trim()}
                    className="bg-lm-green hover:bg-lm-green/90 text-white p-2.5 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 flex-col gap-3">
              <MessageSquare size={48} className="opacity-20" />
              <p>Selecione um chamado para ver os detalhes</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
