'use client'

import { useState, useRef } from 'react'
import { Mic, MicOff, Sparkles, Send, RotateCcw } from 'lucide-react'
import ListaDeCompras from './ListaDeCompras'
import Card from './ui/Card'
import Button from './ui/Button'

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

export default function ProjetoWizard() {
  const [descricao, setDescricao] = useState('')
  const [loading, setLoading] = useState(false)
  const [etapa, setEtapa] = useState('')
  const [resultado, setResultado] = useState<any>(null)
  const [erro, setErro] = useState('')
  const [ouvindo, setOuvindo] = useState(false)
  const recRef = useRef<SpeechRecognition | null>(null)

  const ETAPAS = [
    'Lendo seu projeto...',
    'Identificando materiais necessários...',
    'Buscando produtos no estoque...',
    'Montando sua lista de compras...',
  ]

  async function analisar(texto: string) {
    if (!texto.trim()) return
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
        body: JSON.stringify({ descricao: texto }),
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

  if (resultado) {
    return (
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { setResultado(null); setDescricao('') }}
          className="mb-5"
        >
          <RotateCcw size={14} /> Novo projeto
        </Button>
        <ListaDeCompras projeto={resultado} descricaoOriginal={descricao} />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Hero */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-lm-green/10 text-lm-green border border-lm-green/20 px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
          <Sparkles size={14} /> Powered by Gemini AI
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Descreva seu projeto
        </h2>
        <p className="text-gray-500 text-sm">
          A IA analisa o que você precisa e monta a lista completa de materiais com os corredores da loja.
        </p>
      </div>

      {/* Input principal */}
      <Card className="mb-5 focus-within:ring-2 focus-within:ring-lm-green/30 transition-shadow">
        <textarea
          value={descricao}
          onChange={e => setDescricao(e.target.value)}
          placeholder="Ex: Quero reformar meu banheiro de 4m², trocar o piso, azulejo e torneira. Meu orçamento é de R$ 2.500..."
          rows={4}
          className="w-full text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none"
        />
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-2">
          <button
            onClick={toggleVoz}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              ouvindo
                ? 'bg-red-50 text-red-500 border-red-200 animate-pulse'
                : 'text-gray-500 border-gray-200 hover:border-lm-green/40 hover:text-lm-green'
            }`}
          >
            {ouvindo ? <MicOff size={13} /> : <Mic size={13} />}
            {ouvindo ? 'Ouvindo...' : 'Falar'}
          </button>
          <Button
            variant="primary"
            onClick={() => analisar(descricao)}
            disabled={!descricao.trim() || loading}
          >
            <Send size={14} />
            Analisar projeto
          </Button>
        </div>
      </Card>

      {/* Loading */}
      {loading && (
        <Card className="text-center mb-5">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-14 h-14 border-4 border-lm-green/20 border-t-lm-green rounded-full animate-spin" />
              <Sparkles size={20} className="text-lm-green absolute inset-0 m-auto" />
            </div>
          </div>
          <p className="text-sm font-semibold text-gray-900 mb-1">{etapa}</p>
          <div className="flex justify-center gap-1.5 mt-3">
            {ETAPAS.map((e, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${
                e === etapa ? 'w-6 bg-lm-green' : ETAPAS.indexOf(etapa) > i ? 'w-3 bg-lm-green/40' : 'w-3 bg-gray-200'
              }`} />
            ))}
          </div>
        </Card>
      )}

      {/* Erro */}
      {erro && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600 mb-5">
          {erro}
        </div>
      )}

      {/* Exemplos */}
      {!loading && (
        <Card>
          <p className="text-xs text-gray-400 font-medium mb-3 text-center">Ou escolha um exemplo:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {EXEMPLOS.map(ex => (
              <button
                key={ex}
                onClick={() => { setDescricao(ex); analisar(ex) }}
                className="text-left text-xs text-gray-600 bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-lm-green hover:text-lm-green hover:bg-lm-green/5 transition-all"
              >
                {ex}
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
