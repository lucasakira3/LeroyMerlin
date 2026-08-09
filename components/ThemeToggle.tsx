'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

const VARIANT_CLASSES = {
  onDark: 'text-white/80 hover:text-white hover:bg-white/10',
  onLight: 'text-gray-500 dark:text-gray-400 hover:text-lm-green hover:bg-lm-green/10',
}

interface ThemeToggleProps {
  variant?: keyof typeof VARIANT_CLASSES
}

export default function ThemeToggle({ variant = 'onDark' }: ThemeToggleProps) {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'))
  }, [])

  function toggle() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('lm-theme', next ? 'dark' : 'light')
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Ativar modo claro' : 'Ativar modo escuro'}
      title={dark ? 'Modo claro' : 'Modo escuro'}
      className={`flex items-center justify-center w-9 h-9 rounded-xl transition-colors flex-shrink-0 ${VARIANT_CLASSES[variant]}`}
    >
      {dark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  )
}
