'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Scale } from 'lucide-react'
import { getComparador, limparComparador } from '@/lib/clientComparador'
import ComparadorPorFoto from './ComparadorPorFoto'

// Antes essa barra sumia por completo com o comparador vazio — mas isso escondia o único
// lugar combinado pra iniciar a comparação por foto (não dá pra "apontar a câmera" se o
// botão só aparece depois de já ter algo pra comparar). Agora sempre mostra pelo menos o
// atalho de foto; a parte de contagem/"Ver comparação" só entra quando há itens de verdade.
export default function ComparadorBar() {
  const [quantidade, setQuantidade] = useState(0)

  useEffect(() => {
    setQuantidade(getComparador().length)
    const atualizar = () => setQuantidade(getComparador().length)
    window.addEventListener('lm-comparador-change', atualizar)
    return () => window.removeEventListener('lm-comparador-change', atualizar)
  }, [])

  return (
    <div className="flex flex-wrap items-center gap-3 bg-lm-yellow/10 border border-lm-yellow/30 rounded-xl px-4 py-2.5 animate-fade-in">
      {quantidade > 0 ? (
        <>
          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-zinc-200">
            <Scale size={15} className="text-lm-yellow flex-shrink-0" />
            <span className="font-medium">{quantidade} produto{quantidade > 1 ? 's' : ''} para comparar</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => limparComparador()}
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200"
            >
              Limpar
            </button>
            <Link href="/comparar" className="text-xs font-semibold text-lm-green hover:underline">
              Ver comparação →
            </Link>
          </div>
        </>
      ) : (
        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-zinc-200">
          <Scale size={15} className="text-lm-yellow flex-shrink-0" />
          <span className="font-medium">Compare produtos</span>
        </div>
      )}
      <div className="ml-auto">
        <ComparadorPorFoto />
      </div>
    </div>
  )
}
