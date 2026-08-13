"use client"

import { useEffect, useState } from 'react'
import { Scale, X } from 'lucide-react'
import useSuggestAgent from '@/lib/hooks/useSuggestAgent'

export default function SuggestBanner() {
  const { visible, category, dismiss, openComparador } = useSuggestAgent()
  const [active, setActive] = useState(false)

  useEffect(() => {
    if (visible) {
      requestAnimationFrame(() => setActive(true))
    } else {
      setActive(false)
    }
  }, [visible])

  if (!visible) return null

  return (
    <div
      aria-live="polite"
      className={`fixed right-4 z-40 flex items-center gap-3 max-w-[340px] bg-white/95 backdrop-blur-sm border border-gray-100 shadow-soft rounded-full px-4 py-2 transform transition-all duration-300 ${
        active ? 'translate-x-0 translate-y-0 opacity-100' : 'translate-x-8 -translate-y-2 opacity-0'
      }`}
      style={{ top: '72px', boxShadow: '0 12px 28px rgba(15,23,42,0.12)' }}
    >
      <div className="flex-shrink-0">
        <Scale size={18} className="text-lm-yellow" />
      </div>

      <div className="flex-1 leading-tight min-w-0">
        <div className="text-sm font-semibold text-gray-800">Olá — precisa de ajuda?</div>
        <div className="text-xs text-gray-500 truncate">
          Fiz uma comparação para facilitar {category ? `(${category})` : ''}.
        </div>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          openComparador()
        }}
        className="ml-2 px-3 py-1 rounded-full bg-lm-green text-white text-sm font-semibold hover:bg-green-600 transition-colors"
      >
        Ver
      </button>

      <button
        type="button"
        onClick={dismiss}
        aria-label="Fechar"
        className="ml-1 text-gray-400 hover:text-gray-600"
      >
        <X size={14} />
      </button>
    </div>
  )
}
