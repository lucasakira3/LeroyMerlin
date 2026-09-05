"use client"

import { useEffect } from 'react'
import { trackProductView } from '@/lib/hooks/useProductTracker'

interface TrackProps {
  id: string
  nome: string
  categoria: string
}

// Ponte client-side pra registrar a visita a partir de app/produto/[id]/page.tsx, que é
// um server component (não pode chamar trackProductView, que usa sessionStorage, direto).
// Antes chamava lib/hooks/useSuggestAgent.ts, um segundo sistema de sugestão paralelo cujo
// componente de UI (SuggestBanner.tsx) nunca chegou a ser montado em lugar nenhum do app —
// então essa visita nunca virava sugestão visível pra ninguém. useProductTracker.ts é o
// sistema real (alimenta CompareToast.tsx, montado em app/layout.tsx).
export default function TrackProduct({ id, nome, categoria }: TrackProps) {
  useEffect(() => {
    if (id && nome && categoria) {
      trackProductView({ id, nome, categoria })
    }
  }, [id, nome, categoria])

  return null
}
