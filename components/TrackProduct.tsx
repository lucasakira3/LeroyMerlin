"use client"

import { useEffect } from 'react'
import { pushView } from '@/lib/hooks/useSuggestAgent'

interface TrackProps {
  id: string
  nome: string
  categoria: string
}

export default function TrackProduct({ categoria }: TrackProps) {
  useEffect(() => {
    if (categoria) {
      pushView(categoria)
    }
  }, [categoria])

  return null
}
