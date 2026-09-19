'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  maxWidthClass?: string
  minHeightClass?: string
}

// Shell de popup genérico (header + fechar + backdrop), pro app não repetir o mesmo
// esqueleto de createPortal toda vez que precisa de um modal novo — mesma técnica já usada
// em ProdutoDrawer.tsx (portal pro document.body escapa do transform residual de
// PageTransition.tsx, ver project-dev-workflow), só que genérico: quem chama só entra com
// título + conteúdo. Conteúdo não ganha padding daqui — cada usuário decide o próprio
// espaçamento interno, já que o conteúdo varia muito de caso pra caso (formulário, lista
// com sidebar, etc).
export default function Modal({ open, onClose, title, children, maxWidthClass = 'md:max-w-lg', minHeightClass = '' }: ModalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!mounted || !open) return null

  return createPortal(
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center md:p-4">
        <div
          className={`bg-white dark:bg-zinc-900 w-full h-full md:h-auto md:max-h-[92vh] ${maxWidthClass} ${minHeightClass} md:rounded-card shadow-soft-lg overflow-hidden flex flex-col`}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-500 dark:border-zinc-800 flex-shrink-0">
            <h2 className="text-base font-bold text-lm-dark dark:text-zinc-50">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Fechar"
              className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 flex-shrink-0"
            >
              <X size={20} />
            </button>
          </div>
          <div className="overflow-y-auto flex-1 min-h-0">{children}</div>
        </div>
      </div>
    </>,
    document.body
  )
}
