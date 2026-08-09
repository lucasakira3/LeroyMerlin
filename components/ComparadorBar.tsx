'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Scale } from 'lucide-react'
import { getComparador, limparComparador } from '@/lib/clientComparador'

export default function ComparadorBar() {
  const [quantidade, setQuantidade] = useState(0)

  useEffect(() => {
    setQuantidade(getComparador().length)
    const atualizar = () => setQuantidade(getComparador().length)
    window.addEventListener('lm-comparador-change', atualizar)
    return () => window.removeEventListener('lm-comparador-change', atualizar)
  }, [])

  if (quantidade === 0) return null

  return (
    <div className="flex items-center justify-between gap-3 bg-lm-yellow/10 border border-lm-yellow/30 rounded-xl px-4 py-2.5 animate-fade-in">
      <div className="flex items-center gap-2 text-sm text-gray-700">
        <Scale size={15} className="text-lm-yellow flex-shrink-0" />
        <span className="font-medium">{quantidade} produto{quantidade > 1 ? 's' : ''} para comparar</span>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <button
          onClick={() => limparComparador()}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          Limpar
        </button>
        <Link href="/comparar" className="text-xs font-semibold text-lm-green hover:underline">
          Ver comparação →
        </Link>
      </div>
    </div>
  )
}
