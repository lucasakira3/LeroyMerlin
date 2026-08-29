"use client"

import { useEffect, useState } from 'react'

// Agente "proativo": rastreia produtos vistos numa sessão (sessionStorage, não persiste
// entre sessões) e, se o cliente olhar 3+ produtos da MESMA categoria seguidos, sugere
// compará-los (toast disparado por CompareToast.tsx após um delay de 10s, ver
// trackProductView). Máquina de estados simples: idle -> pending -> triggered ->
// dismissed/accepted, guardada em sessionStorage pra sobreviver a um reload durante o delay.
export interface VisitedProduct {
  id: string
  nome: string
  categoriaId: string
  categoriaNome: string
}

export type ToastStatus = 'idle' | 'pending' | 'triggered' | 'dismissed' | 'accepted'

export const DEMO_MODE = true

const HISTORY_KEY = 'lm-product-history'
const STATUS_KEY = 'lm-product-tracker-status'
const SUGGESTED_CAT_KEY = 'lm-product-tracker-suggested-cat'
const SUGGESTED_IDS_KEY = 'lm-product-tracker-suggested-ids'

const HISTORY_LIMIT = 20

// Agrupa ferramentas, ferragens e máquinas na mesma categoria de comparação
export function getCategoriaNormalizada(categoria: string): string {
  const cat = categoria.toLowerCase().trim()
  if (cat.includes('ferramenta') || cat.includes('ferragem') || cat.includes('máquina')) {
    return 'ferramentas-grupo'
  }
  return cat
}

function readHistory(): VisitedProduct[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = sessionStorage.getItem(HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeHistory(history: VisitedProduct[]) {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-HISTORY_LIMIT)))
  } catch {}
}

function getToastStatus(): ToastStatus {
  if (typeof window === 'undefined') return 'idle'
  try {
    return (sessionStorage.getItem(STATUS_KEY) as ToastStatus) || 'idle'
  } catch {
    return 'idle'
  }
}

function setToastStatus(status: ToastStatus) {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(STATUS_KEY, status)
  } catch {}
}

function getSuggestedCategory(): string | null {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem(SUGGESTED_CAT_KEY)
}

function setSuggestedCategory(cat: string | null) {
  if (typeof window === 'undefined') return
  if (cat === null) {
    sessionStorage.removeItem(SUGGESTED_CAT_KEY)
  } else {
    sessionStorage.setItem(SUGGESTED_CAT_KEY, cat)
  }
}

function getSuggestedIds(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = sessionStorage.getItem(SUGGESTED_IDS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function setSuggestedIds(ids: string[]) {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(SUGGESTED_IDS_KEY, JSON.stringify(ids))
  } catch {}
}

function notifyStateChange() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('lm-product-tracker-change'))
}

export function trackProductView(product: { id: string; nome: string; categoria: string }) {
  if (typeof window === 'undefined') return

  let history = readHistory()
  const lastVisited = history[history.length - 1]

  if (lastVisited) {
    const lastCatNorm = getCategoriaNormalizada(lastVisited.categoriaNome)
    const newCatNorm = getCategoriaNormalizada(product.categoria)

    if (lastCatNorm !== newCatNorm) {
      clearProductHistory()
      history = []
    }
  }

  const status = getToastStatus()
  if (status !== 'idle') return

  if (lastVisited && lastVisited.id === product.id) return

  const normalizedCat = getCategoriaNormalizada(product.categoria)
  const newVisit: VisitedProduct = {
    id: product.id,
    nome: product.nome,
    categoriaId: normalizedCat,
    categoriaNome: product.categoria,
  }

  const updatedHistory = [...history, newVisit]
  writeHistory(updatedHistory)

  const uniqueProductsMap = new Map<string, VisitedProduct>()
  for (const item of updatedHistory) {
    uniqueProductsMap.set(item.id, item)
  }
  const uniqueProducts = Array.from(uniqueProductsMap.values())

  const groups: Record<string, VisitedProduct[]> = {}
  for (const p of uniqueProducts) {
    if (!groups[p.categoriaId]) {
      groups[p.categoriaId] = []
    }
    groups[p.categoriaId].push(p)
  }

  const threshold = 3
  
  for (const catId in groups) {
    const groupItems = groups[catId]
    if (groupItems.length >= threshold) {
      // Estado 'pending' evita que cliques repetidos disparem múltiplos timers paralelos
      setToastStatus('pending')
      setSuggestedCategory(groupItems[0].categoriaNome)
      setSuggestedIds(groupItems.map((item) => item.id))

      // Atraso de 10s para melhorar a experiência do usuário, não exibindo o prompt de imediato
      setTimeout(() => {
        setToastStatus('triggered')
        notifyStateChange()
      }, 10000)

      break
    }
  }
}

export function clearProductHistory() {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(HISTORY_KEY)
  sessionStorage.removeItem(STATUS_KEY)
  sessionStorage.removeItem(SUGGESTED_CAT_KEY)
  sessionStorage.removeItem(SUGGESTED_IDS_KEY)
  notifyStateChange()
}

export default function useProductTracker() {
  const [visible, setVisible] = useState(false)
  const [categoryName, setCategoryName] = useState<string | null>(null)
  const [productIdsToCompare, setProductIdsToCompare] = useState<string[]>([])

  const sync = () => {
    const status = getToastStatus()
    const isVisible = status === 'triggered'
    setVisible(isVisible)
    setCategoryName(isVisible ? getSuggestedCategory() : null)
    setProductIdsToCompare(isVisible ? getSuggestedIds() : [])
  }

  useEffect(() => {
    sync()
    window.addEventListener('lm-product-tracker-change', sync)

    // Recupera timer pendente se a página foi recarregada durante o delay
    const status = getToastStatus()
    let pendingTimer: NodeJS.Timeout | null = null
    if (status === 'pending') {
      pendingTimer = setTimeout(() => {
        setToastStatus('triggered')
        notifyStateChange()
      }, 10000)
    }

    if (DEMO_MODE && typeof window !== 'undefined') {
      (window as any).triggerDemoToast = () => {
        setToastStatus('triggered')
        setSuggestedCategory('Ferramentas (Demo)')
        const historyIds = readHistory().map(h => h.id)
        const demoIds = historyIds.length >= 2 ? historyIds : ['LM-0001', 'LM-0003']
        setSuggestedIds(demoIds)
        notifyStateChange()
      }
    }

    return () => {
      window.removeEventListener('lm-product-tracker-change', sync)
      if (pendingTimer) {
        clearTimeout(pendingTimer)
      }
    }
  }, [])

  function dismiss() {
    setToastStatus('dismissed')
    setSuggestedCategory(null)
    setSuggestedIds([])
    notifyStateChange()
  }

  function accept() {
    setToastStatus('accepted')
    const ids = getSuggestedIds()
    setSuggestedCategory(null)
    setSuggestedIds([])
    notifyStateChange()
    return ids
  }

  return {
    visible,
    categoryName,
    productIdsToCompare,
    trackProduct: trackProductView,
    dismiss,
    accept,
    clearHistory: clearProductHistory,
  }
}
