"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Scale, X, Sparkles } from 'lucide-react'
import useProductTracker from '@/lib/hooks/useProductTracker'

export default function CompareToast() {
  const router = useRouter()
  const { visible, categoryName, accept, dismiss } = useProductTracker()
  const [active, setActive] = useState(false)

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => setActive(true), 50)
      const autoDismiss = setTimeout(() => {
        dismiss()
      }, 15000)

      return () => {
        clearTimeout(timer)
        clearTimeout(autoDismiss)
      }
    }
    setActive(false)
  }, [visible])

  if (!visible) return null

  const handleAccept = () => {
    const ids = accept()
    if (ids?.length) {
      router.push(`/comparar?ids=${ids.join(',')}`)
    }
  }

  return (
    <div
      aria-live="polite"
      className={`fixed z-50 left-4 right-4 bottom-4 sm:left-auto sm:right-6 sm:bottom-6 sm:w-96 transform transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) ${
        active
          ? 'translate-y-0 opacity-100 scale-100'
          : 'translate-y-12 opacity-0 scale-95 pointer-events-none'
      }`}
    >
      <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-gray-100 dark:border-zinc-800 shadow-soft-lg rounded-2xl p-5 relative overflow-hidden" style={{ boxShadow: '0 12px 40px -4px rgba(0, 0, 0, 0.12)' }}>
        <div className="absolute top-0 left-0 right-0 h-1 bg-lm-green" />

        <button
          onClick={dismiss}
          className="absolute top-4 right-4 p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Fechar notificação"
        >
          <X size={16} />
        </button>

        <div className="flex gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-lm-green/10 flex items-center justify-center text-lm-green">
            <Sparkles size={20} className="animate-pulse" />
          </div>

          <div className="flex-1 min-w-0 pr-4">
            <h4 className="text-sm font-bold text-gray-900 dark:text-zinc-50 flex items-center gap-1.5 mb-1">
              Assistente de Compra
              <span className="inline-block px-1.5 py-0.5 text-[10px] font-semibold text-lm-green bg-lm-green/10 rounded-full">
                Comparação
              </span>
            </h4>
            <p className="text-xs text-gray-600 dark:text-zinc-300 leading-relaxed mb-4">
              Notei que você está analisando opções em <strong className="font-semibold text-lm-green">{categoryName}</strong>. Quer ver uma comparação completa dos últimos produtos que você olhou?
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={handleAccept}
                className="flex-1 flex items-center justify-center gap-1.5 bg-lm-green text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-green-700 dark:hover:bg-green-600 transition-colors shadow-sm cursor-pointer"
              >
                <Scale size={13} />
                Sim, me ajude
              </button>
              <button
                onClick={dismiss}
                className="flex-1 text-center bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-600 dark:text-zinc-300 text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
              >
                Não, obrigado
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
