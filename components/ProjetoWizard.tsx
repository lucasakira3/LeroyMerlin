'use client'

import { useState, useRef } from 'react'
import {
  Mic, MicOff, Send, RotateCcw, ArrowLeft, Bot, User, Check, Loader2,
} from 'lucide-react'
import ListaDeCompras from './ListaDeCompras'
import { COMODOS_DISPONIVEIS, getIconeComodo } from '@/lib/comodoIcones'
import type { Projeto } from './ProjetoMosaico'

// Etapas do indicador de "carregando" — genéricas de propósito: nesta fase (antes do
// resultado existir) a IA pode devolver uma pergunta de esclarecimento OU a lista pronta, e
// só se sabe qual das duas ao final da chamada. Ver lib/projetoGuiado.ts (conversarProjetoIA).
const ETAPAS = [
  'Lendo sua mensagem...',
  'Consultando o catálogo da loja...',
  'Preparando a resposta...',
]

const PASSOS = ['Cômodos', 'Descrição', 'Resultado']

interface Mensagem {
  role: 'user' | 'ia'
  texto: string
}

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}

// Indicador de progresso 1-2-3 no topo do assistente. `atual` é 1-based.
function Passos({ atual }: { atual: number }) {
  return (
    <ol className="flex items-center gap-2 px-4 pt-4" aria-label="Progresso do projeto">
      {PASSOS.map((nome, i) => {
        const n = i + 1
        const feito = n < atual
        const ativo = n === atual
        return (
          <li key={nome} className="flex items-center gap-2 flex-1 last:flex-none" aria-current={ativo ? 'step' : undefined}>
            <span className={`w-6 h-6 rounded-full text-[11px] font-black flex items-center justify-center flex-shrink-0 transition-colors ${
              feito || ativo ? 'bg-lm-green text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {feito ? <Check size={13} strokeWidth={3} /> : n}
            </span>
            <span className={`text-xs font-semibold ${ativo ? 'text-lm-dark' : 'text-gray-400'}`}>{nome}</span>
            {n < PASSOS.length && <span className={`flex-1 h-0.5 rounded ${feito ? 'bg-lm-green' : 'bg-gray-200'}`} />}
          </li>
        )
      })}
    </ol>
  )
}

// Bolha de mensagem do bot (avatar verde + balão cinza), no mesmo padrão visual de
// components/DuvidasChat.tsx — reaproveitado aqui pra dar ao Projeto Guiado a mesma
// linguagem de "chat" já usada na aba Tire Dúvidas, em vez de um formulário de wizard.
function BolhaBot({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-lm-green text-white flex items-center justify-center">
        <Bot size={16} />
      </div>
      <div className="max-w-[85%] bg-gray-100 rounded-2xl px-4 py-3 text-sm leading-relaxed text-gray-800">
        {children}
      </div>
    </div>
  )
}

function BolhaUsuario({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 flex-row-reverse">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center">
        <User size={16} />
      </div>
      <div className="max-w-[85%] bg-lm-green text-white rounded-2xl px-4 py-3 text-sm leading-relaxed">
        {children}
      </div>
    </div>
  )
}

// Assistente do Projeto Guiado — desde 2026-09-27 é uma CONVERSA de verdade, não mais
// "descreve uma vez, recebe a lista": a IA pode fazer até 2 perguntas de esclarecimento
// (m², o que trocar/manter etc., ver lib/projetoGuiado.ts) antes de gerar a lista. `mensagens`
// guarda essa troca; a rota /api/projeto/conversar decide a cada chamada se a resposta é uma
// pergunta ou o resultado final. Depois de pronta, a conversa continua dentro de
// ListaDeCompras (components/ProjetoChat.tsx) — lá o cliente já vê a lista e pode pedir
// mudanças nela.
export default function ProjetoWizard({ onTotalChange }: { onTotalChange?: (total: number | null) => void }) {
  const [inputTexto, setInputTexto] = useState('')
  const [loading, setLoading] = useState(false)
  const [etapa, setEtapa] = useState('')
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [resultado, setResultado] = useState<Projeto | null>(null)
  const [erro, setErro] = useState('')
  const [ouvindo, setOuvindo] = useState(false)
  const recRef = useRef<SpeechRecognition | null>(null)
  const [etapaWizard, setEtapaWizard] = useState<'comodos' | 'descricao'>('comodos')
  const [comodosSelecionados, setComodosSelecionados] = useState<Set<string>>(new Set())

  function toggleComodo(comodo: string) {
    setComodosSelecionados(prev => {
      const next = new Set(prev)
      next.has(comodo) ? next.delete(comodo) : next.add(comodo)
      return next
    })
  }

  async function enviarMensagem(texto: string) {
    if (!texto.trim() || loading) return
    const novoHistorico: Mensagem[] = [...mensagens, { role: 'user', texto }]
    setMensagens(novoHistorico)
    setInputTexto('')
    setLoading(true)
    setErro('')

    // Simula etapas progressivas para feedback visual — ver comentário no array ETAPAS.
    for (let i = 0; i < ETAPAS.length - 1; i++) {
      setEtapa(ETAPAS[i])
      await new Promise(r => setTimeout(r, 900))
    }
    setEtapa(ETAPAS[ETAPAS.length - 1])

    try {
      const res = await fetch('/api/projeto/conversar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ historico: novoHistorico, comodos: Array.from(comodosSelecionados) }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      if (data.tipo === 'pergunta') {
        setMensagens(prev => [...prev, { role: 'ia', texto: data.pergunta }])
      } else {
        // tipo "resultado" (ou qualquer outra coisa inesperada — trata como resultado final,
        // nunca deixa o cliente preso sem resposta nenhuma).
        const { tipo: _tipo, ...projeto } = data
        setResultado(projeto as Projeto)
      }
    } catch (e: any) {
      setErro(e.message || 'Erro ao processar sua mensagem.')
    } finally {
      setLoading(false)
      setEtapa('')
    }
  }

  function novoProjeto() {
    setResultado(null)
    setMensagens([])
    setInputTexto('')
    setErro('')
    setEtapaWizard('comodos')
    setComodosSelecionados(new Set())
  }

  function voltarParaComodos() {
    setEtapaWizard('comodos')
    setMensagens([])
    setErro('')
  }

  function toggleVoz() {
    if (ouvindo) {
      recRef.current?.stop()
      setOuvindo(false)
      return
    }
    const API = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!API) return
    const rec = new API()
    rec.lang = 'pt-BR'
    rec.onresult = (e: SpeechRecognitionEvent) => {
      setInputTexto(e.results[0][0].transcript)
      setOuvindo(false)
    }
    rec.onend = () => setOuvindo(false)
    rec.start()
    recRef.current = rec
    setOuvindo(true)
  }

  const comodosConfirmados = etapaWizard === 'descricao' || resultado !== null
  const comodosTexto = Array.from(comodosSelecionados).join(', ')
  // Progresso do indicador do topo: 1 cômodos, 2 descrição/conversa, 3 gerando/resultado
  const passoAtual = resultado || loading ? 3 : etapaWizard === 'comodos' ? 1 : 2
  const etapaIdx = Math.max(0, ETAPAS.indexOf(etapa))

  return (
    <div className="flex flex-col flex-1">
      <Passos atual={passoAtual} />

      {/* Transcrição da conversa */}
      <div className="flex-1 p-4 space-y-4">
        <BolhaBot>
          <p>Oi! Vou te ajudar a montar a lista de materiais do seu projeto.</p>
          <p className="mt-1.5 font-semibold">Quais cômodos você vai reformar?</p>
        </BolhaBot>

        {!comodosConfirmados && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {COMODOS_DISPONIVEIS.map(comodo => {
              const Icone = getIconeComodo(comodo)
              const selecionado = comodosSelecionados.has(comodo)
              return (
                <button
                  key={comodo}
                  type="button"
                  onClick={() => toggleComodo(comodo)}
                  aria-pressed={selecionado}
                  className={`relative flex flex-col items-center gap-2 rounded-2xl border-2 px-3 py-5 text-center transition-all hover:-translate-y-0.5 ${
                    selecionado
                      ? 'border-lm-green bg-lm-green/10 shadow-sm'
                      : 'border-gray-500 bg-white hover:border-lm-green/50'
                  }`}
                >
                  {selecionado && (
                    <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-lm-green text-white flex items-center justify-center">
                      <Check size={12} strokeWidth={3} />
                    </span>
                  )}
                  <span className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                    selecionado ? 'bg-lm-green text-white' : 'bg-gray-100 text-lm-green'
                  }`}>
                    <Icone size={24} />
                  </span>
                  <span className="text-xs font-bold text-lm-dark leading-tight">{comodo}</span>
                </button>
              )
            })}
          </div>
        )}

        {comodosConfirmados && (
          <>
            <BolhaUsuario>{comodosTexto}</BolhaUsuario>

            <BolhaBot>
              Entendi! Agora descreva o que você quer fazer nesse espaço — pode escrever ou usar o microfone. Quanto mais detalhe (medidas, orçamento), melhor a lista fica.
            </BolhaBot>
          </>
        )}

        {/* Toda a troca de mensagens desta fase — pode ter idas e vindas se a IA pedir mais
            detalhe antes de montar a lista. */}
        {mensagens.map((m, i) => (
          m.role === 'user'
            ? <BolhaUsuario key={i}>{m.texto}</BolhaUsuario>
            : <BolhaBot key={i}>{m.texto}</BolhaBot>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-lm-green text-white flex items-center justify-center flex-shrink-0">
              <Bot size={16} />
            </div>
            <div className="bg-gray-100 rounded-2xl px-4 py-4 w-full max-w-sm">
              <ul className="space-y-2.5">
                {ETAPAS.map((nome, i) => {
                  const feito = i < etapaIdx
                  const ativo = i === etapaIdx
                  return (
                    <li
                      key={nome}
                      className={`flex items-center gap-2.5 text-sm transition-colors ${
                        feito ? 'text-lm-green' : ativo ? 'text-lm-dark font-semibold' : 'text-gray-400'
                      }`}
                    >
                      <span className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                        {feito ? (
                          <Check size={16} strokeWidth={3} />
                        ) : ativo ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-gray-300" />
                        )}
                      </span>
                      {nome.replace('...', '')}
                    </li>
                  )
                })}
              </ul>
              <div className="mt-3 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className="h-full bg-lm-green rounded-full transition-all duration-700"
                  style={{ width: `${((etapaIdx + 1) / ETAPAS.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {erro && !loading && (
          <BolhaBot>
            <span className="text-red-600">{erro}</span>
          </BolhaBot>
        )}

        {resultado && !loading && (
          <>
            <BolhaBot>Pronto! Aqui está sua lista completa de materiais, com os corredores da loja.</BolhaBot>
            <ListaDeCompras
              projeto={resultado}
              descricaoOriginal={mensagens.filter(m => m.role === 'user').map(m => m.texto).join(' ')}
              onTotalChange={onTotalChange}
            />
          </>
        )}
      </div>

      {/* Barra de ação fixa — muda de controle conforme a etapa, mesma posição do input do DuvidasChat */}
      <div className="border-t border-gray-500 p-4">
        {resultado ? (
          <button
            onClick={novoProjeto}
            className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-lm-green transition-colors"
          >
            <RotateCcw size={14} /> Começar um novo projeto
          </button>
        ) : etapaWizard === 'comodos' ? (
          <div className="flex justify-end">
            <button
              onClick={() => setEtapaWizard('descricao')}
              disabled={comodosSelecionados.size === 0}
              className="bg-lm-green text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continuar
            </button>
          </div>
        ) : (
          <form
            onSubmit={e => { e.preventDefault(); enviarMensagem(inputTexto) }}
            className="flex items-center gap-2"
          >
            <button
              type="button"
              onClick={voltarParaComodos}
              disabled={loading}
              aria-label="Voltar pros cômodos"
              className="h-11 w-11 flex-shrink-0 flex items-center justify-center rounded-xl border border-gray-500 text-gray-400 hover:text-lm-green hover:border-lm-green/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowLeft size={16} />
            </button>
            <button
              type="button"
              onClick={toggleVoz}
              disabled={loading}
              aria-label={ouvindo ? 'Parar de ouvir' : 'Falar'}
              className={`h-11 w-11 flex-shrink-0 flex items-center justify-center rounded-xl border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                ouvindo
                  ? 'bg-red-50 text-red-500 border-red-200 animate-pulse'
                  : 'text-gray-500 border-gray-500 hover:border-lm-green/40 hover:text-lm-green'
              }`}
            >
              {ouvindo ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
            <input
              type="text"
              value={inputTexto}
              onChange={e => setInputTexto(e.target.value)}
              placeholder={mensagens.length === 0 ? 'Ex: Quero reformar meu banheiro de 4m², trocar o piso, azulejo e torneira...' : 'Responda ou dê mais detalhes...'}
              disabled={loading}
              className="flex-1 h-11 px-4 rounded-xl border border-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-lm-green focus:border-transparent disabled:opacity-50 bg-white"
            />
            <button
              type="submit"
              disabled={loading || !inputTexto.trim()}
              aria-label="Enviar"
              className="h-11 w-11 flex-shrink-0 bg-lm-green text-white rounded-xl flex items-center justify-center disabled:opacity-50 hover:bg-green-700 transition-colors"
            >
              <Send size={16} />
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
