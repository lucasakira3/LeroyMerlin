"use client"

import { useEffect, useState } from 'react'

// Segunda implementação, independente e paralela, da MESMA ideia de useProductTracker.ts:
// sugerir comparar produtos após visitas repetidas na mesma categoria. Essa aqui alimenta
// SuggestBanner.tsx (pushView chamado por TrackProduct.tsx); useProductTracker.ts alimenta
// CompareToast.tsx — os dois rodam ao mesmo tempo no app hoje, não é uma substituindo a
// outra. Critério aqui é mais simples (3 visitas seguidas na mesma categoria, sem agrupar
// categorias parecidas como useProductTracker.ts faz) e sem o delay de 10s antes de aparecer.
type AgentState = {
  history: string[]
  suggestedCategory?: string | null
  dismissedCategory?: string | null
}

const STORAGE_KEY = 'lm-suggest-agent'
const HISTORY_LIMIT = 20
const SUGGEST_THRESHOLD = 3

function readState(): AgentState {
  if (typeof window === 'undefined') return { history: [] }
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : { history: [] }
  } catch {
    return { history: [] }
  }
}

function writeState(state: AgentState) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    window.dispatchEvent(new CustomEvent('lm-suggest-agent-change'))
  } catch {}
}

export function pushView(category: string) {
  if (typeof window === 'undefined') return

  const state = readState()
  const history = [...state.history, category].slice(-HISTORY_LIMIT)
  const tail = history.slice(-SUGGEST_THRESHOLD)

  let suggestedCategory: string | null = state.suggestedCategory ?? null

  if (
    tail.length === SUGGEST_THRESHOLD &&
    tail.every((item) => item === category) &&
    state.dismissedCategory !== category
  ) {
    suggestedCategory = category
  }

  writeState({ history, suggestedCategory, dismissedCategory: state.dismissedCategory ?? null })
}

export default function useSuggestAgent() {
  const [visible, setVisible] = useState(false)
  const [category, setCategory] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const sync = () => {
      const state = readState()
      setCategory(state.suggestedCategory ?? null)
      setVisible(Boolean(state.suggestedCategory))
    }

    sync()
    window.addEventListener('lm-suggest-agent-change', sync)
    return () => window.removeEventListener('lm-suggest-agent-change', sync)
  }, [])

  function dismiss() {
    if (typeof window === 'undefined') return
    const state = readState()
    const dismissed = state.suggestedCategory ?? null
    writeState({ ...state, suggestedCategory: null, dismissedCategory: dismissed })
  }

  function openComparador() {
    if (typeof window === 'undefined') return
    const state = readState()
    writeState({ ...state, suggestedCategory: null, dismissedCategory: state.dismissedCategory ?? null })
    window.location.assign('/comparar')
  }

  return { visible, category, dismiss, openComparador }
}
