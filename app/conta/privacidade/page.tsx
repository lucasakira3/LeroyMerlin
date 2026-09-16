'use client'

import { useEffect, useState } from 'react'
import PrivacidadeDados from '@/components/PrivacidadeDados'
import { getUsuarioLogado } from '@/lib/clientAuth'

export default function PrivacidadePage() {
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    const usuario = getUsuarioLogado()
    if (usuario) setEmail(usuario.email)
  }, [])

  if (!email) return null

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-4">Privacidade</h1>
      <PrivacidadeDados email={email} />
    </div>
  )
}
