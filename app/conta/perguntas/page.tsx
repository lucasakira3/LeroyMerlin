'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bot, MessageCircleQuestion } from 'lucide-react'
import { getUsuarioLogado } from '@/lib/clientAuth'
import { getPerguntas, type PerguntaSalva } from '@/lib/clientPerguntas'
import FormattedText from '@/components/ui/FormattedText'

export default function PerguntasPage() {
  const [perguntas, setPerguntas] = useState<PerguntaSalva[] | null>(null)

  useEffect(() => {
    const usuario = getUsuarioLogado()
    if (!usuario) return
    setPerguntas(getPerguntas(usuario.email))
  }, [])

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-1">Minhas perguntas</h1>
      <p className="text-sm text-gray-500 mb-6">
        Perguntas que você fez no chat &quot;Pergunte sobre este produto&quot;, com a resposta da IA.
      </p>

      {perguntas === null && (
        <div className="space-y-2">
          {[0, 1, 2].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      )}

      {perguntas !== null && perguntas.length === 0 && (
        <div className="text-center py-10">
          <MessageCircleQuestion size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">
            Você ainda não fez nenhuma pergunta. Abra um produto e use o chat &quot;Pergunte sobre este produto&quot;.
          </p>
        </div>
      )}

      {perguntas !== null && perguntas.length > 0 && (
        <div className="space-y-3">
          {perguntas.map(p => (
            <div key={p.id} className="bg-white rounded-card shadow-soft border border-gray-500 p-4">
              <div className="flex items-center justify-between mb-2">
                <Link href={`/produto/${p.produtoId}`} className="text-sm font-semibold text-gray-900 hover:text-lm-green truncate">
                  {p.produtoNome}
                </Link>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {new Date(p.data).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <p className="text-sm text-gray-700 mb-2">{p.pergunta}</p>
              <div className="flex items-start gap-2 bg-gray-50 rounded-lg p-3">
                <Bot size={14} className="text-lm-green flex-shrink-0 mt-0.5" />
                <FormattedText text={p.resposta} className="text-sm text-gray-600" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
