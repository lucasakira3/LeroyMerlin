'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Bell } from 'lucide-react'
import { getUsuarioLogado } from '@/lib/clientAuth'
import {
  getNotificacoes,
  marcarComoLida,
  marcarTodasComoLidas,
  type Notificacao,
} from '@/lib/clientNotificacoes'

function tempoRelativo(iso: string): string {
  const diffMin = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (diffMin < 1) return 'agora'
  if (diffMin < 60) return `há ${diffMin}min`
  const horas = Math.floor(diffMin / 60)
  if (horas < 24) return `há ${horas}h`
  return `há ${Math.floor(horas / 24)}d`
}

export default function NotificacoesBell() {
  const [email, setEmail] = useState<string | null>(null)
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [quantidade, setQuantidade] = useState(0)
  const [aberto, setAberto] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setEmail(getUsuarioLogado()?.email ?? null)
  }, [])

  useEffect(() => {
    if (!email) return
    const emailAtual = email
    const atualizar = () => {
      const lista = getNotificacoes(emailAtual)
      setNotificacoes(lista)
      setQuantidade(lista.filter(n => !n.lida).length)
    }
    atualizar()
    window.addEventListener('lm-notificacoes-change', atualizar)
    return () => window.removeEventListener('lm-notificacoes-change', atualizar)
  }, [email])

  useEffect(() => {
    if (!aberto) return
    function aoClicarFora(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setAberto(false)
      }
    }
    function aoApertarTecla(e: KeyboardEvent) {
      if (e.key === 'Escape') setAberto(false)
    }
    document.addEventListener('mousedown', aoClicarFora)
    document.addEventListener('keydown', aoApertarTecla)
    return () => {
      document.removeEventListener('mousedown', aoClicarFora)
      document.removeEventListener('keydown', aoApertarTecla)
    }
  }, [aberto])

  if (!email) return null
  const emailAtual = email

  function abrirNotificacao(n: Notificacao) {
    marcarComoLida(emailAtual, n.id)
    setAberto(false)
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setAberto(v => !v)}
        aria-label={`Notificações${quantidade > 0 ? ` (${quantidade} ${quantidade === 1 ? 'não lida' : 'não lidas'})` : ''}`}
        aria-haspopup="true"
        aria-expanded={aberto}
        className="relative flex items-center justify-center w-10 h-10 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
      >
        <Bell size={19} />
        {quantidade > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {quantidade > 9 ? '9+' : quantidade}
          </span>
        )}
      </button>

      {aberto && (
        <div className="absolute left-0 md:left-auto md:right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] max-h-96 overflow-y-auto bg-white rounded-xl shadow-lg border border-gray-100 z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-sm font-bold text-lm-dark">Notificações</span>
            {quantidade > 0 && (
              <button
                type="button"
                onClick={() => marcarTodasComoLidas(emailAtual)}
                className="text-xs font-semibold text-lm-green hover:underline"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          {notificacoes.length === 0 ? (
            <p className="px-4 py-8 text-sm text-gray-400 text-center">Nenhuma notificação por enquanto</p>
          ) : (
            <ul>
              {notificacoes.map((n) => (
                <li key={n.id}>
                  <Link
                    href={n.href?.startsWith('/') ? n.href : '/conta'}
                    onClick={() => abrirNotificacao(n)}
                    className={`flex items-start gap-2 px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors ${
                      n.lida ? 'bg-white' : 'bg-lm-green/5'
                    }`}
                  >
                    {!n.lida && <span className="w-1.5 h-1.5 rounded-full bg-lm-green mt-1.5 flex-shrink-0" />}
                    <div className={n.lida ? 'pl-3.5' : ''}>
                      <p className="text-xs font-semibold text-lm-dark">{n.titulo}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{n.mensagem}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{tempoRelativo(n.criadaEm)}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
