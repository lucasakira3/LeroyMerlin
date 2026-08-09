'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Phone, MessageCircle } from 'lucide-react'

interface Mensagem {
  tipo: 'usuario' | 'especialista'
  texto: string
  hora: string
}

const sugestoes = [
  'Como instalar um chuveiro elétrico?',
  'Qual tinta usar em área úmida?',
  'Diferença entre porcelanato e cerâmica',
  'Como calcular tinta para uma parede?',
  'Qual disjuntor usar para ar-condicionado?',
]

export default function DuvidasChat() {
  const [mensagens, setMensagens] = useState<Mensagem[]>([
    {
      tipo: 'especialista',
      texto: 'Olá! Sou o assistente especialista da Leroy Merlin. Como posso te ajudar hoje? Pode me perguntar sobre produtos, instalações, materiais ou qualquer dúvida sobre sua obra ou reforma.',
      hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens])

  const enviar = async (texto: string) => {
    if (!texto.trim() || loading) return

    const hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    setMensagens((m) => [...m, { tipo: 'usuario', texto, hora }])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/duvidas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pergunta: texto }),
      })
      const data = await res.json()
      setMensagens((m) => [
        ...m,
        {
          tipo: 'especialista',
          texto: data.resposta || data.error || 'Não consegui processar sua pergunta.',
          hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        },
      ])
    } catch {
      setMensagens((m) => [
        ...m,
        { tipo: 'especialista', texto: 'Serviço temporariamente indisponível. Tente novamente.', hora },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {mensagens.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.tipo === 'usuario' ? 'flex-row-reverse' : ''}`}>
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              msg.tipo === 'especialista' ? 'bg-lm-green text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {msg.tipo === 'especialista' ? <Bot size={16} /> : <User size={16} />}
            </div>
            <div className={`max-w-[80%] ${msg.tipo === 'usuario' ? 'items-end' : 'items-start'} flex flex-col`}>
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.tipo === 'especialista'
                  ? 'bg-gray-100 text-gray-800'
                  : 'bg-lm-green text-white'
              }`}>
                {msg.texto}
              </div>
              <span className="text-[10px] text-gray-400 mt-1 px-1">{msg.hora}</span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-lm-green text-white flex items-center justify-center flex-shrink-0">
              <Bot size={16} />
            </div>
            <div className="bg-gray-100 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {mensagens.length <= 1 && (
        <div className="px-4 pb-3">
          <p className="text-xs text-gray-400 mb-2">Perguntas frequentes:</p>
          <div className="flex flex-wrap gap-2">
            {sugestoes.map((s) => (
              <button
                key={s}
                onClick={() => enviar(s)}
                className="text-xs px-3 py-1.5 bg-lm-green/10 text-lm-green border border-lm-green/20 rounded-full hover:bg-lm-green/20 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-100 p-4">
        <form
          onSubmit={(e) => { e.preventDefault(); enviar(input) }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua dúvida..."
            disabled={loading}
            className="flex-1 h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-lm-green focus:border-transparent disabled:opacity-50 bg-white"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="h-11 w-11 bg-lm-green text-white rounded-xl flex items-center justify-center disabled:opacity-50 hover:bg-green-700 transition-colors"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  )
}
