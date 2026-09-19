'use client'

import { useState, useRef } from 'react'
import { Mic, MicOff, Send, RotateCcw, ArrowLeft, Bot, User } from 'lucide-react'
import ListaDeCompras from './ListaDeCompras'
import { COMODOS_DISPONIVEIS, getIconeComodo } from '@/lib/comodoIcones'

const EXEMPLOS = [
  'Quero reformar meu banheiro pequeno com orçamento de R$ 3.000',
  'Preciso pintar sala e dois quartos, apartamento de 70m²',
  'Quero instalar um jardim vertical na varanda',
  'Reforma completa da cozinha, troca de piso e azulejo',
  'Quero montar um home office com iluminação profissional',
  'Preciso trocar toda a parte elétrica de uma casa de 80m²',
]

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
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

export default function ProjetoWizard() {
  const [descricao, setDescricao] = useState('')
  const [loading, setLoading] = useState(false)
  const [etapa, setEtapa] = useState('')
  const [resultado, setResultado] = useState<any>(null)
  const [erro, setErro] = useState('')
  const [ouvindo, setOuvindo] = useState(false)
  const recRef = useRef<SpeechRecognition | null>(null)
  const [etapaWizard, setEtapaWizard] = useState<'comodos' | 'descricao'>('comodos')
  const [comodosSelecionados, setComodosSelecionados] = useState<Set<string>>(new Set())
  const [descricaoEnviada, setDescricaoEnviada] = useState('')

  function toggleComodo(comodo: string) {
    setComodosSelecionados(prev => {
      const next = new Set(prev)
      next.has(comodo) ? next.delete(comodo) : next.add(comodo)
      return next
    })
  }

  const ETAPAS = [
    'Lendo seu projeto...',
    'Identificando materiais necessários...',
    'Buscando produtos no estoque...',
    'Montando sua lista de compras...',
  ]

  async function analisar(texto: string) {
    if (!texto.trim()) return
    setDescricaoEnviada(texto)
    setDescricao('')
    setLoading(true)
    setErro('')
    setResultado(null)

    // Simula etapas progressivas para feedback visual
    for (let i = 0; i < ETAPAS.length - 1; i++) {
      setEtapa(ETAPAS[i])
      await new Promise(r => setTimeout(r, 900))
    }
    setEtapa(ETAPAS[ETAPAS.length - 1])

    try {
      const res = await fetch('/api/projeto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descricao: texto, comodos: Array.from(comodosSelecionados) }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResultado(data)
    } catch (e: any) {
      setErro(e.message || 'Erro ao analisar o projeto.')
    } finally {
      setLoading(false)
      setEtapa('')
    }
  }

  function novoProjeto() {
    setResultado(null)
    setDescricao('')
    setDescricaoEnviada('')
    setErro('')
    setEtapaWizard('comodos')
    setComodosSelecionados(new Set())
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
      setDescricao(e.results[0][0].transcript)
      setOuvindo(false)
    }
    rec.onend = () => setOuvindo(false)
    rec.start()
    recRef.current = rec
    setOuvindo(true)
  }

  const comodosConfirmados = etapaWizard === 'descricao' || resultado
  const comodosTexto = Array.from(comodosSelecionados).join(', ')

  return (
    <div className="flex flex-col flex-1">
      {/* Transcrição da conversa */}
      <div className="flex-1 p-4 space-y-4">
        <BolhaBot>
          <p>Oi! Vou te ajudar a montar a lista de materiais do seu projeto.</p>
          <p className="mt-1.5 font-semibold">Quais cômodos você vai reformar?</p>
          {!comodosConfirmados && (
            <div className="flex flex-wrap gap-2 mt-3">
              {COMODOS_DISPONIVEIS.map(comodo => {
                const Icone = getIconeComodo(comodo)
                const selecionado = comodosSelecionados.has(comodo)
                return (
                  <button
                    key={comodo}
                    type="button"
                    onClick={() => toggleComodo(comodo)}
                    aria-pressed={selecionado}
                    className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                      selecionado
                        ? 'bg-lm-green text-white border-lm-green'
                        : 'bg-white text-gray-600 border-gray-500 hover:border-lm-green/40'
                    }`}
                  >
                    <Icone size={14} className="flex-shrink-0" />
                    {comodo}
                  </button>
                )
              })}
            </div>
          )}
        </BolhaBot>

        {comodosConfirmados && (
          <>
            <BolhaUsuario>{comodosTexto}</BolhaUsuario>

            <BolhaBot>
              Entendi! Agora descreva o que você quer fazer nesse espaço — pode escrever ou usar o microfone. Quanto mais detalhe (medidas, orçamento), melhor a lista fica.
            </BolhaBot>
          </>
        )}

        {descricaoEnviada && <BolhaUsuario>{descricaoEnviada}</BolhaUsuario>}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-lm-green text-white flex items-center justify-center flex-shrink-0">
              <Bot size={16} />
            </div>
            <div className="bg-gray-100 rounded-2xl px-4 py-3">
              <div className="flex gap-1 mb-1.5">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <p className="text-xs text-gray-500">{etapa}</p>
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
            <ListaDeCompras projeto={resultado} descricaoOriginal={descricaoEnviada} />
          </>
        )}
      </div>

      {/* Sugestões rápidas — só antes do primeiro envio, mesmo padrão do DuvidasChat */}
      {etapaWizard === 'descricao' && !descricaoEnviada && !loading && (
        <div className="px-4 pb-3">
          <p className="text-xs text-gray-400 mb-2">Ou escolha um exemplo:</p>
          <div className="flex flex-wrap gap-2">
            {EXEMPLOS.map(ex => (
              <button
                key={ex}
                onClick={() => { setDescricao(ex); analisar(ex) }}
                className="text-xs px-3 py-1.5 bg-lm-green/10 text-lm-green border border-lm-green/20 rounded-full hover:bg-lm-green/20 transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      )}

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
            onSubmit={e => { e.preventDefault(); analisar(descricao) }}
            className="flex items-center gap-2"
          >
            <button
              type="button"
              onClick={() => setEtapaWizard('comodos')}
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
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              placeholder="Ex: Quero reformar meu banheiro de 4m², trocar o piso, azulejo e torneira..."
              disabled={loading}
              className="flex-1 h-11 px-4 rounded-xl border border-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-lm-green focus:border-transparent disabled:opacity-50 bg-white"
            />
            <button
              type="submit"
              disabled={loading || !descricao.trim()}
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
