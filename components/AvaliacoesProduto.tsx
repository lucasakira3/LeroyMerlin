'use client'

import { useEffect, useState } from 'react'
import { getUsuarioLogado } from '@/lib/clientAuth'
import { getAvaliacoes, getAvaliacaoDoUsuario, salvarAvaliacao, type Avaliacao } from '@/lib/clientAvaliacoes'
import StarRating from './ui/StarRating'

function mascararEmail(email: string): string {
  const [nome, dominio] = email.split('@')
  if (!dominio) return email
  return `${nome.slice(0, 3)}***@${dominio}`
}

export default function AvaliacoesProduto({ produtoId }: { produtoId: string }) {
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([])
  const [usuario, setUsuario] = useState<{ email: string } | null>(null)
  const [notaForm, setNotaForm] = useState(0)
  const [comentarioForm, setComentarioForm] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    const logado = getUsuarioLogado()
    setUsuario(logado)
    setAvaliacoes(getAvaliacoes(produtoId))

    if (logado) {
      const existente = getAvaliacaoDoUsuario(produtoId, logado.email)
      setNotaForm(existente?.nota ?? 0)
      setComentarioForm(existente?.comentario ?? '')
    } else {
      setNotaForm(0)
      setComentarioForm('')
    }
  }, [produtoId])

  const { media, total } = (() => {
    if (avaliacoes.length === 0) return { media: 0, total: 0 }
    const soma = avaliacoes.reduce((acc, a) => acc + a.nota, 0)
    return { media: soma / avaliacoes.length, total: avaliacoes.length }
  })()

  const jaAvaliou = usuario ? avaliacoes.some(a => a.email === usuario.email) : false

  function enviar() {
    if (!usuario || enviando) return
    setEnviando(true)
    salvarAvaliacao(produtoId, usuario.email, notaForm, comentarioForm)
    setAvaliacoes(getAvaliacoes(produtoId))
    setEnviando(false)
  }

  const ordenadas = [...avaliacoes].sort((a, b) => b.data.localeCompare(a.data))

  return (
    <div className="px-5 py-4">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
        Avaliações
      </h3>

      <div className="flex items-center gap-2 mb-4">
        <StarRating value={media} size={18} />
        {total > 0 ? (
          <span className="text-sm text-gray-600">{media.toFixed(1)} · {total} avaliação{total > 1 ? 'ões' : ''}</span>
        ) : (
          <span className="text-sm text-gray-400 italic">Seja o primeiro a avaliar este produto</span>
        )}
      </div>

      {!usuario && (
        <p className="text-xs text-gray-400 italic mb-4">Faça login para avaliar este produto.</p>
      )}

      {usuario && (
        <div className="mb-4 p-3 rounded-xl bg-gray-50 flex flex-col gap-2">
          <StarRating value={notaForm} onChange={setNotaForm} size={22} />
          <textarea
            value={comentarioForm}
            onChange={e => setComentarioForm(e.target.value)}
            placeholder="Comentário (opcional)"
            rows={2}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-lm-green/30 resize-none bg-white"
          />
          <button
            onClick={enviar}
            disabled={enviando}
            className="self-start px-4 py-1.5 rounded-lg bg-lm-green text-white text-xs font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {jaAvaliou ? 'Atualizar avaliação' : 'Enviar avaliação'}
          </button>
        </div>
      )}

      {ordenadas.length > 0 && (
        <div className="space-y-3">
          {ordenadas.map((a, i) => (
            <div key={i} className="border-t border-gray-100 pt-3 first:border-t-0 first:pt-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <StarRating value={a.nota} size={13} />
                <span className="text-[11px] text-gray-400">{new Date(a.data).toLocaleDateString('pt-BR')}</span>
              </div>
              {a.comentario && <p className="text-sm text-gray-600 leading-relaxed mb-1">{a.comentario}</p>}
              <p className="text-[11px] text-gray-400">{mascararEmail(a.email)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
