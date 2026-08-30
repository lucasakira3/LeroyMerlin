'use client'

import { useEffect, useState } from 'react'
import EntrevistaGuiada from './EntrevistaGuiada'
import { getUsuarioLogado } from '@/lib/clientAuth'

export default function SugestoesProjetoGuiado() {
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    const usuario = getUsuarioLogado()
    if (usuario) setEmail(usuario.email)
  }, [])

  if (!email) return null

  return <EntrevistaGuiada email={email} />
}
