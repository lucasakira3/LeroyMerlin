'use client'

import { useState } from 'react'
import { Bot, User, Send, MessageCircleMore } from 'lucide-react'
import Card from './ui/Card'
import type { Projeto } from './ProjetoMosaico'

interface Mensagem {
  role: 'user' | 'ia'
  texto: string
}

interface Props {
  projeto: Projeto
  // Devolve a lista já atualizada pela IA — quem chama (ListaDeCompras) decide como mesclar
  // com o progresso (itens marcados, produto escolhido) que o cliente já tinha.
  onProjetoAtualizado: (novoProjeto: Projeto) => void
}

// Chat pra continuar a conversa DEPOIS que a lista já existe — pedido do usuário (2026-09-27):
// "mesmo após o resultado, caso o cliente queira perguntar ou mandar modificar algo via chat,
// permitir isso". Mesma rota que as perguntas de esclarecimento do início (/api/projeto/
// conversar, ver lib/projetoGuiado.ts), só que chamada em "modo edição" (com `projetoAtual`
// no corpo) — a IA decide sozinha se é só uma pergunta (resposta em texto, lista intocada) ou
// um pedido de mudança de verdade (devolve a lista inteira já atualizada).
export default function ProjetoChat({ projeto, onProjetoAtualizado }: Props) {
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    const texto = input.trim()
    if (!texto || loading) return

    const novoHistorico: Mensagem[] = [...mensagens, { role: 'user', texto }]
    setMensagens(novoHistorico)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/projeto/conversar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ historico: novoHistorico, projetoAtual: projeto }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      if (data.tipo === 'resposta') {
        setMensagens(prev => [...prev, { role: 'ia', texto: data.resposta }])
      } else {
        // "atualizacao" (ou "resultado", se a IA fugir do formato esperado em modo edição) —
        // qualquer um dos dois vem com a lista inteira, trata igual.
        const { tipo: _tipo, resposta, ...projetoAtualizado } = data
        setMensagens(prev => [...prev, { role: 'ia', texto: resposta || 'Pronto, atualizei sua lista.' }])
        onProjetoAtualizado(projetoAtualizado as Projeto)
      }
    } catch (err: any) {
      setMensagens(prev => [...prev, { role: 'ia', texto: 'Não consegui processar agora. Tente de novo em instantes.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-500">
        <MessageCircleMore size={16} className="text-lm-green flex-shrink-0" />
        <div>
          <p className="text-sm font-bold text-gray-900">Converse sobre este projeto</p>
          <p className="text-xs text-gray-500">Tire dúvidas ou peça uma mudança — ex: "troca o vaso por um mais barato"</p>
        </div>
      </div>

      {mensagens.length > 0 && (
        <div className="px-4 py-3 space-y-3 max-h-72 overflow-y-auto">
          {mensagens.map((m, i) => (
            <div key={i} className={`flex gap-2.5 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                m.role === 'user' ? 'bg-gray-200 text-gray-600' : 'bg-lm-green text-white'
              }`}>
                {m.role === 'user' ? <User size={13} /> : <Bot size={13} />}
              </div>
              <div className={`max-w-[80%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === 'user' ? 'bg-lm-green text-white' : 'bg-gray-100 text-gray-800'
              }`}>
                {m.texto}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-2.5">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-lm-green text-white flex items-center justify-center">
                <Bot size={13} />
              </div>
              <div className="bg-gray-100 rounded-2xl px-4 py-2.5 flex gap-1">
                {[0, 1, 2].map(i => (
                  <span key={i} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <form onSubmit={enviar} className="flex items-center gap-2 p-3 border-t border-gray-500">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ex: Por que esse chuveiro? Troca o vaso por um mais barato..."
          disabled={loading}
          className="flex-1 h-10 px-3.5 rounded-xl border border-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-lm-green focus:border-transparent disabled:opacity-50 bg-white"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          aria-label="Enviar"
          className="h-10 w-10 flex-shrink-0 bg-lm-green text-white rounded-xl flex items-center justify-center disabled:opacity-50 hover:bg-green-700 transition-colors"
        >
          <Send size={15} />
        </button>
      </form>
    </Card>
  )
}
