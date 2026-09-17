'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Send, Headset, User, Clock, LogIn } from 'lucide-react'
import { getUsuarioLogado } from '@/lib/clientAuth'
import {
  getConversa, enviarMensagemEspecialista, type ConversaEspecialista as Conversa,
} from '@/lib/conversasEspecialista'

// Chat de verdade com um funcionário da loja (sem IA) — mensagens ficam salvas em
// lib/conversasEspecialista.ts e aparecem no lado do funcionário em
// /funcionario/chamados. Exige login (diferente do chat com o robô) porque o e-mail é a
// única forma de o funcionário saber quem está falando e responder depois.
export default function ConversaEspecialista() {
  const [email, setEmail] = useState<string | null>(null)
  const [nome, setNome] = useState('')
  const [conversa, setConversa] = useState<Conversa | null>(null)
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const usuario = getUsuarioLogado()
    if (!usuario) return
    setEmail(usuario.email)
    setNome(usuario.nome ?? usuario.email)
    setConversa(getConversa(usuario.email))

    const atualizar = () => setConversa(getConversa(usuario.email))
    window.addEventListener('lm-conversa-especialista-change', atualizar)
    window.addEventListener('storage', atualizar)
    return () => {
      window.removeEventListener('lm-conversa-especialista-change', atualizar)
      window.removeEventListener('storage', atualizar)
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversa?.mensagens.length])

  function enviar() {
    const texto = input.trim()
    if (!texto || !email) return
    enviarMensagemEspecialista(email, nome, 'cliente', texto)
    setInput('')
    setConversa(getConversa(email))
  }

  if (!email) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-lm-green/10 text-lm-green flex items-center justify-center">
          <Headset size={22} />
        </div>
        <p className="text-sm font-semibold text-lm-dark">Entre na sua conta pra falar com um especialista</p>
        <p className="text-xs text-gray-500 max-w-xs">
          Assim o funcionário sabe quem está perguntando e consegue te responder depois, mesmo que você saia da página.
        </p>
        <Link
          href="/funcionario/login"
          className="flex items-center gap-2 bg-lm-green text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-green-700 transition-colors mt-1"
        >
          <LogIn size={15} /> Entrar
        </Link>
      </div>
    )
  }

  const mensagens = conversa?.mensagens ?? []

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {mensagens.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">
              Mande sua dúvida — um funcionário da loja vai te responder por aqui.
            </p>
          </div>
        )}
        {mensagens.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.autor === 'cliente' ? 'flex-row-reverse' : ''}`}>
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              msg.autor === 'funcionario' ? 'bg-lm-green text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {msg.autor === 'funcionario' ? <Headset size={16} /> : <User size={16} />}
            </div>
            <div className={`max-w-[80%] ${msg.autor === 'cliente' ? 'items-end' : 'items-start'} flex flex-col`}>
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.autor === 'funcionario' ? 'bg-gray-100 text-gray-800' : 'bg-lm-green text-white'
              }`}>
                {msg.texto}
              </div>
              <span className="text-[10px] text-gray-400 mt-1 px-1">
                {new Date(msg.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        {mensagens.length > 0 && !conversa?.atendida && mensagens[mensagens.length - 1].autor === 'cliente' && (
          <div className="flex items-center gap-1.5 text-xs text-gray-400 pl-11">
            <Clock size={12} /> Aguardando resposta de um funcionário...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-gray-200 p-4">
        <form onSubmit={e => { e.preventDefault(); enviar() }} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Digite sua dúvida..."
            className="flex-1 h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-lm-green focus:border-transparent bg-white"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="h-11 w-11 bg-lm-green text-white rounded-xl flex items-center justify-center disabled:opacity-50 hover:bg-green-700 transition-colors flex-shrink-0"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  )
}
