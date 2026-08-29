'use client'

import { useEffect, useRef, useState } from 'react'
import { Undo2, X } from 'lucide-react'
import { subscribeToast, type ToastState } from '@/lib/toast'

const DURACAO_MS = 4000

export default function UndoToast() {
  const [toast, setToast] = useState<ToastState | null>(null)
  const [active, setActive] = useState(false)
  const hideTimer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => subscribeToast(setToast), [])

  useEffect(() => {
    if (!toast) {
      setActive(false)
      return
    }
    clearTimeout(hideTimer.current)
    const show = setTimeout(() => setActive(true), 20)
    hideTimer.current = setTimeout(() => setActive(false), DURACAO_MS)
    return () => {
      clearTimeout(show)
      clearTimeout(hideTimer.current)
    }
  }, [toast])

  if (!toast) return null

  function handleUndo() {
    toast?.onUndo?.()
    setActive(false)
  }

  return (
    <div
      aria-live="polite"
      className={`fixed z-50 left-1/2 -translate-x-1/2 bottom-4 sm:bottom-6 transition-all duration-300 ${
        active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
      }`}
    >
      <div className="flex items-center gap-3 bg-gray-900 text-white text-sm px-4 py-3 rounded-xl shadow-soft-lg">
        <span className="whitespace-nowrap">{toast.message}</span>
        {toast.onUndo && (
          <button
            onClick={handleUndo}
            className="flex items-center gap-1 text-lm-green font-bold hover:underline flex-shrink-0"
          >
            <Undo2 size={14} /> Desfazer
          </button>
        )}
        <button
          onClick={() => setActive(false)}
          aria-label="Fechar"
          className="text-white/50 hover:text-white flex-shrink-0"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
